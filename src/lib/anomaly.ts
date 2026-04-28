import { getAnchoredVessels } from "./store";
import type { CargoClass } from "./types";

export type AnomalySeverity = "info" | "warn" | "critical";
export type AnomalyKind = "extended-anchor" | "very-long-anchor";

export interface Anomaly {
  id: string;
  kind: AnomalyKind;
  severity: AnomalySeverity;
  mmsi: number;
  name?: string;
  cargoClass?: CargoClass;
  zone?: string;
  detail: string;
  metricHours: number;
  detectedAt: number;
}

const HOUR = 3_600_000;

const TANKER_SET = new Set<CargoClass>([
  "crude",
  "product",
  "chemical",
  "lng",
  "lpg",
]);

function thresholdHours(cargoClass?: CargoClass): {
  warn: number;
  critical: number;
} {
  if (cargoClass && TANKER_SET.has(cargoClass)) {
    return { warn: 12, critical: 48 };
  }
  if (cargoClass === "container") return { warn: 6, critical: 24 };
  return { warn: 18, critical: 72 };
}

export function computeAnomalies(portId: string): Anomaly[] {
  const anchored = getAnchoredVessels(portId);
  const now = Date.now();
  const out: Anomaly[] = [];

  for (const v of anchored) {
    const dwellH = (now - v.anchorStart) / HOUR;
    const { warn, critical } = thresholdHours(v.cargoClass);
    if (dwellH >= critical) {
      out.push({
        id: `${portId}-${v.mmsi}-vlong`,
        kind: "very-long-anchor",
        severity: "critical",
        mmsi: v.mmsi,
        name: v.name,
        cargoClass: v.cargoClass,
        zone: v.zone,
        detail: `Au mouillage depuis ${dwellH.toFixed(1)} h (seuil ${critical} h)`,
        metricHours: dwellH,
        detectedAt: now,
      });
    } else if (dwellH >= warn) {
      out.push({
        id: `${portId}-${v.mmsi}-ext`,
        kind: "extended-anchor",
        severity: "warn",
        mmsi: v.mmsi,
        name: v.name,
        cargoClass: v.cargoClass,
        zone: v.zone,
        detail: `Au mouillage depuis ${dwellH.toFixed(1)} h (seuil ${warn} h)`,
        metricHours: dwellH,
        detectedAt: now,
      });
    }
  }

  out.sort((a, b) => b.metricHours - a.metricHours);
  return out;
}
