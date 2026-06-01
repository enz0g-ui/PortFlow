import {
  findOpenVoyage,
  markVoyageArrived,
  markVoyageDeparted,
  openVoyage,
  recentClosedVoyages,
  setVoyageBroadcastEta,
  setVoyagePrediction,
  type VoyageRow,
} from "./db";
import { getPort } from "./ports";
import { correctEta } from "./seasonal";
import { getStatic, inStartupGrace } from "./store";
import type { CargoClass, Vessel } from "./types";
import { fireVesselEvent } from "./alerts";
import { predictEtaV2 } from "./eta-v2";

const NM_PER_DEG_LAT = 60;
const PREDICTION_INTERVAL_MS = 5 * 60_000;

const TRACKED_CARGO: ReadonlySet<CargoClass> = new Set([
  "crude",
  "product",
  "chemical",
  "lng",
  "lpg",
  "container",
  "dry-bulk",
  "general-cargo",
  "ro-ro",
]);

function isTrackable(cargoClass: CargoClass | string | undefined): boolean {
  if (!cargoClass) return false;
  return TRACKED_CARGO.has(cargoClass as CargoClass);
}

function distanceToPortNm(
  portId: string,
  lat: number,
  lon: number,
): number | null {
  const p = getPort(portId);
  if (!p) return null;
  const [pLat, pLon] = p.center;
  const dLat = lat - pLat;
  const dLon = (lon - pLon) * Math.cos((lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon) * NM_PER_DEG_LAT;
}

const lastPredictionAt = new Map<string, number>();

interface ObserveOpts {
  portId: string;
  mmsi: number;
  cargoClass?: string;
  vessel?: Vessel;
  broadcastEta?: number;
}

export function observeVoyage(opts: ObserveOpts) {
  const { portId, mmsi, vessel, broadcastEta } = opts;

  if (broadcastEta !== undefined && !vessel) {
    // Type 5 / ShipStaticData arrived (no position update in this tick).
    // Update the existing open voyage's broadcast_eta if we have one and
    // it doesn't already carry one. Previously this code called openVoyage,
    // but openVoyage runs INSERT OR IGNORE keyed on (port, mmsi, startTs)
    // so re-inserting an existing voyage was a silent no-op — broadcast_eta
    // was never persisted on an already-open voyage. Hence the dashboard
    // showed broadcast_eta empty for ~all active voyages.
    const open = findOpenVoyage(portId, mmsi);
    if (open && open.arrived_ts == null && open.broadcast_eta == null) {
      setVoyageBroadcastEta(open.voyage_id, broadcastEta);
    }
    return;
  }

  if (!vessel) return;
  const ts = vessel.lastUpdate;

  let open = findOpenVoyage(portId, mmsi);

  if (!open) {
    const stat = getStatic(mmsi);
    const cargoClass = opts.cargoClass ?? stat?.cargoClass;
    const portObj = getPort(portId);
    const hasBerth = portObj?.zones.some((z) => z.kind === "berth") ?? false;
    const inApproach =
      vessel.state === "underway" || vessel.state === "anchored";
    if (
      hasBerth &&
      inApproach &&
      !inStartupGrace(portId, ts) &&
      isTrackable(cargoClass) &&
      vessel.sog >= 1
    ) {
      const distance =
        distanceToPortNm(portId, vessel.latitude, vessel.longitude) ?? 0;
      const id = openVoyage({
        mmsi,
        port: portId,
        cargoClass,
        startTs: ts,
        lat: vessel.latitude,
        lon: vessel.longitude,
        distanceNm: distance,
        sog: vessel.sog,
      });
      open = {
        voyage_id: id,
        mmsi,
        port: portId,
        cargo_class: cargoClass,
        start_ts: ts,
        start_lat: vessel.latitude,
        start_lon: vessel.longitude,
        start_distance_nm: distance,
        start_sog: vessel.sog,
      };
    }
  }

  if (!open) return;

  if (open.arrived_ts == null && vessel.state === "moored" && vessel.zone) {
    markVoyageArrived(open.voyage_id, ts, vessel.zone, vessel.draught);
    const portInfo = getPort(portId);
    void fireVesselEvent("vessel.arrived", {
      mmsi: open.mmsi,
      vesselName: getStatic(open.mmsi)?.name ?? `MMSI ${open.mmsi}`,
      port: portId,
      portName: portInfo?.name ?? portId,
      cargoClass: open.cargo_class ?? null,
      ts,
      predictedEta: open.predicted_eta ?? null,
      broadcastEta: open.broadcast_eta ?? null,
    });
    return;
  }

  if (
    open.arrived_ts != null &&
    open.departed_ts == null &&
    vessel.state === "underway" &&
    (distanceToPortNm(portId, vessel.latitude, vessel.longitude) ?? 0) > 8
  ) {
    markVoyageDeparted(open.voyage_id, ts);
    const portInfo = getPort(portId);
    void fireVesselEvent("vessel.departed", {
      mmsi: open.mmsi,
      vesselName: getStatic(open.mmsi)?.name ?? `MMSI ${open.mmsi}`,
      port: portId,
      portName: portInfo?.name ?? portId,
      cargoClass: open.cargo_class ?? null,
      ts,
    });
    return;
  }

  if (open.arrived_ts == null && vessel.state === "underway" && vessel.sog > 1) {
    const last = lastPredictionAt.get(open.voyage_id) ?? 0;
    if (ts - last >= PREDICTION_INTERVAL_MS) {
      const eta = predictEta(portId, vessel, open.cargo_class);
      if (eta) {
        setVoyagePrediction(open.voyage_id, eta, ts);
        lastPredictionAt.set(open.voyage_id, ts);
      }
    }
  }
}

function predictEta(
  portId: string,
  vessel: Vessel,
  cargoClass?: string | null,
): number | undefined {
  const distance = distanceToPortNm(portId, vessel.latitude, vessel.longitude);
  if (distance == null) return undefined;

  const v2 = predictEtaV2({
    portId,
    vessel,
    cargoClass: cargoClass ?? null,
    distanceNm: distance,
  });
  if (v2) return v2.predictedEta;

  if (vessel.sog < 1 || distance < 0.5) return undefined;
  const hoursToArrival = distance / vessel.sog;
  if (hoursToArrival > 72) return undefined;
  const raw = vessel.lastUpdate + hoursToArrival * 60 * 60 * 1000;
  const { corrected } = correctEta(portId, raw);
  return corrected;
}

// A broadcast ETA more than this far from the actual arrival is treated as a
// sentinel / never-updated AIS value (default dates, stale ETA carried from a
// previous leg, year-2099 placeholders), NOT a genuine estimate for the voyage
// we track over hours-to-days during port approach. Such values are excluded
// from the broadcast baseline so a handful of ~300-day artefacts don't dominate
// the RMSE. Disclosed publicly on /methodology. ~37% of broadcasts at Rotterdam
// fall outside this window and are excluded as artefacts.
export const BROADCAST_SENTINEL_CUTOFF_H = 7 * 24; // 168h

export function getVoyageAccuracy(
  portId: string,
  sinceMs: number,
): {
  voyages: VoyageRow[];
  rmseHours: number | null;
  maeHours: number | null;
  count: number;
  // Broadcast baseline, computed over the comparison set (voyages carrying a
  // usable broadcast ETA, sentinels excluded).
  baselineRmseHours: number | null;
  baselineMaeHours: number | null;
  baselineCount: number;
  // Sentinel/artefact broadcasts excluded from the baseline (for disclosure).
  baselineExcluded: number;
  // Our model's error over the SAME comparison set — apples-to-apples vs the
  // broadcast baseline (distinct from rmse/maeHours above, which cover ALL
  // predicted voyages regardless of whether they carried a broadcast ETA).
  modelRmseOnBaselineHours: number | null;
  modelMaeOnBaselineHours: number | null;
} {
  const voyages = recentClosedVoyages(portId, sinceMs, 1000).filter(
    (v) => v.predicted_eta != null && v.arrived_ts != null,
  );

  const empty = {
    voyages: [],
    rmseHours: null,
    maeHours: null,
    count: 0,
    baselineRmseHours: null,
    baselineMaeHours: null,
    baselineCount: 0,
    baselineExcluded: 0,
    modelRmseOnBaselineHours: null,
    modelMaeOnBaselineHours: null,
  };
  if (voyages.length === 0) return empty;

  let sumSq = 0;
  let sumAbs = 0;
  // Broadcast baseline + model-on-same-set accumulators.
  let baselineSumSq = 0;
  let baselineSumAbs = 0;
  let baselineCount = 0;
  let baselineExcluded = 0;
  let modelOnBaseSumSq = 0;
  let modelOnBaseSumAbs = 0;

  for (const v of voyages) {
    const errH = ((v.predicted_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
    sumSq += errH * errH;
    sumAbs += Math.abs(errH);
    if (v.broadcast_eta != null) {
      const baselineErrH =
        ((v.broadcast_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
      if (Math.abs(baselineErrH) > BROADCAST_SENTINEL_CUTOFF_H) {
        baselineExcluded++;
        continue; // sentinel/artefact — exclude from both broadcast & model-on-set
      }
      baselineSumSq += baselineErrH * baselineErrH;
      baselineSumAbs += Math.abs(baselineErrH);
      // Same voyage → fold our model's error into the apples-to-apples set.
      modelOnBaseSumSq += errH * errH;
      modelOnBaseSumAbs += Math.abs(errH);
      baselineCount++;
    }
  }

  return {
    voyages,
    rmseHours: Math.sqrt(sumSq / voyages.length),
    maeHours: sumAbs / voyages.length,
    count: voyages.length,
    baselineRmseHours: baselineCount
      ? Math.sqrt(baselineSumSq / baselineCount)
      : null,
    baselineMaeHours: baselineCount ? baselineSumAbs / baselineCount : null,
    baselineCount,
    baselineExcluded,
    modelRmseOnBaselineHours: baselineCount
      ? Math.sqrt(modelOnBaseSumSq / baselineCount)
      : null,
    modelMaeOnBaselineHours: baselineCount
      ? modelOnBaseSumAbs / baselineCount
      : null,
  };
}
