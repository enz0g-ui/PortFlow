import { db, recentClosedVoyages, type VoyageRow } from "./db";
import { getWeather } from "./weather";
import { PORTS_BY_ID } from "./ports";

export type DelayCause =
  | "on-time"
  | "early"
  | "weather"
  | "congestion"
  | "anchorage-wait"
  | "speed-drop"
  | "unknown";

export interface VoyageAttribution {
  voyageId: string;
  port: string;
  mmsi: number;
  predictedEta: number;
  arrivedTs: number;
  errorHours: number;
  cause: DelayCause;
  causeDetail: string;
  confidence: number;
}

const TOLERANCE_HOURS = 0.5;

interface PortKpiRow {
  ts: number;
  anchored: number;
}

async function recentlyHighCongestion(
  portId: string,
  aroundTs: number,
): Promise<boolean> {
  const before = aroundTs - 3 * 60 * 60_000;
  const after = aroundTs + 30 * 60_000;
  const rows = db()
    .raw.prepare(
      `SELECT ts, anchored FROM kpi_snapshots WHERE port = ? AND ts BETWEEN ? AND ? ORDER BY ts ASC`,
    )
    .all(portId, before, after) as unknown as PortKpiRow[];
  if (rows.length === 0) return false;
  const avg = rows.reduce((a, r) => a + r.anchored, 0) / rows.length;
  return avg >= 25;
}

async function weatherImpact(
  portId: string,
  aroundTs: number,
): Promise<{ impact: boolean; detail: string }> {
  const port = PORTS_BY_ID[portId];
  if (!port) return { impact: false, detail: "" };
  try {
    const w = await getWeather(portId, port.center[0], port.center[1]);
    const ageH = (aroundTs - w.fetchedAt) / 3_600_000;
    if (Math.abs(ageH) > 12) return { impact: false, detail: "" };
    const harshWind = w.windSpeed >= 30 || w.windGust >= 40;
    const harshSea = (w.waveHeight ?? 0) >= 3;
    if (harshWind || harshSea) {
      return {
        impact: true,
        detail: `wind ${w.windSpeed.toFixed(0)} kn (gust ${w.windGust.toFixed(0)})${
          harshSea ? `, wave ${w.waveHeight?.toFixed(1)}m` : ""
        }`,
      };
    }
  } catch {
    /* weather unavailable — fall through */
  }
  return { impact: false, detail: "" };
}

export async function attributeVoyageDelays(
  portId: string,
  sinceMs: number,
  limit = 50,
): Promise<VoyageAttribution[]> {
  const voyages = recentClosedVoyages(portId, sinceMs, limit).filter(
    (v) => v.predicted_eta != null && v.arrived_ts != null,
  );
  const out: VoyageAttribution[] = [];
  for (const v of voyages) {
    const errH = ((v.predicted_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
    const attribution = await classifyDelay(portId, v, errH);
    out.push({
      voyageId: v.voyage_id,
      port: v.port,
      mmsi: v.mmsi,
      predictedEta: v.predicted_eta!,
      arrivedTs: v.arrived_ts!,
      errorHours: errH,
      cause: attribution.cause,
      causeDetail: attribution.detail,
      confidence: attribution.confidence,
    });
  }
  return out;
}

async function classifyDelay(
  portId: string,
  v: VoyageRow,
  errH: number,
): Promise<{ cause: DelayCause; detail: string; confidence: number }> {
  if (Math.abs(errH) <= TOLERANCE_HOURS) {
    return { cause: "on-time", detail: "within ±30 min tolerance", confidence: 0.95 };
  }
  if (errH < -TOLERANCE_HOURS) {
    return {
      cause: "early",
      detail: `${(-errH).toFixed(1)} h ahead of prediction`,
      confidence: 0.85,
    };
  }

  const arrivedAt = v.arrived_ts ?? 0;

  const w = await weatherImpact(portId, arrivedAt);
  if (w.impact) {
    return {
      cause: "weather",
      detail: w.detail,
      confidence: 0.7,
    };
  }

  const congested = await recentlyHighCongestion(portId, arrivedAt);
  if (congested) {
    return {
      cause: "congestion",
      detail: "high anchored count in 3h window before arrival",
      confidence: 0.65,
    };
  }

  if (errH > 6) {
    return {
      cause: "anchorage-wait",
      detail: `${errH.toFixed(1)}h late — likely waited at anchor`,
      confidence: 0.5,
    };
  }
  if (errH > 1) {
    return {
      cause: "speed-drop",
      detail: `${errH.toFixed(1)}h slip — vessel slowed near port`,
      confidence: 0.4,
    };
  }
  return { cause: "unknown", detail: "no signal matched", confidence: 0.2 };
}
