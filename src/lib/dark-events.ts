import { db } from "./db";
import { PORTS } from "./ports";

/**
 * Dark fleet detection: find AIS-off "gap" events on our position history.
 *
 * Algorithm derived from Welch et al. 2022 (Science Advances) and the
 * published Global Fishing Watch gap-event criteria. We implement it
 * server-side over our own AIS feed (aisstream.io terrestrial) — no
 * dependency on third-party data, so the output can be redistributed
 * commercially under our own license.
 *
 * Citation for the /methodology page:
 *   Welch, H., Clavelle, T., White, T.D., et al. (2022). "Hot spots of
 *   unseen fishing vessels". Science Advances 8 (44).
 *   https://doi.org/10.1126/sciadv.abq2109
 *
 * v1 simplified criteria:
 *   - gap >= 12 hours between two consecutive positions for the same MMSI
 *   - vessel state at gap_start is 'underway' (we ignore moored / anchored
 *     standstills, which are operationally normal — a vessel at berth that
 *     stops emitting for 12h is not "going dark", it's just docked)
 *   - vessel had >= 14 positions in the 12 hours preceding the gap (proves
 *     the feed was healthy for that MMSI, so the silence is suspicious not
 *     a coverage gap)
 *
 * Future iterations (v2+):
 *   - distance-to-shore filter (>= 50 nm) to exclude near-shore noise
 *   - reception-quality grid to exclude AIS dead zones
 *   - cross-reference with Sentinel-1 SAR detections (already in our DB)
 *   - cross-reference with VIIRS once EOG credentials arrive
 */

export interface DarkEvent {
  id: number;
  mmsi: number;
  startTs: number;
  endTs: number | null;
  durationHours: number | null;
  startLat: number;
  startLon: number;
  endLat: number | null;
  endLon: number | null;
  nPriorPositions: number;
  startState: string | null;
  startZone: string | null;
  startPort: string | null;
  detectedAt: number;
}

const MIN_GAP_HOURS = 12;
const MIN_PRIOR_POSITIONS = 14;
const PRIOR_WINDOW_HOURS = 12;

// Match a coordinate to the nearest known port (for grouping events by port
// in the UI). Best-effort: returns the port id whose bbox contains the point,
// or null if the point isn't near any tracked port.
function nearestPort(lat: number, lon: number): string | null {
  for (const p of PORTS) {
    const [minLat, minLon, maxLat, maxLon] = p.bbox;
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      return p.id;
    }
  }
  return null;
}

interface PositionRow {
  mmsi: number;
  ts: number;
  lat: number;
  lon: number;
  state: string | null;
  zone: string | null;
}

/**
 * Scan the positions table for new gap events that closed within the given
 * window, plus check existing open events to see if the vessel reappeared.
 *
 * Returns the number of dark events detected (newly opened) and closed.
 *
 * Designed to be safe to re-run frequently — UNIQUE(mmsi, start_ts) on the
 * dark_events table dedupes naturally.
 */
export function detectDarkEvents(opts: {
  /** How far back to scan, in ms. Default 7 days. */
  sinceMs?: number;
}): { opened: number; closed: number; scanned: number } {
  const sinceMs = opts.sinceMs ?? 7 * 24 * 3_600_000;
  const cutoff = Date.now() - sinceMs;

  // We stream the positions row-by-row via SQLite's iterator API instead of
  // .all() — a 24h window can be ~6 M rows for a busy port, and loading
  // them all into JS heap pushes node:sqlite past its 1 GB limit (OOM
  // crash, worker restart loop). With .iterate(), heap stays flat.
  //
  // Rows arrive ordered by (mmsi, ts), so we maintain a small per-MMSI
  // sliding window of the last PRIOR_WINDOW_HOURS positions to evaluate
  // each candidate gap as it appears.
  const stmt = db().raw.prepare(
    `SELECT mmsi, ts, lat, lon, state, zone
     FROM positions
     WHERE ts >= ?
     ORDER BY mmsi ASC, ts ASC`,
  );

  const insertEvent = db().raw.prepare(
    `INSERT OR IGNORE INTO dark_events
       (mmsi, start_ts, start_lat, start_lon, n_prior_positions,
        start_state, start_zone, start_port, detected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const closeEvent = db().raw.prepare(
    `UPDATE dark_events
     SET end_ts = ?, end_lat = ?, end_lon = ?, duration_hours = ?
     WHERE mmsi = ? AND start_ts = ? AND end_ts IS NULL`,
  );

  let opened = 0;
  let closed = 0;
  let scanned = 0;
  const now = Date.now();

  // Per-MMSI sliding window of recent positions. Reset whenever the MMSI
  // changes (rows are ordered by mmsi). We only keep PRIOR_WINDOW_HOURS-h
  // worth, so memory is bounded to the busiest vessel's recent reports
  // (typically <100 entries).
  let currentMmsi: number | null = null;
  let prior: PositionRow[] = [];
  let prev: PositionRow | null = null;

  for (const r of stmt.iterate(cutoff) as IterableIterator<PositionRow>) {
    scanned++;
    if (r.mmsi !== currentMmsi) {
      currentMmsi = r.mmsi;
      prior = [];
      prev = null;
    }

    if (prev) {
      const gapH = (r.ts - prev.ts) / 3_600_000;
      if (gapH >= MIN_GAP_HOURS && prev.state === "underway") {
        // Count how many positions in `prior` fall within the 12h window
        // before the gap (`prev.ts` is the last position before silence).
        const priorCutoff = prev.ts - PRIOR_WINDOW_HOURS * 3_600_000;
        let priorCount = 0;
        for (let k = prior.length - 1; k >= 0; k--) {
          if (prior[k].ts < priorCutoff) break;
          priorCount++;
        }
        if (priorCount >= MIN_PRIOR_POSITIONS) {
          const portId = nearestPort(prev.lat, prev.lon);
          const ins = insertEvent.run(
            r.mmsi,
            prev.ts,
            prev.lat,
            prev.lon,
            priorCount,
            prev.state,
            prev.zone,
            portId,
            now,
          );
          if (ins.changes > 0) opened++;
          const cls = closeEvent.run(
            r.ts,
            r.lat,
            r.lon,
            gapH,
            r.mmsi,
            prev.ts,
          );
          if (cls.changes > 0) closed++;
        }
      }
    }

    // Maintain sliding window: append, then trim from the head anything
    // older than PRIOR_WINDOW_HOURS relative to the current row.
    prior.push(r);
    const windowFloor = r.ts - PRIOR_WINDOW_HOURS * 3_600_000;
    while (prior.length > 0 && prior[0].ts < windowFloor) prior.shift();
    prev = r;
  }

  return { opened, closed, scanned };
}

/**
 * Query recent dark events for a port, optionally constrained to N days back.
 * Includes both closed events (vessel reappeared) and currently-open ones.
 */
export function listDarkEvents(opts: {
  port?: string;
  days?: number;
  limit?: number;
}): DarkEvent[] {
  const days = opts.days ?? 30;
  const limit = Math.min(opts.limit ?? 200, 1000);
  const since = Date.now() - days * 24 * 3_600_000;

  const where: string[] = ["start_ts >= ?"];
  const params: (string | number)[] = [since];
  if (opts.port) {
    where.push("start_port = ?");
    params.push(opts.port);
  }
  params.push(limit);

  const rows = db()
    .raw.prepare(
      `SELECT id, mmsi, start_ts, end_ts, duration_hours,
              start_lat, start_lon, end_lat, end_lon,
              n_prior_positions, start_state, start_zone, start_port,
              detected_at
       FROM dark_events
       WHERE ${where.join(" AND ")}
       ORDER BY start_ts DESC
       LIMIT ?`,
    )
    .all(...params) as unknown as Array<{
    id: number;
    mmsi: number;
    start_ts: number;
    end_ts: number | null;
    duration_hours: number | null;
    start_lat: number;
    start_lon: number;
    end_lat: number | null;
    end_lon: number | null;
    n_prior_positions: number;
    start_state: string | null;
    start_zone: string | null;
    start_port: string | null;
    detected_at: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    mmsi: r.mmsi,
    startTs: r.start_ts,
    endTs: r.end_ts,
    durationHours: r.duration_hours,
    startLat: r.start_lat,
    startLon: r.start_lon,
    endLat: r.end_lat,
    endLon: r.end_lon,
    nPriorPositions: r.n_prior_positions,
    startState: r.start_state,
    startZone: r.start_zone,
    startPort: r.start_port,
    detectedAt: r.detected_at,
  }));
}

/**
 * Run the detector continuously in the background. Idempotent — safe to call
 * multiple times (UNIQUE(mmsi, start_ts) prevents duplicates).
 *
 * Cadence: every hour we scan the last 7 days. New gaps that closed in the
 * last hour will be detected; old gaps are no-op'd by the unique constraint.
 *
 * For initial backfill, call detectDarkEvents({ sinceMs: 30 * 86_400_000 })
 * once at boot before starting the interval.
 */
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastRunAt = 0;
let _lastRunResult: { opened: number; closed: number; scanned: number } | null =
  null;

export function startDarkEventsScanner(opts?: {
  intervalMs?: number;
}): void {
  if (_intervalId) return; // already started
  const intervalMs = opts?.intervalMs ?? 3_600_000; // 1h default

  // No boot-time backfill: the synchronous SQLite scan over millions of
  // positions blocks the event loop long enough for PM2 / Cloudflare to
  // mark the worker as unhealthy. The first tick fires `intervalMs` after
  // boot — by then the worker is warm and the AIS feed is steady.
  //
  // To populate historical events on demand (e.g. after a fresh deploy),
  // the operator can hit a future /api/admin/exec command or temporarily
  // call `detectDarkEvents({ sinceMs: 7 * 86_400_000 })` from a one-off
  // node script.

  _intervalId = setInterval(() => {
    try {
      // Tick scans only the last 24h — enough to catch newly-closed gaps
      // without re-scanning the entire window every hour. With sub-second
      // SQL latency on a 24h window (~50k-100k rows), this fits in one
      // event-loop tick without HTTP starvation.
      const r = detectDarkEvents({ sinceMs: 86_400_000 });
      _lastRunAt = Date.now();
      _lastRunResult = r;
      if (r.opened > 0 || r.closed > 0) {
        console.log(
          `[dark-events] tick: opened=${r.opened} closed=${r.closed} scanned=${r.scanned}`,
        );
      }
    } catch (err) {
      console.error("[dark-events] tick failed", err);
    }
  }, intervalMs);
}

export function getDarkEventsStatus() {
  return {
    started: _intervalId !== null,
    lastRunAt: _lastRunAt || null,
    lastRunResult: _lastRunResult,
  };
}
