import { getAnchoredVessels } from "./store";
import { getThreshold } from "./anomaly-thresholds";
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
  /**
   * Human-readable detail in EN (i18n primary). Format intentionally
   * loose — the UI may prefer to compose from the structured fields
   * (metricHours, threshold) for translation.
   */
  detail: string;
  metricHours: number;
  /** When the underlying behavior started (now − metricHours × 1h). */
  startedAt: number;
  detectedAt: number;
  /**
   * 0-100 severity score. Lets the UI sort meaningfully without coupling
   * to the discrete severity bucket. Formula:
   *   score = min(100, round(100 × (dwellH − warnH) / (criticalH − warnH)))
   * Below warnH → score < 0 (excluded). At criticalH → 100. Above → 100.
   */
  score: number;
  /** Threshold metadata so the UI can show "above P95 (port norm)" etc. */
  threshold: {
    warnH: number;
    criticalH: number;
    isDynamic: boolean;
    nSamples: number;
  };
}

const HOUR = 3_600_000;

function computeScore(
  dwellH: number,
  warnH: number,
  criticalH: number,
): number {
  if (criticalH <= warnH) return dwellH >= criticalH ? 100 : 0;
  const raw = (100 * (dwellH - warnH)) / (criticalH - warnH);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function computeAnomalies(portId: string): Anomaly[] {
  const anchored = getAnchoredVessels(portId);
  const now = Date.now();
  const out: Anomaly[] = [];

  for (const v of anchored) {
    const dwellH = (now - v.anchorStart) / HOUR;
    const threshold = getThreshold(portId, v.cargoClass);
    const { warnH, criticalH } = threshold;

    if (dwellH < warnH) continue;

    const severity: AnomalySeverity =
      dwellH >= criticalH ? "critical" : "warn";
    const kind: AnomalyKind =
      severity === "critical" ? "very-long-anchor" : "extended-anchor";
    const score = computeScore(dwellH, warnH, criticalH);

    const dynamicSuffix = threshold.isDynamic
      ? ` (P95 of ${threshold.nSamples} samples)`
      : "";

    out.push({
      id: `${portId}-${v.mmsi}-${severity === "critical" ? "vlong" : "ext"}`,
      kind,
      severity,
      mmsi: v.mmsi,
      name: v.name,
      cargoClass: v.cargoClass,
      zone: v.zone,
      detail: `Anchored for ${dwellH.toFixed(1)} h (threshold ${
        severity === "critical" ? criticalH.toFixed(0) : warnH.toFixed(0)
      } h${dynamicSuffix})`,
      metricHours: dwellH,
      startedAt: v.anchorStart,
      detectedAt: now,
      score,
      threshold: {
        warnH,
        criticalH,
        isDynamic: threshold.isDynamic,
        nSamples: threshold.nSamples,
      },
    });
  }

  // Sort by severity score desc — critical+old floats above young+borderline.
  out.sort((a, b) => b.score - a.score);
  return out;
}
