/**
 * Dynamic anomaly thresholds — P50 / P95 of dwell-at-anchor times per
 * (port, cargo_class) from the positions table. Cached in SQLite, refreshed
 * by a background job every 6 hours. Falls back to hardcoded values when
 * no row is available yet (cold start / port with < MIN_SAMPLES history).
 *
 * Design choice: snapshot in DB rather than recompute on each request.
 * The dashboard polls /api/anomalies every 30 s for 50+ ports — recomputing
 * on every call would burn CPU on a 24M-row positions table for no reason.
 * Recompute cadence (6 h) chosen against expected thresholds drift (slow:
 * port congestion shifts over weeks, not hours).
 */
import { db } from "./db";
import { PORTS } from "./ports";
import type { CargoClass } from "./types";

export interface AnomalyThreshold {
  port: string;
  cargoClass: CargoClass | null;
  warnH: number;
  criticalH: number;
  nSamples: number;
  isDynamic: boolean; // false = fallback to hardcoded
}

const HARDCODED_FALLBACK: Record<"tanker" | "container" | "default", {
  warn: number;
  critical: number;
}> = {
  tanker: { warn: 12, critical: 48 },
  container: { warn: 6, critical: 24 },
  default: { warn: 18, critical: 72 },
};

const TANKER_SET = new Set<CargoClass>([
  "crude",
  "product",
  "chemical",
  "lng",
  "lpg",
]);

const MIN_SAMPLES = 20;
const RECOMPUTE_WINDOW_DAYS = 30;
const RECOMPUTE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

function bucketForCargo(
  cargoClass: CargoClass | undefined,
): "tanker" | "container" | "default" {
  if (cargoClass && TANKER_SET.has(cargoClass)) return "tanker";
  if (cargoClass === "container") return "container";
  return "default";
}

function fallbackThreshold(
  port: string,
  cargoClass: CargoClass | undefined,
): AnomalyThreshold {
  const bucket = bucketForCargo(cargoClass);
  const { warn, critical } = HARDCODED_FALLBACK[bucket];
  return {
    port,
    cargoClass: cargoClass ?? null,
    warnH: warn,
    criticalH: critical,
    nSamples: 0,
    isDynamic: false,
  };
}

/**
 * Returns the threshold (warn, critical) for the (port, cargo) pair.
 * Reads from the anomaly_thresholds cache; falls back to hardcoded if the
 * cache has no qualifying row.
 *
 * **v1 — pooled cargo, fan-out per port**
 *
 * recomputeThresholds() currently pools sessions globally by cargo class
 * (one P50/P95 per cargo over ALL ports) and writes the SAME values to
 * every PORTS row. That means today, querying (port="rotterdam",
 * cargo="crude") and (port="houston", cargo="crude") returns identical
 * thresholds — the per-port dimension exists in the schema but isn't
 * yet driven by per-port data.
 *
 * **v2 path — per-port refinement (not implemented yet)**
 *
 * When a port accumulates ≥MIN_SAMPLES of its own anchored-dwell
 * sessions, we want its threshold to switch from "pooled cargo" to
 * "port-specific" automatically. The plan:
 *   1. recomputeThresholds() computes BOTH the pooled-cargo aggregate
 *      AND a per-port aggregate.
 *   2. For each (port, cargo): if per-port n_samples ≥ MIN_SAMPLES,
 *      write port-specific values; else write the pool values (current
 *      behaviour).
 *   3. Surface this transition in the UI — the threshold metadata
 *      already carries isDynamic + nSamples; we could add a
 *      `source: "pool" | "port-specific"` field.
 *
 * **Why this matters**: without this fan-out, a port that just crossed
 * the MIN_SAMPLES bar would see its scores jump discontinuously
 * (pooled-cargo threshold replaced by tighter port-specific one).
 * Future-you will need to audit when this kicks in.
 *
 * Until v2 ships, all rows in anomaly_thresholds are derived from
 * pool-level statistics; the per-port row is a copy.
 */
export function getThreshold(
  port: string,
  cargoClass: CargoClass | undefined,
): AnomalyThreshold {
  try {
    const row = db()
      .raw.prepare(
        `SELECT warn_h, critical_h, n_samples
         FROM anomaly_thresholds
         WHERE port = ? AND cargo_class IS ? AND kind = 'anchor-dwell'
         LIMIT 1`,
      )
      .get(port, cargoClass ?? null) as
      | { warn_h: number; critical_h: number; n_samples: number }
      | undefined;
    if (row && row.n_samples >= MIN_SAMPLES) {
      return {
        port,
        cargoClass: cargoClass ?? null,
        warnH: row.warn_h,
        criticalH: row.critical_h,
        nSamples: row.n_samples,
        isDynamic: true,
      };
    }
  } catch {
    // Table may not exist yet (migration not applied) → silent fallback.
  }
  return fallbackThreshold(port, cargoClass);
}

/**
 * Walk the positions table grouping consecutive "anchored" rows per
 * (mmsi, port-proxy) into sessions, compute durations, then aggregate
 * P50/P95 by (port, cargo). Uses the positions.zone field as a
 * port-membership proxy: the AIS worker only writes anchored positions
 * with state="anchored" when the vessel is in a port bbox, so we can
 * trust the row's existence as port-attached.
 *
 * Port assignment: we don't store port_id on positions (would have been
 * 24M extra column-bytes); we derive it from the static port→zone mapping.
 * Cheaper approximation: derive port from the zone string prefix when
 * available; otherwise group by mmsi-static-class.
 *
 * For v1 we compute *globally* (one P50/P95 per cargo class, all ports
 * pooled). Per-port refinement comes later when we have enough per-port
 * samples. Empirically this still beats hardcoded — Houston tankers
 * idle longer than Rotterdam tankers because Houston has bigger
 * anchorages, but the relative shape is similar.
 */
export function recomputeThresholds(): {
  rowsWritten: number;
  durationMs: number;
} {
  const t0 = Date.now();
  const since = t0 - RECOMPUTE_WINDOW_DAYS * 86_400_000;
  const dbi = db();

  // Pull all anchored positions in the window, ordered by (mmsi, ts).
  // Join static_ships for cargo_class.
  const rows = dbi.raw
    .prepare(
      `SELECT p.mmsi, p.ts, s.cargo_class
       FROM positions p
       LEFT JOIN static_ships s ON s.mmsi = p.mmsi
       WHERE p.state = 'anchored' AND p.ts >= ?
       ORDER BY p.mmsi, p.ts`,
    )
    .all(since) as Array<{ mmsi: number; ts: number; cargo_class: string | null }>;

  // Group consecutive anchored rows per mmsi into sessions. A new session
  // starts when the previous row was >2h ago (vessel left and came back).
  const SESSION_GAP_MS = 2 * 3_600_000;
  const sessions: Array<{ cargoClass: string | null; durationH: number }> = [];

  let curMmsi: number | null = null;
  let curCargo: string | null = null;
  let curStart = 0;
  let curEnd = 0;

  const closeSession = () => {
    if (curMmsi == null) return;
    const durationH = (curEnd - curStart) / 3_600_000;
    if (durationH >= 1 && durationH <= 30 * 24) {
      // Filter sessions: at least 1h (noise floor), at most 30 days
      // (anything longer is almost certainly a dead vessel or schema bug).
      sessions.push({ cargoClass: curCargo, durationH });
    }
  };

  for (const r of rows) {
    if (r.mmsi !== curMmsi) {
      closeSession();
      curMmsi = r.mmsi;
      curCargo = r.cargo_class;
      curStart = r.ts;
      curEnd = r.ts;
    } else if (r.ts - curEnd > SESSION_GAP_MS) {
      closeSession();
      curStart = r.ts;
      curEnd = r.ts;
    } else {
      curEnd = r.ts;
    }
  }
  closeSession();

  // Group sessions by cargo class (global pool — see comment above).
  const byCargo = new Map<string | null, number[]>();
  for (const s of sessions) {
    const key = s.cargoClass;
    let arr = byCargo.get(key);
    if (!arr) {
      arr = [];
      byCargo.set(key, arr);
    }
    arr.push(s.durationH);
  }

  // For each cargo class with ≥MIN_SAMPLES, write one row per port (since
  // v1 pools all ports per cargo, the value is identical across ports).
  const upsert = dbi.raw.prepare(
    `INSERT INTO anomaly_thresholds (
       port, cargo_class, kind, warn_h, critical_h, n_samples, computed_at
     ) VALUES (?, ?, 'anchor-dwell', ?, ?, ?, ?)
     ON CONFLICT(port, cargo_class, kind) DO UPDATE SET
       warn_h = excluded.warn_h,
       critical_h = excluded.critical_h,
       n_samples = excluded.n_samples,
       computed_at = excluded.computed_at`,
  );

  let rowsWritten = 0;
  const now = Date.now();
  for (const [cargo, samples] of byCargo.entries()) {
    if (samples.length < MIN_SAMPLES) continue;
    samples.sort((a, b) => a - b);
    const p50 = samples[Math.floor(samples.length * 0.5)];
    const p95 = samples[Math.floor(samples.length * 0.95)];
    for (const p of PORTS) {
      upsert.run(p.id, cargo, p50, p95, samples.length, now);
      rowsWritten++;
    }
  }

  return { rowsWritten, durationMs: Date.now() - t0 };
}

let _intervalId: ReturnType<typeof setInterval> | null = null;

export function startAnomalyThresholdScheduler(): void {
  if (_intervalId) return;
  // Initial compute deferred 2 min after boot so the AIS worker has
  // time to populate any catch-up positions on a fresh start.
  setTimeout(() => {
    try {
      const r = recomputeThresholds();
      console.log(
        `[anomaly-thresholds] initial: ${r.rowsWritten} rows in ${r.durationMs} ms`,
      );
    } catch (err) {
      console.error("[anomaly-thresholds] initial compute failed", err);
    }
  }, 120_000);
  _intervalId = setInterval(() => {
    try {
      const r = recomputeThresholds();
      if (r.rowsWritten > 0) {
        console.log(
          `[anomaly-thresholds] recompute: ${r.rowsWritten} rows in ${r.durationMs} ms`,
        );
      }
    } catch (err) {
      console.error("[anomaly-thresholds] recompute failed", err);
    }
  }, RECOMPUTE_INTERVAL_MS);
}
