import { getKpiHistory } from "./store";
import type { KpiSnapshot } from "./types";

export interface ForecastPoint {
  ts: number;
  value: number;
  lower: number;
  upper: number;
}

export interface ForecastResult {
  metric: keyof KpiSnapshot;
  history: { ts: number; value: number }[];
  forecast: ForecastPoint[];
  method: "rolling-mean";
  notes: string;
}

const HOUR_MS = 60 * 60 * 1000;

function asNumber(s: KpiSnapshot, k: keyof KpiSnapshot): number {
  const v = s[k];
  return typeof v === "number" ? v : 0;
}

export function forecast(
  portId: string,
  metric: "anchored" | "totalVessels" | "inboundLastHour" | "outboundLastHour",
  horizonHours = 24,
): ForecastResult {
  const all = getKpiHistory(portId);
  const history = all.map((k) => ({ ts: k.ts, value: asNumber(k, metric) }));

  if (history.length < 5) {
    return {
      metric,
      history,
      forecast: [],
      method: "rolling-mean",
      notes:
        "Not enough history yet. Forecast will appear after roughly 5 minutes of data collection.",
    };
  }

  const last = history.slice(-Math.min(history.length, 60));
  const mean = last.reduce((a, b) => a + b.value, 0) / last.length;
  const variance =
    last.reduce((a, b) => a + (b.value - mean) ** 2, 0) / last.length;
  const std = Math.sqrt(variance);

  const lastTs = history[history.length - 1].ts;
  const points: ForecastPoint[] = [];
  for (let h = 1; h <= horizonHours; h++) {
    points.push({
      ts: lastTs + h * HOUR_MS,
      value: mean,
      lower: Math.max(0, mean - 1.96 * std),
      upper: mean + 1.96 * std,
    });
  }

  return {
    metric,
    history,
    forecast: points,
    method: "rolling-mean",
    notes: `Rolling mean over last ${last.length} samples. Will be replaced with seasonal model once ≥7 days of history available.`,
  };
}
