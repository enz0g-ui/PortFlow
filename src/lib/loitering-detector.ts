import { db } from "./db";
import { PORTS } from "./ports";
import { isVesselSanctioned } from "./uk-sanctions";
import { getStatic } from "./store";

/**
 * In-house loitering detector. Replaces GFW's commercial-restricted
 * "loitering" dataset.
 *
 * Definition (matches GFW): vessel with SOG < 2 kn for >2 hours
 * continuously, far from any port (>10 nm from any port center).
 *
 * Distinct from `dark-events` which detects total AIS silence;
 * loitering is "AIS still on but vessel barely moving in open water" —
 * typical staging behaviour before a ship-to-ship transfer or an
 * unauthorized bunkering operation.
 *
 * Algorithm: every SCAN_INTERVAL_MS (30 min), stream the positions
 * table for the last SCAN_WINDOW_HOURS (8h), tracking per-MMSI runs
 * of slow + far-from-port fixes. When a run exceeds 2h, persist a row.
 */

const SCAN_INTERVAL_MS = 30 * 60_000;
const SCAN_WINDOW_HOURS = 8;
const SLOW_SOG_KN = 2.0;
const MIN_DURATION_HOURS = 2;
const FAR_FROM_PORT_NM = 10;
const MAX_GAP_HOURS = 1; // a >1h gap breaks a loitering run

interface PositionRow {
  mmsi: number;
  ts: number;
  lat: number;
  lon: number;
  sog: number | null;
}

const NM_PER_DEG_LAT = 60;
function approxDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = (lat1 - lat2) * NM_PER_DEG_LAT;
  const dLon =
    (lon1 - lon2) * NM_PER_DEG_LAT * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function farFromAnyPort(lat: number, lon: number): boolean {
  for (const p of PORTS) {
    if (
      approxDistanceNm(lat, lon, p.center[0], p.center[1]) < FAR_FROM_PORT_NM
    ) {
      return false;
    }
  }
  return true;
}

interface RunState {
  startTs: number;
  startLat: number;
  startLon: number;
  lastTs: number;
  lastLat: number;
  lastLon: number;
  sogSum: number;
  sogCount: number;
}

export interface LoiteringScanResult {
  positionsScanned: number;
  newEvents: number;
}

export async function scanLoitering(): Promise<LoiteringScanResult> {
  const now = Date.now();
  const since = now - SCAN_WINDOW_HOURS * 3_600_000;
  const stmt = db().raw.prepare(
    `SELECT mmsi, ts, lat, lon, sog FROM positions
     WHERE ts >= ?
     ORDER BY mmsi ASC, ts ASC`,
  );

  const insert = db().raw.prepare(
    `INSERT OR REPLACE INTO loitering_events
       (mmsi, start_ts, end_ts, duration_h, avg_speed_kn,
        start_lat, start_lon, end_lat, end_lon,
        was_sanctioned, detected_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const minDurationMs = MIN_DURATION_HOURS * 3_600_000;
  let positionsScanned = 0;
  let newEvents = 0;
  let currentMmsi: number | null = null;
  let run: RunState | null = null;

  const closeRun = (mmsi: number, end: RunState) => {
    const durationMs = end.lastTs - end.startTs;
    if (durationMs < minDurationMs) return;
    const stat = getStatic(mmsi);
    const sanctioned = isVesselSanctioned({
      mmsi,
      imo: (stat as { imo?: number } | undefined)?.imo ?? null,
    });
    insert.run(
      mmsi,
      end.startTs,
      end.lastTs,
      Math.round((durationMs / 3_600_000) * 10) / 10,
      end.sogCount > 0 ? Math.round((end.sogSum / end.sogCount) * 100) / 100 : 0,
      end.startLat,
      end.startLon,
      end.lastLat,
      end.lastLon,
      sanctioned ? 1 : 0,
      now,
      now,
    );
    newEvents++;
  };

  for (const r of stmt.iterate(since) as IterableIterator<PositionRow>) {
    positionsScanned++;
    if (r.mmsi !== currentMmsi) {
      if (currentMmsi !== null && run) closeRun(currentMmsi, run);
      currentMmsi = r.mmsi;
      run = null;
    }
    const sog = typeof r.sog === "number" && r.sog >= 0 ? r.sog : 0;
    const isSlow = sog < SLOW_SOG_KN;
    const isFar = farFromAnyPort(r.lat, r.lon);
    const inLoiter = isSlow && isFar;

    if (inLoiter) {
      if (run) {
        const gapMs = r.ts - run.lastTs;
        if (gapMs > MAX_GAP_HOURS * 3_600_000) {
          // gap too long → close prev run, start new
          closeRun(currentMmsi!, run);
          run = {
            startTs: r.ts,
            startLat: r.lat,
            startLon: r.lon,
            lastTs: r.ts,
            lastLat: r.lat,
            lastLon: r.lon,
            sogSum: sog,
            sogCount: 1,
          };
        } else {
          run.lastTs = r.ts;
          run.lastLat = r.lat;
          run.lastLon = r.lon;
          run.sogSum += sog;
          run.sogCount++;
        }
      } else {
        run = {
          startTs: r.ts,
          startLat: r.lat,
          startLon: r.lon,
          lastTs: r.ts,
          lastLat: r.lat,
          lastLon: r.lon,
          sogSum: sog,
          sogCount: 1,
        };
      }
    } else {
      if (run) {
        closeRun(currentMmsi!, run);
        run = null;
      }
    }
  }
  if (currentMmsi !== null && run) closeRun(currentMmsi, run);

  return { positionsScanned, newEvents };
}

export interface LoiteringRow {
  id: number;
  mmsi: number;
  startTs: number;
  endTs: number | null;
  durationH: number | null;
  avgSpeedKn: number | null;
  startLat: number;
  startLon: number;
  endLat: number | null;
  endLon: number | null;
  wasSanctioned: boolean;
}

export function listLoiteringEvents(opts: {
  mmsi?: number;
  sanctionedOnly?: boolean;
  daysBack?: number;
  limit?: number;
}): LoiteringRow[] {
  const days = Math.max(1, Math.min(365, opts.daysBack ?? 90));
  const limit = Math.max(1, Math.min(1000, opts.limit ?? 100));
  const since = Date.now() - days * 86_400_000;
  const where: string[] = ["start_ts >= ?"];
  const params: (string | number)[] = [since];
  if (opts.mmsi) {
    where.push("mmsi = ?");
    params.push(opts.mmsi);
  }
  if (opts.sanctionedOnly) where.push("was_sanctioned = 1");
  params.push(limit);
  const rows = db()
    .raw.prepare(
      `SELECT id, mmsi, start_ts, end_ts, duration_h, avg_speed_kn,
              start_lat, start_lon, end_lat, end_lon, was_sanctioned
       FROM loitering_events
       WHERE ${where.join(" AND ")}
       ORDER BY start_ts DESC
       LIMIT ?`,
    )
    .all(...params) as unknown as Array<{
    id: number;
    mmsi: number;
    start_ts: number;
    end_ts: number | null;
    duration_h: number | null;
    avg_speed_kn: number | null;
    start_lat: number;
    start_lon: number;
    end_lat: number | null;
    end_lon: number | null;
    was_sanctioned: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    mmsi: r.mmsi,
    startTs: r.start_ts,
    endTs: r.end_ts,
    durationH: r.duration_h,
    avgSpeedKn: r.avg_speed_kn,
    startLat: r.start_lat,
    startLon: r.start_lon,
    endLat: r.end_lat,
    endLon: r.end_lon,
    wasSanctioned: r.was_sanctioned === 1,
  }));
}

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastResult: LoiteringScanResult | null = null;

export function startLoiteringDetector(): void {
  if (_intervalId) return;
  _intervalId = setInterval(async () => {
    try {
      _lastResult = await scanLoitering();
      if (_lastResult.newEvents > 0) {
        console.log(
          `[loitering-detector] new=${_lastResult.newEvents} positions=${_lastResult.positionsScanned}`,
        );
      }
    } catch (err) {
      console.error("[loitering-detector] tick failed", err);
    }
  }, SCAN_INTERVAL_MS);
}

export function getLoiteringDetectorStatus() {
  return {
    started: _intervalId !== null,
    lastResult: _lastResult,
  };
}
