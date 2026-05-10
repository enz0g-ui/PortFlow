import { db } from "./db";
import { findChokepoint } from "./chokepoint-detector";
import { isVesselSanctioned } from "./uk-sanctions";
import { getStatic } from "./store";

/**
 * In-house ship-to-ship encounter detector. Replaces GFW's commercial-
 * restricted "encounters" dataset by computing our own from the
 * positions table.
 *
 * Algorithm (v1, restricted to chokepoint zones):
 *  1. Every SCAN_INTERVAL_MS (15 min), pull positions in the last
 *     SCAN_WINDOW_HOURS (4h) for each of the 12 chokepoint bboxes.
 *  2. For each chokepoint, group positions by mmsi → latest fix per
 *     vessel.
 *  3. For each pair (a, b) with a < b, walk their position streams
 *     in time order and check pairwise distance. Two vessels within
 *     ENCOUNTER_RADIUS_M (500m) for >ENCOUNTER_MIN_DURATION_HOURS (2h)
 *     count as an encounter.
 *  4. Persist a row in `encounters` table with a sanctioned snapshot
 *     for both vessels at first contact time.
 *
 * Why chokepoints only (v1):
 *  - Highest-value signal (Hormuz, Malacca, Bab el-Mandeb concentrate
 *    sanctions-evasion attempts).
 *  - Bounded compute (~50-200 vessels per zone vs thousands global).
 *  - O(N²) pair check stays under 50k haversine calls per tick.
 *
 * Future: extend to anchorages worldwide once spatial indexing is
 * added (R-tree extension or kd-bucket).
 */

const SCAN_INTERVAL_MS = 15 * 60_000;
const SCAN_WINDOW_HOURS = 4;
const ENCOUNTER_RADIUS_M = 500;
const ENCOUNTER_MIN_DURATION_HOURS = 2;
const TIME_BUCKET_MS = 5 * 60_000; // 5-min snapshots

// chokepoints are loaded lazily via findChokepoint
const R_M = 6_371_000;
function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R_M * Math.asin(Math.sqrt(a));
}

interface PositionRow {
  mmsi: number;
  ts: number;
  lat: number;
  lon: number;
}

interface ProximitySegment {
  startTs: number;
  endTs: number;
  distancesM: number[];
}

/**
 * For two vessels' time-ordered position streams, computes the segments
 * during which they were within ENCOUNTER_RADIUS_M continuously. Treats
 * gaps in either stream >2 × TIME_BUCKET_MS as breaking the segment.
 */
function findProximitySegments(
  posA: PositionRow[],
  posB: PositionRow[],
): ProximitySegment[] {
  const segments: ProximitySegment[] = [];
  let cur: ProximitySegment | null = null;

  // Build a sorted timeline from both vessels' positions, snapping each
  // to the nearest TIME_BUCKET_MS bucket. We resample by taking the
  // closest fix in each bucket per vessel; if either is missing, that
  // bucket is a gap.
  const bucketize = (positions: PositionRow[]): Map<number, PositionRow> => {
    const m = new Map<number, PositionRow>();
    for (const p of positions) {
      const bucket = Math.floor(p.ts / TIME_BUCKET_MS) * TIME_BUCKET_MS;
      const existing = m.get(bucket);
      if (!existing || Math.abs(p.ts - bucket) < Math.abs(existing.ts - bucket)) {
        m.set(bucket, p);
      }
    }
    return m;
  };

  const bucketsA = bucketize(posA);
  const bucketsB = bucketize(posB);
  const allBuckets = Array.from(
    new Set([...bucketsA.keys(), ...bucketsB.keys()]),
  ).sort((a, b) => a - b);

  for (const bucket of allBuckets) {
    const a = bucketsA.get(bucket);
    const b = bucketsB.get(bucket);
    const inProximity =
      a !== undefined &&
      b !== undefined &&
      haversineM(a.lat, a.lon, b.lat, b.lon) <= ENCOUNTER_RADIUS_M;
    if (inProximity) {
      const dist = haversineM(a!.lat, a!.lon, b!.lat, b!.lon);
      if (cur) {
        cur.endTs = bucket;
        cur.distancesM.push(dist);
      } else {
        cur = { startTs: bucket, endTs: bucket, distancesM: [dist] };
      }
    } else {
      if (cur) {
        segments.push(cur);
        cur = null;
      }
    }
  }
  if (cur) segments.push(cur);
  return segments;
}

export interface ScanResult {
  chokepointsScanned: number;
  vesselPairsChecked: number;
  newEncounters: number;
  ongoingEncounters: number;
}

export async function scanEncounters(): Promise<ScanResult> {
  const now = Date.now();
  const since = now - SCAN_WINDOW_HOURS * 3_600_000;

  // Load all positions in last 4h, then group by chokepoint client-side.
  // For 4h × ~10 chokepoint vessels-per-tick × 12 zones × 4 buckets/h ≈
  // few thousand rows. Tractable.
  const stmt = db().raw.prepare(
    `SELECT mmsi, ts, lat, lon FROM positions
     WHERE ts >= ?
     ORDER BY mmsi ASC, ts ASC`,
  );

  const byChokepoint = new Map<string, Map<number, PositionRow[]>>();
  let totalChokepointFixes = 0;
  for (const r of stmt.iterate(since) as IterableIterator<PositionRow>) {
    const cp = findChokepoint(r.lat, r.lon);
    if (!cp) continue;
    totalChokepointFixes++;
    let zone = byChokepoint.get(cp.id);
    if (!zone) {
      zone = new Map();
      byChokepoint.set(cp.id, zone);
    }
    let arr = zone.get(r.mmsi);
    if (!arr) {
      arr = [];
      zone.set(r.mmsi, arr);
    }
    arr.push(r);
  }

  if (byChokepoint.size === 0) {
    return {
      chokepointsScanned: 0,
      vesselPairsChecked: 0,
      newEncounters: 0,
      ongoingEncounters: 0,
    };
  }

  const insert = db().raw.prepare(
    `INSERT OR REPLACE INTO encounters
       (mmsi_a, mmsi_b, start_ts, end_ts, duration_h, median_distance_m,
        chokepoint_id, start_lat, start_lon,
        was_sanctioned_a, was_sanctioned_b, detected_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  let pairsChecked = 0;
  let newEncounters = 0;
  let ongoingEncounters = 0;

  for (const [chokepointId, vessels] of byChokepoint) {
    const mmsis = Array.from(vessels.keys()).sort((a, b) => a - b);
    for (let i = 0; i < mmsis.length; i++) {
      for (let j = i + 1; j < mmsis.length; j++) {
        const a = mmsis[i];
        const b = mmsis[j];
        pairsChecked++;
        const posA = vessels.get(a)!;
        const posB = vessels.get(b)!;
        const segments = findProximitySegments(posA, posB);
        for (const seg of segments) {
          const durationH = (seg.endTs - seg.startTs) / 3_600_000;
          if (durationH < ENCOUNTER_MIN_DURATION_HOURS) continue;
          const median =
            seg.distancesM.length > 0
              ? Math.round(
                  [...seg.distancesM].sort((x, y) => x - y)[
                    Math.floor(seg.distancesM.length / 2)
                  ],
                )
              : 0;
          const statA = getStatic(a);
          const statB = getStatic(b);
          const sanctionedA = isVesselSanctioned({
            mmsi: a,
            imo: (statA as { imo?: number } | undefined)?.imo ?? null,
          });
          const sanctionedB = isVesselSanctioned({
            mmsi: b,
            imo: (statB as { imo?: number } | undefined)?.imo ?? null,
          });
          const startPos = posA.find((p) => p.ts >= seg.startTs) ?? posA[0];
          insert.run(
            a,
            b,
            seg.startTs,
            seg.endTs,
            Math.round(durationH * 10) / 10,
            median,
            chokepointId,
            startPos.lat,
            startPos.lon,
            sanctionedA ? 1 : 0,
            sanctionedB ? 1 : 0,
            now,
            now,
          );
          // We use INSERT OR REPLACE so re-detecting the same encounter
          // (same mmsi_a, mmsi_b, start_ts) just updates the row. New
          // unique start_ts → new encounter.
          newEncounters++;
        }
      }
    }
  }

  return {
    chokepointsScanned: byChokepoint.size,
    vesselPairsChecked: pairsChecked,
    newEncounters,
    ongoingEncounters,
  };
}

export interface EncounterRow {
  id: number;
  mmsiA: number;
  mmsiB: number;
  startTs: number;
  endTs: number | null;
  durationH: number | null;
  medianDistanceM: number | null;
  chokepointId: string | null;
  startLat: number;
  startLon: number;
  wasSanctionedA: boolean;
  wasSanctionedB: boolean;
}

export function listEncounters(opts: {
  mmsi?: number;
  chokepointId?: string;
  sanctionedOnly?: boolean;
  daysBack?: number;
  limit?: number;
}): EncounterRow[] {
  const days = Math.max(1, Math.min(365, opts.daysBack ?? 90));
  const limit = Math.max(1, Math.min(1000, opts.limit ?? 100));
  const since = Date.now() - days * 86_400_000;
  const where: string[] = ["start_ts >= ?"];
  const params: (string | number)[] = [since];
  if (opts.mmsi) {
    where.push("(mmsi_a = ? OR mmsi_b = ?)");
    params.push(opts.mmsi, opts.mmsi);
  }
  if (opts.chokepointId) {
    where.push("chokepoint_id = ?");
    params.push(opts.chokepointId);
  }
  if (opts.sanctionedOnly) {
    where.push("(was_sanctioned_a = 1 OR was_sanctioned_b = 1)");
  }
  params.push(limit);
  const rows = db()
    .raw.prepare(
      `SELECT id, mmsi_a, mmsi_b, start_ts, end_ts, duration_h,
              median_distance_m, chokepoint_id, start_lat, start_lon,
              was_sanctioned_a, was_sanctioned_b
       FROM encounters
       WHERE ${where.join(" AND ")}
       ORDER BY start_ts DESC
       LIMIT ?`,
    )
    .all(...params) as unknown as Array<{
    id: number;
    mmsi_a: number;
    mmsi_b: number;
    start_ts: number;
    end_ts: number | null;
    duration_h: number | null;
    median_distance_m: number | null;
    chokepoint_id: string | null;
    start_lat: number;
    start_lon: number;
    was_sanctioned_a: number;
    was_sanctioned_b: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    mmsiA: r.mmsi_a,
    mmsiB: r.mmsi_b,
    startTs: r.start_ts,
    endTs: r.end_ts,
    durationH: r.duration_h,
    medianDistanceM: r.median_distance_m,
    chokepointId: r.chokepoint_id,
    startLat: r.start_lat,
    startLon: r.start_lon,
    wasSanctionedA: r.was_sanctioned_a === 1,
    wasSanctionedB: r.was_sanctioned_b === 1,
  }));
}

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastResult: ScanResult | null = null;

export function startEncounterDetector(): void {
  if (_intervalId) return;
  _intervalId = setInterval(async () => {
    try {
      _lastResult = await scanEncounters();
      if (_lastResult.newEncounters > 0) {
        console.log(
          `[encounter-detector] new=${_lastResult.newEncounters} pairs=${_lastResult.vesselPairsChecked} chokepoints=${_lastResult.chokepointsScanned}`,
        );
      }
    } catch (err) {
      console.error("[encounter-detector] tick failed", err);
    }
  }, SCAN_INTERVAL_MS);
}

export function getEncounterDetectorStatus() {
  return {
    started: _intervalId !== null,
    lastResult: _lastResult,
  };
}
