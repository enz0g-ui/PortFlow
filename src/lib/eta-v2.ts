import { recentClosedVoyages } from "./db";
import { getVessels } from "./store";
import type { Vessel } from "./types";

/**
 * ETA v2 — feature-aware median correction with congestion penalty.
 *
 * Rationale:
 *  - v1 = raw distance / SOG, corrected by port × hour-of-day median offset.
 *  - v2 = port × dayOfWeek × hourOfDay × cargoClass median offset, with
 *    cascading fallback to broader buckets when narrow ones lack samples,
 *    plus a congestion-aware additive penalty based on live anchored count.
 *
 * The model is interpretable, has no opaque ML — every offset is a median
 * over recent closed voyages. RMSE delta vs v1 is published on /precision.
 */

interface BucketStats {
  median: number;
  count: number;
}

interface PortCorrectionV2 {
  byKey: Map<string, BucketStats>;
  computedAt: number;
}

const cache = new Map<string, PortCorrectionV2>();
const REFRESH_MS = 30 * 60_000;
const LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
const MIN_BUCKET_SAMPLES = 5;

const ANCHORED_BASE_THRESHOLD = 25;
const ANCHORED_HOURS_PER_VESSEL = 0.05;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function key(
  portId: string,
  dow: number | "any",
  hour: number | "any",
  cargoClass: string | "any",
): string {
  return `${portId}|${dow}|${hour}|${cargoClass}`;
}

function recompute(portId: string): PortCorrectionV2 {
  const since = Date.now() - LOOKBACK_MS;
  const voyages = recentClosedVoyages(portId, since, 10000).filter(
    (v) => v.predicted_eta != null && v.arrived_ts != null,
  );

  const buckets = new Map<string, number[]>();
  const push = (k: string, err: number) => {
    const arr = buckets.get(k);
    if (arr) arr.push(err);
    else buckets.set(k, [err]);
  };

  for (const v of voyages) {
    const errH = ((v.predicted_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
    if (Math.abs(errH) > 72) continue;
    const arrivalDate = new Date(v.arrived_ts ?? 0);
    const dow = arrivalDate.getUTCDay();
    const hour = arrivalDate.getUTCHours();
    const cargo = v.cargo_class ?? "any";

    push(key(portId, dow, hour, cargo), errH);
    push(key(portId, dow, hour, "any"), errH);
    push(key(portId, dow, "any", cargo), errH);
    push(key(portId, "any", hour, cargo), errH);
    push(key(portId, dow, "any", "any"), errH);
    push(key(portId, "any", hour, "any"), errH);
    push(key(portId, "any", "any", cargo), errH);
    push(key(portId, "any", "any", "any"), errH);
  }

  const byKey = new Map<string, BucketStats>();
  for (const [k, arr] of buckets.entries()) {
    if (arr.length >= MIN_BUCKET_SAMPLES) {
      byKey.set(k, { median: median(arr), count: arr.length });
    }
  }
  return { byKey, computedAt: Date.now() };
}

export function getCorrectionV2(portId: string): PortCorrectionV2 {
  const existing = cache.get(portId);
  if (existing && Date.now() - existing.computedAt < REFRESH_MS) {
    return existing;
  }
  const fresh = recompute(portId);
  cache.set(portId, fresh);
  return fresh;
}

function findOffset(
  byKey: Map<string, BucketStats>,
  portId: string,
  dow: number,
  hour: number,
  cargo: string | "any",
): { median: number; count: number; bucket: string } {
  const ladder: Array<[number | "any", number | "any", string | "any"]> = [
    [dow, hour, cargo],
    [dow, hour, "any"],
    [dow, "any", cargo],
    ["any", hour, cargo],
    [dow, "any", "any"],
    ["any", hour, "any"],
    ["any", "any", cargo],
    ["any", "any", "any"],
  ];
  for (const [d, h, c] of ladder) {
    const k = key(portId, d, h, c);
    const stats = byKey.get(k);
    if (stats) {
      return { median: stats.median, count: stats.count, bucket: k };
    }
  }
  return { median: 0, count: 0, bucket: "n/a" };
}

function congestionPenaltyHours(portId: string): number {
  try {
    const vessels = getVessels(portId);
    const anchored = vessels.filter((v) => v.state === "anchored").length;
    const excess = Math.max(0, anchored - ANCHORED_BASE_THRESHOLD);
    return Math.min(8, excess * ANCHORED_HOURS_PER_VESSEL);
  } catch {
    return 0;
  }
}

export interface EtaV2Result {
  predictedEta: number;
  rawEta: number;
  bucket: string;
  bucketSamples: number;
  congestionPenaltyHours: number;
  sourceCorrectionHours: number;
}

export function predictEtaV2(input: {
  portId: string;
  vessel: Vessel;
  cargoClass?: string | null;
  distanceNm: number;
}): EtaV2Result | null {
  const { portId, vessel, cargoClass, distanceNm } = input;
  if (vessel.sog < 1 || distanceNm < 0.5) return null;
  const hoursToArrival = distanceNm / vessel.sog;
  if (hoursToArrival > 72) return null;

  const rawEta = vessel.lastUpdate + hoursToArrival * 3_600_000;
  const arrivalDate = new Date(rawEta);
  const dow = arrivalDate.getUTCDay();
  const hour = arrivalDate.getUTCHours();
  const cargo = cargoClass ?? "any";

  const corr = getCorrectionV2(portId);
  const offset = findOffset(corr.byKey, portId, dow, hour, cargo);
  const congestion = congestionPenaltyHours(portId);

  const adjusted =
    rawEta - offset.median * 3_600_000 + congestion * 3_600_000;

  return {
    predictedEta: adjusted,
    rawEta,
    bucket: offset.bucket,
    bucketSamples: offset.count,
    congestionPenaltyHours: congestion,
    sourceCorrectionHours: offset.median,
  };
}
