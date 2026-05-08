import { db } from "./db";
import { fireVesselEvent } from "./alerts";
import { getPort } from "./ports";
import { getStatic } from "./store";

/**
 * Periodically scans active voyages and fires `vessel.eta_approaching`
 * alerts when a vessel's predicted ETA crosses each user's configured
 * lead time. Dedup is per (alert_id, voyage_id) — see alert_eta_fired
 * table populated by alerts.ts.
 *
 * Cadence: every 5 minutes is a sweet spot — sub-tick precision on lead
 * time (max 5 min late) and negligible DB cost (a single SELECT over the
 * `voyages` table indexed on `arrived_ts`).
 *
 * Designed to be cheap: only scans open voyages with a predicted_eta in
 * the next 24 h, which is typically <500 rows even at peak port load.
 */

interface OpenVoyageRow {
  voyage_id: string;
  mmsi: number;
  port: string;
  predicted_eta: number;
  cargo_class: string | null;
}

const SCANNER_INTERVAL_MS = 5 * 60_000;
const ETA_LOOKAHEAD_MS = 24 * 3_600_000;

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastRunAt = 0;
let _lastFired = 0;

export async function scanEtaApproaching(): Promise<{
  considered: number;
  fired: number;
}> {
  const now = Date.now();
  // Fetch open voyages with a predicted ETA in the next 24h.
  // Cheap query — voyages.predicted_eta is small (<10k open at any time).
  const rows = db()
    .raw.prepare(
      `SELECT voyage_id, mmsi, port, predicted_eta, cargo_class
       FROM voyages
       WHERE arrived_ts IS NULL
         AND predicted_eta IS NOT NULL
         AND predicted_eta > ?
         AND predicted_eta < ?`,
    )
    .all(now, now + ETA_LOOKAHEAD_MS) as unknown as OpenVoyageRow[];

  let totalFired = 0;
  for (const v of rows) {
    const minsUntil = Math.round((v.predicted_eta - now) / 60_000);
    const stat = getStatic(v.mmsi);
    const port = getPort(v.port);
    const fired = await fireVesselEvent("vessel.eta_approaching", {
      mmsi: v.mmsi,
      vesselName: stat?.name ?? `MMSI ${v.mmsi}`,
      port: v.port,
      portName: port?.name ?? v.port,
      cargoClass: v.cargo_class,
      ts: now,
      predictedEta: v.predicted_eta,
      minutesUntilEta: minsUntil,
      voyageId: v.voyage_id,
    });
    totalFired += fired;
  }
  return { considered: rows.length, fired: totalFired };
}

export function startEtaApproachingScanner(): void {
  if (_intervalId) return;
  _intervalId = setInterval(async () => {
    try {
      const r = await scanEtaApproaching();
      _lastRunAt = Date.now();
      _lastFired += r.fired;
      if (r.fired > 0) {
        console.log(
          `[eta-approaching] tick: considered=${r.considered} fired=${r.fired}`,
        );
      }
    } catch (err) {
      console.error("[eta-approaching] tick failed", err);
    }
  }, SCANNER_INTERVAL_MS);
}

export function getEtaApproachingScannerStatus() {
  return {
    started: _intervalId !== null,
    lastRunAt: _lastRunAt || null,
    totalFiredSinceBoot: _lastFired,
  };
}
