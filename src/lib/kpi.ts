import * as Sentry from "@sentry/nextjs";
import { getFlowEvents, getVessels, meta, pruneStaleVessels, pushKpi } from "./store";
import type { KpiSnapshot, VesselClass } from "./types";
import { findZone, getPort, PORTS } from "./ports";
import { persistKpi, pruneOldPositions } from "./db";
import { computeAnomalies } from "./anomaly";
import { dispatchAnomalies, dispatchCongestion } from "./webhooks";

const HOUR_MS = 60 * 60 * 1000;

export function computeKpiSnapshot(
  portId: string,
  now = Date.now(),
): KpiSnapshot {
  const port = getPort(portId);
  const vessels = getVessels(portId);

  const byClass: Record<VesselClass, number> = {
    cargo: 0,
    tanker: 0,
    passenger: 0,
    fishing: 0,
    tug: 0,
    pilot: 0,
    other: 0,
  };

  let anchored = 0;
  let underway = 0;
  let moored = 0;
  let speedSum = 0;
  let speedCount = 0;

  for (const v of vessels) {
    byClass[v.vesselClass]++;
    if (v.state === "anchored") anchored++;
    else if (v.state === "underway") underway++;
    else if (v.state === "moored") moored++;

    if (port) {
      const z = findZone(port, v.latitude, v.longitude);
      if (z?.kind === "channel" && v.state === "underway") {
        speedSum += v.sog;
        speedCount++;
      }
    }
  }

  const flow = getFlowEvents(portId, now - HOUR_MS);
  const inboundLastHour = flow.filter((f) => f.direction === "inbound").length;
  const outboundLastHour = flow.filter(
    (f) => f.direction === "outbound",
  ).length;

  return {
    ts: now,
    totalVessels: vessels.length,
    anchored,
    underway,
    moored,
    inboundLastHour,
    outboundLastHour,
    avgSpeedChannel: speedCount ? speedSum / speedCount : 0,
    byClass,
  };
}

let interval: NodeJS.Timeout | undefined;
let prunePositionsInterval: NodeJS.Timeout | undefined;

const POSITIONS_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const POSITIONS_PRUNE_INITIAL_DELAY_MS = 10 * 60 * 1000;

function runPositionsPrune() {
  try {
    const t0 = Date.now();
    const removed = pruneOldPositions();
    if (removed > 0) {
      console.log(
        `[db] pruneOldPositions removed=${removed} in ${Date.now() - t0}ms`,
      );
    }
  } catch (err) {
    console.error("[db] pruneOldPositions failed", err);
  }
}

// AIS feed outage detection. Captures one Sentry alert when the feed has
// been silent past the threshold, then a second when it recovers — no spam
// during an ongoing outage. Threshold deliberately above 60s (the typical
// reconnect backoff) so single dropped websockets don't page.
const AIS_FRESH_THRESHOLD_MS = 60_000;
const AIS_ALERT_AFTER_MS = 5 * 60_000;
let aisDownSinceMs: number | null = null;
let aisAlerted = false;

function checkAisHealth(now: number) {
  const s = meta.status();
  const age = s.lastMessageAt ? now - s.lastMessageAt : null;
  const down = !s.started || age === null || age > AIS_FRESH_THRESHOLD_MS;

  if (down) {
    if (aisDownSinceMs === null) aisDownSinceMs = now;
    const downFor = now - aisDownSinceMs;
    if (downFor >= AIS_ALERT_AFTER_MS && !aisAlerted) {
      const minutes = Math.round(downFor / 60_000);
      const ageLabel =
        age === null ? "never connected" : `last msg ${Math.round(age / 1000)}s ago`;
      console.warn(`[ais] feed silent for ${minutes}min · ${ageLabel}`);
      try {
        Sentry.captureMessage(
          `AIS feed silent for ${minutes} min (likely upstream issue) — ${ageLabel}`,
          "warning",
        );
      } catch {
        /* sentry not configured — log already printed */
      }
      aisAlerted = true;
    }
  } else {
    if (aisAlerted) {
      console.log("[ais] feed recovered");
      try {
        Sentry.captureMessage("AIS feed recovered", "info");
      } catch {
        /* sentry not configured */
      }
    }
    aisDownSinceMs = null;
    aisAlerted = false;
  }
}

export function startKpiSampler(intervalMs = 60_000) {
  if (interval) return;
  const tick = () => {
    try {
      pruneStaleVessels();
    } catch (err) {
      console.error("[store] pruneStaleVessels failed", err);
    }
    try {
      checkAisHealth(Date.now());
    } catch (err) {
      console.error("[ais] health check failed", err);
    }
    for (const port of PORTS) {
      try {
        const snap = computeKpiSnapshot(port.id);
        pushKpi(port.id, snap);
        try {
          persistKpi(snap, port.id);
        } catch (err) {
          console.error(`[db] persistKpi(${port.id}) failed`, err);
        }
        dispatchCongestion(port.id, snap.anchored).catch((err) =>
          console.error(`[webhook] congestion ${port.id}`, err),
        );
        try {
          const anomalies = computeAnomalies(port.id);
          dispatchAnomalies(port.id, anomalies).catch((err) =>
            console.error(`[webhook] anomaly ${port.id}`, err),
          );
        } catch (err) {
          console.error(`[anomaly] compute(${port.id}) failed`, err);
        }
      } catch (err) {
        console.error(`[kpi] sample(${port.id}) failed`, err);
      }
    }
  };
  tick();
  interval = setInterval(tick, intervalMs);

  // Daily DB maintenance: prune positions older than 7 days. Deferred 10 min
  // after boot so the warm-up sanctions / chokepoint fetches finish first.
  setTimeout(runPositionsPrune, POSITIONS_PRUNE_INITIAL_DELAY_MS);
  prunePositionsInterval = setInterval(
    runPositionsPrune,
    POSITIONS_PRUNE_INTERVAL_MS,
  );
}

void prunePositionsInterval;
