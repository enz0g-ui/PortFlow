import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "./db";
import { getStatic } from "./store";
import { isVesselSanctioned } from "./uk-sanctions";

/**
 * Vessel-transit detector for known maritime chokepoints.
 *
 * On each tick:
 *  1. Pulls the last `SCAN_WINDOW_MIN` minutes of positions (cheap query —
 *     positions table is indexed on ts).
 *  2. For each position, tests bbox membership against ~12 chokepoint
 *     polygons (loaded once at boot from public/data/chokepoints.geojson).
 *  3. If a vessel is detected inside a chokepoint:
 *     - Open a new `chokepoint_transits` row if no open one exists.
 *     - Update `exited_at` continuously while inside.
 *     - Capture `was_sanctioned` snapshot at entry time (UKSL lookup).
 *  4. After grace period without seeing the vessel, it stays "exited" —
 *     but we don't actively close transits because positions polling
 *     handles the natural exit (last-seen timestamp).
 *
 * Cadence: every 5 minutes — bounded memory, bounded SQL cost, fits comfortably
 * in the event loop.
 */

interface Chokepoint {
  id: string;
  name: string;
  // Bounding box (we use rectangles for v1 — exact polygon match is overkill
  // for chokepoints which are themselves narrow lat/lon ranges).
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

interface ChokepointGeoJSON {
  features: Array<{
    properties: { id: string; name: string };
    geometry: {
      type: "Polygon";
      coordinates: Array<Array<[number, number]>>;
    };
  }>;
}

let _chokepoints: Chokepoint[] = [];

async function loadChokepoints(): Promise<Chokepoint[]> {
  if (_chokepoints.length > 0) return _chokepoints;
  try {
    const path = resolve(
      process.cwd(),
      "public/data/chokepoints.geojson",
    );
    const text = await readFile(path, "utf-8");
    const json = JSON.parse(text) as ChokepointGeoJSON;
    _chokepoints = json.features.map((f) => {
      // Compute bbox from polygon ring (first ring only — we don't have
      // any chokepoints with holes).
      const ring = f.geometry.coordinates[0];
      let minLon = Infinity,
        maxLon = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity;
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      return {
        id: f.properties.id,
        name: f.properties.name,
        minLon,
        maxLon,
        minLat,
        maxLat,
      };
    });
    console.log(`[chokepoint-detector] loaded ${_chokepoints.length} zones`);
    return _chokepoints;
  } catch (err) {
    console.error("[chokepoint-detector] failed to load chokepoints", err);
    return [];
  }
}

/**
 * Synchronous chokepoint loader for boot-time consumers (e.g. AIS worker
 * subscription which is set up before the async scanner has run). Reads
 * the GeoJSON once and caches; safe to call repeatedly.
 */
export function loadChokepointsSync(): Chokepoint[] {
  if (_chokepoints.length > 0) return _chokepoints;
  try {
    const path = resolve(process.cwd(), "public/data/chokepoints.geojson");
    const json = JSON.parse(readFileSync(path, "utf-8")) as ChokepointGeoJSON;
    _chokepoints = json.features.map((f) => {
      const ring = f.geometry.coordinates[0];
      let minLon = Infinity,
        maxLon = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity;
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      return { id: f.properties.id, name: f.properties.name, minLon, maxLon, minLat, maxLat };
    });
    return _chokepoints;
  } catch (err) {
    console.error("[chokepoint-detector] sync load failed", err);
    return [];
  }
}

/**
 * Returns chokepoint bboxes in aisstream subscription format
 * `[[minLat, minLon], [maxLat, maxLon]]`. Used by the AIS worker to
 * extend the live subscription beyond the 51-port footprint so we
 * actually receive vessel positions inside chokepoints (Hormuz,
 * Bab el-Mandeb, Malacca, Magellan, Cape of Good Hope are all far
 * from any subscribed port).
 */
export function getChokepointSubscriptionBboxes(): Array<
  [[number, number], [number, number]]
> {
  return loadChokepointsSync().map((c) => [
    [c.minLat, c.minLon],
    [c.maxLat, c.maxLon],
  ]);
}

function chokepointFor(lat: number, lon: number): Chokepoint | null {
  for (const c of _chokepoints) {
    if (
      lon >= c.minLon &&
      lon <= c.maxLon &&
      lat >= c.minLat &&
      lat <= c.maxLat
    ) {
      return c;
    }
  }
  return null;
}

interface PositionRow {
  mmsi: number;
  ts: number;
  lat: number;
  lon: number;
}

const SCAN_WINDOW_MIN = 10;
const REENTRY_COOLDOWN_HOURS = 6;
const SCANNER_INTERVAL_MS = 5 * 60_000;

export async function scanChokepointTransits(): Promise<{
  inside: number;
  newEntries: number;
  updates: number;
}> {
  await loadChokepoints();
  if (_chokepoints.length === 0)
    return { inside: 0, newEntries: 0, updates: 0 };

  const cutoff = Date.now() - SCAN_WINDOW_MIN * 60_000;
  const reentryCutoff = Date.now() - REENTRY_COOLDOWN_HOURS * 3_600_000;

  // Pull positions across the bbox of ALL chokepoints — using lat/lon WHERE
  // clauses would force one query per chokepoint; instead we filter in JS
  // (~50k rows / 5 min × 12 bboxes is fine).
  // Stream via iterate() to keep heap flat.
  const stmt = db().raw.prepare(
    `SELECT mmsi, ts, lat, lon FROM positions
     WHERE ts >= ?
     ORDER BY mmsi ASC, ts ASC`,
  );

  const insertEntry = db().raw.prepare(
    `INSERT INTO chokepoint_transits
       (mmsi, chokepoint_id, entered_at, entry_lat, entry_lon,
        was_sanctioned, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const updateExit = db().raw.prepare(
    `UPDATE chokepoint_transits
     SET exited_at = ?, exit_lat = ?, exit_lon = ?, updated_at = ?
     WHERE id = ?`,
  );
  const findOpen = db().raw.prepare(
    `SELECT id FROM chokepoint_transits
     WHERE mmsi = ? AND chokepoint_id = ?
       AND (exited_at IS NULL OR exited_at >= ?)
     ORDER BY entered_at DESC LIMIT 1`,
  );

  let inside = 0;
  let newEntries = 0;
  let updates = 0;
  const now = Date.now();

  for (const r of stmt.iterate(cutoff) as IterableIterator<PositionRow>) {
    const cp = chokepointFor(r.lat, r.lon);
    if (!cp) continue;
    inside++;

    // Find an open transit (entered, not exited) OR a recently-closed one
    // (within cooldown) — if found, just update exit timestamp.
    const open = findOpen.get(r.mmsi, cp.id, reentryCutoff) as
      | { id: number }
      | undefined;
    if (open) {
      updateExit.run(r.ts, r.lat, r.lon, now, open.id);
      updates++;
    } else {
      const stat = getStatic(r.mmsi);
      const sanctioned = isVesselSanctioned({
        mmsi: r.mmsi,
        imo: (stat as { imo?: number } | undefined)?.imo ?? null,
      });
      insertEntry.run(
        r.mmsi,
        cp.id,
        r.ts,
        r.lat,
        r.lon,
        sanctioned ? 1 : 0,
        now,
        now,
      );
      newEntries++;
    }
  }

  return { inside, newEntries, updates };
}

export interface ChokepointTransit {
  id: number;
  mmsi: number;
  chokepointId: string;
  enteredAt: number;
  exitedAt: number | null;
  entryLat: number;
  entryLon: number;
  exitLat: number | null;
  exitLon: number | null;
  wasSanctioned: boolean;
}

export function listChokepointTransits(opts: {
  chokepointId?: string;
  sanctionedOnly?: boolean;
  daysBack?: number;
  limit?: number;
}): ChokepointTransit[] {
  const days = Math.max(1, Math.min(365, opts.daysBack ?? 30));
  const limit = Math.max(1, Math.min(1000, opts.limit ?? 200));
  const since = Date.now() - days * 86_400_000;
  const where: string[] = ["entered_at >= ?"];
  const params: (string | number)[] = [since];
  if (opts.chokepointId) {
    where.push("chokepoint_id = ?");
    params.push(opts.chokepointId);
  }
  if (opts.sanctionedOnly) {
    where.push("was_sanctioned = 1");
  }
  params.push(limit);
  const rows = db()
    .raw.prepare(
      `SELECT id, mmsi, chokepoint_id, entered_at, exited_at,
              entry_lat, entry_lon, exit_lat, exit_lon, was_sanctioned
       FROM chokepoint_transits
       WHERE ${where.join(" AND ")}
       ORDER BY entered_at DESC
       LIMIT ?`,
    )
    .all(...params) as unknown as Array<{
    id: number;
    mmsi: number;
    chokepoint_id: string;
    entered_at: number;
    exited_at: number | null;
    entry_lat: number;
    entry_lon: number;
    exit_lat: number | null;
    exit_lon: number | null;
    was_sanctioned: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    mmsi: r.mmsi,
    chokepointId: r.chokepoint_id,
    enteredAt: r.entered_at,
    exitedAt: r.exited_at,
    entryLat: r.entry_lat,
    entryLon: r.entry_lon,
    exitLat: r.exit_lat,
    exitLon: r.exit_lon,
    wasSanctioned: r.was_sanctioned === 1,
  }));
}

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastRunAt = 0;

export function startChokepointDetector(): void {
  if (_intervalId) return;
  _intervalId = setInterval(async () => {
    try {
      const r = await scanChokepointTransits();
      _lastRunAt = Date.now();
      if (r.newEntries > 0) {
        console.log(
          `[chokepoint-detector] new entries: ${r.newEntries} (updates: ${r.updates})`,
        );
      }
    } catch (err) {
      console.error("[chokepoint-detector] tick failed", err);
    }
  }, SCANNER_INTERVAL_MS);
}

export function getChokepointDetectorStatus() {
  return {
    started: _intervalId !== null,
    lastRunAt: _lastRunAt || null,
    chokepointsLoaded: _chokepoints.length,
  };
}
