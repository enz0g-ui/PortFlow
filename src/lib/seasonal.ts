import { recentClosedVoyages } from "./db";

interface PortCorrection {
  median: number;
  byHour: Record<number, number>;
  computedAt: number;
  sampleCount: number;
}

const cache = new Map<string, PortCorrection>();
const REFRESH_MS = 30 * 60_000;
const LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function recompute(portId: string): PortCorrection {
  const since = Date.now() - LOOKBACK_MS;
  const voyages = recentClosedVoyages(portId, since, 5000).filter(
    (v) => v.predicted_eta != null && v.arrived_ts != null,
  );

  const errors: number[] = [];
  const byHourBuckets: Record<number, number[]> = {};

  for (const v of voyages) {
    const errH = ((v.predicted_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
    if (Math.abs(errH) > 72) continue;
    errors.push(errH);
    const arrivalHour = new Date(v.arrived_ts ?? 0).getUTCHours();
    if (!byHourBuckets[arrivalHour]) byHourBuckets[arrivalHour] = [];
    byHourBuckets[arrivalHour].push(errH);
  }

  const med = median(errors);
  const byHour: Record<number, number> = {};
  for (const [h, vals] of Object.entries(byHourBuckets)) {
    if (vals.length >= 3) byHour[Number(h)] = median(vals);
  }

  return {
    median: med,
    byHour,
    computedAt: Date.now(),
    sampleCount: errors.length,
  };
}

export function getCorrection(portId: string): PortCorrection {
  const existing = cache.get(portId);
  if (existing && Date.now() - existing.computedAt < REFRESH_MS) {
    return existing;
  }
  const fresh = recompute(portId);
  cache.set(portId, fresh);
  return fresh;
}

export function correctEta(
  portId: string,
  rawPredictedEta: number,
): { corrected: number; offsetHours: number; sampleCount: number } {
  const corr = getCorrection(portId);
  const arrivalHour = new Date(rawPredictedEta).getUTCHours();
  const hourly = corr.byHour[arrivalHour];
  const offset = hourly !== undefined ? hourly : corr.median;
  const corrected = rawPredictedEta - offset * 3_600_000;
  return {
    corrected,
    offsetHours: offset,
    sampleCount: corr.sampleCount,
  };
}
