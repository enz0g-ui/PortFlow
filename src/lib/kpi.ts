import { getFlowEvents, getVessels, pushKpi } from "./store";
import type { KpiSnapshot, VesselClass } from "./types";
import { findZone, getPort, PORTS } from "./ports";
import { persistKpi } from "./db";
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

export function startKpiSampler(intervalMs = 60_000) {
  if (interval) return;
  const tick = () => {
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
}
