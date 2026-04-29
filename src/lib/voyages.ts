import {
  findOpenVoyage,
  markVoyageArrived,
  markVoyageDeparted,
  openVoyage,
  recentClosedVoyages,
  setVoyagePrediction,
  type VoyageRow,
} from "./db";
import { getPort } from "./ports";
import { correctEta } from "./seasonal";
import { getStatic, inStartupGrace } from "./store";
import type { CargoClass, Vessel } from "./types";
import { fireVesselEvent } from "./alerts";

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
    const open = findOpenVoyage(portId, mmsi);
    if (open && open.arrived_ts == null && open.broadcast_eta == null) {
      const stat = getStatic(mmsi);
      openVoyage({
        mmsi,
        port: portId,
        cargoClass: stat?.cargoClass,
        startTs: open.start_ts,
        lat: open.start_lat ?? 0,
        lon: open.start_lon ?? 0,
        distanceNm: open.start_distance_nm ?? 0,
        sog: open.start_sog ?? 0,
        broadcastEta,
      });
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
      const eta = predictEta(portId, vessel);
      if (eta) {
        setVoyagePrediction(open.voyage_id, eta, ts);
        lastPredictionAt.set(open.voyage_id, ts);
      }
    }
  }
}

function predictEta(portId: string, vessel: Vessel): number | undefined {
  const distance = distanceToPortNm(portId, vessel.latitude, vessel.longitude);
  if (distance == null) return undefined;
  if (vessel.sog < 1 || distance < 0.5) return undefined;
  const hoursToArrival = distance / vessel.sog;
  if (hoursToArrival > 72) return undefined;
  const raw = vessel.lastUpdate + hoursToArrival * 60 * 60 * 1000;
  const { corrected } = correctEta(portId, raw);
  return corrected;
}

export function getVoyageAccuracy(
  portId: string,
  sinceMs: number,
): {
  voyages: VoyageRow[];
  rmseHours: number | null;
  maeHours: number | null;
  count: number;
  baselineRmseHours: number | null;
} {
  const voyages = recentClosedVoyages(portId, sinceMs, 1000).filter(
    (v) => v.predicted_eta != null && v.arrived_ts != null,
  );

  if (voyages.length === 0) {
    return {
      voyages: [],
      rmseHours: null,
      maeHours: null,
      count: 0,
      baselineRmseHours: null,
    };
  }

  let sumSq = 0;
  let sumAbs = 0;
  let baselineSumSq = 0;
  let baselineCount = 0;

  for (const v of voyages) {
    const errMs = (v.predicted_eta ?? 0) - (v.arrived_ts ?? 0);
    const errH = errMs / 3_600_000;
    sumSq += errH * errH;
    sumAbs += Math.abs(errH);
    if (v.broadcast_eta != null) {
      const baselineErr =
        ((v.broadcast_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
      baselineSumSq += baselineErr * baselineErr;
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
  };
}
