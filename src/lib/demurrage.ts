import { recentClosedVoyages } from "./db";
import { getVessels } from "./store";

/**
 * Demurrage risk score v1 — interpretable heuristic.
 *
 * Definition: probability that a voyage's port-call duration (arrived_ts ->
 * departed_ts) will exceed the typical port-call laytime, conditional on
 * cargo class.
 *
 * v1 inputs (no ML):
 *   - Historical p75 of (departed_ts - arrived_ts) for the port × cargo bucket
 *   - Voyage age (time since arrival): once a vessel sits longer than the p50,
 *     risk rises; once it nears the p75, risk approaches 1
 *   - Live congestion (anchored count): scales the base risk multiplicatively
 *
 * Output: { score: 0..1, p50Hours, p75Hours, voyageAgeHours, congestionFactor }
 *
 * v2 (later) will use labeled laytime data per charterparty / port; until
 * then this gives traders a directional signal.
 */

interface BucketStats {
  p50: number;
  p75: number;
  count: number;
}

const cache = new Map<string, BucketStats>();
const CACHE_KEY = (port: string, cargo: string) => `${port}|${cargo}`;
const REFRESH_MS = 60 * 60_000;
const LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
const MIN_SAMPLES = 8;

let lastRefresh = 0;
function refresh() {
  if (Date.now() - lastRefresh < REFRESH_MS) return;
  lastRefresh = Date.now();
  cache.clear();
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx];
}

function loadBucket(portId: string, cargo: string): BucketStats {
  refresh();
  const k = CACHE_KEY(portId, cargo);
  const cached = cache.get(k);
  if (cached) return cached;

  const since = Date.now() - LOOKBACK_MS;
  const voyages = recentClosedVoyages(portId, since, 10000).filter(
    (v) =>
      v.arrived_ts != null &&
      v.departed_ts != null &&
      (cargo === "any" || v.cargo_class === cargo),
  );
  const durationsH = voyages
    .map((v) => ((v.departed_ts ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000)
    .filter((h) => h > 0 && h < 30 * 24);

  if (durationsH.length < MIN_SAMPLES && cargo !== "any") {
    const broader = loadBucket(portId, "any");
    cache.set(k, broader);
    return broader;
  }

  const stats: BucketStats = {
    p50: quantile(durationsH, 0.5),
    p75: quantile(durationsH, 0.75),
    count: durationsH.length,
  };
  cache.set(k, stats);
  return stats;
}

function congestionFactor(portId: string): number {
  try {
    const vessels = getVessels(portId);
    const anchored = vessels.filter((v) => v.state === "anchored").length;
    if (anchored < 25) return 1.0;
    if (anchored < 40) return 1.15;
    if (anchored < 60) return 1.3;
    return 1.5;
  } catch {
    return 1.0;
  }
}

export interface DemurrageScore {
  score: number;
  p50Hours: number;
  p75Hours: number;
  voyageAgeHours: number;
  congestionFactor: number;
  sampleCount: number;
  bucket: string;
}

export function computeDemurrageScore(input: {
  portId: string;
  cargoClass?: string | null;
  arrivedTs: number;
  now?: number;
}): DemurrageScore {
  const { portId, cargoClass, arrivedTs } = input;
  const now = input.now ?? Date.now();
  const stats = loadBucket(portId, cargoClass ?? "any");
  const voyageAgeHours = Math.max(0, (now - arrivedTs) / 3_600_000);
  const congF = congestionFactor(portId);

  let score: number;
  if (stats.p50 <= 0 || stats.p75 <= 0) {
    score = 0;
  } else {
    const ratio =
      voyageAgeHours <= stats.p50
        ? (voyageAgeHours / stats.p50) * 0.5
        : 0.5 +
          ((voyageAgeHours - stats.p50) / Math.max(1, stats.p75 - stats.p50)) *
            0.5;
    score = Math.min(1, ratio * congF);
  }

  return {
    score,
    p50Hours: stats.p50,
    p75Hours: stats.p75,
    voyageAgeHours,
    congestionFactor: congF,
    sampleCount: stats.count,
    bucket: cargoClass ?? "any",
  };
}
