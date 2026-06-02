"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { CARGO_LABELS } from "@/lib/cargo";
import type { CargoClass } from "@/lib/types";

interface Anomaly {
  id: string;
  kind: string;
  severity: "info" | "warn" | "critical";
  mmsi: number;
  name?: string;
  cargoClass?: string;
  zone?: string;
  detail: string;
  metricHours: number;
  /** Optional fields added in 2026-05-13 P95 thresholds refactor. */
  score?: number;
  startedAt?: number;
  threshold?: {
    warnH: number;
    criticalH: number;
    isDynamic: boolean;
    nSamples: number;
  };
}

interface Props {
  anomalies: Anomaly[];
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number) => void;
}

const sevColor: Record<Anomaly["severity"], string> = {
  info: "text-sky-400 border-sky-700",
  warn: "text-amber-400 border-amber-700",
  critical: "text-rose-400 border-rose-700",
};

const RECENT_MS = 24 * 60 * 60 * 1000;
const FRESH_SCORE_THRESHOLD = 70;

export function AnomalyPanel({ anomalies, selectedMmsi, onSelect }: Props) {
  const { t } = useI18n();
  const [expandFresh, setExpandFresh] = useState(false);

  // Compact "fresh + low-score" anomalies into a collapsed group so the
  // user sees the persistent / high-severity ones first. The fresh ones
  // are still one click away to inspect — we don't drop information.
  const now = Date.now();
  const isFreshLow = (a: Anomaly) => {
    if (!a.startedAt) return false;
    const ageMs = now - a.startedAt;
    const score = a.score ?? 0;
    return ageMs < RECENT_MS && score < FRESH_SCORE_THRESHOLD;
  };
  const prominent = anomalies.filter((a) => !isFreshLow(a));
  const compactedFresh = anomalies.filter((a) => isFreshLow(a));

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          {t("section.anomalies")}
          <span className="ml-1.5 normal-case tracking-normal text-[9px] text-slate-600">
            · {t("anomaly.method")}
          </span>
        </span>
        <span className="text-slate-500">
          {anomalies.length} {t("anomaly.count")}
          {compactedFresh.length > 0
            ? ` · ${compactedFresh.length} ${t("anomaly.recentCompact")}`
            : ""}
        </span>
      </div>
      {anomalies.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">
          {t("anomaly.none")}
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {prominent.slice(0, 12).map((a) => (
              <AnomalyRow
                key={a.id}
                anomaly={a}
                selectedMmsi={selectedMmsi}
                onSelect={onSelect}
                t={t}
              />
            ))}
          </ul>
          {compactedFresh.length > 0 ? (
            <div className="mt-2 border-t border-slate-800 pt-2">
              <button
                onClick={() => setExpandFresh((v) => !v)}
                className="w-full text-left text-[11px] text-slate-400 hover:text-slate-200"
                aria-expanded={expandFresh}
              >
                {expandFresh
                  ? `↑ ${t("anomaly.collapseFresh")}`
                  : `… ${t("anomaly.expandFresh", {
                      n: compactedFresh.length,
                    })}`}
              </button>
              {expandFresh ? (
                <ul className="mt-2 space-y-2">
                  {compactedFresh.map((a) => (
                    <AnomalyRow
                      key={a.id}
                      anomaly={a}
                      selectedMmsi={selectedMmsi}
                      onSelect={onSelect}
                      t={t}
                      compact
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function AnomalyRow({
  anomaly: a,
  selectedMmsi,
  onSelect,
  t,
  compact = false,
}: {
  anomaly: Anomaly;
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  compact?: boolean;
}) {
  const isSelected = a.mmsi === selectedMmsi;
  const clickable = !!onSelect;
  const score = a.score ?? null;
  return (
    <li
      onClick={clickable ? () => onSelect?.(a.mmsi) : undefined}
      className={`rounded border-l-2 px-2 py-1 text-xs transition-colors ${
        sevColor[a.severity]
      } ${
        isSelected
          ? "bg-sky-500/15 ring-1 ring-inset ring-sky-600/40"
          : "bg-slate-950/50"
      } ${clickable ? "cursor-pointer hover:bg-slate-800/60" : ""}`}
      title={
        clickable ? `MMSI ${a.mmsi} — ${t("anomaly.clickToCenter")}` : undefined
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-medium text-slate-100">
          {a.name ?? `MMSI ${a.mmsi}`}
        </span>
        <span className="flex shrink-0 items-baseline gap-1.5 text-[10px] tabular-nums text-slate-400">
          {score !== null ? (
            <span
              className={`rounded px-1 py-0.5 text-[9px] font-semibold ${
                score >= 90
                  ? "bg-rose-500/20 text-rose-300"
                  : score >= 50
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-slate-700/40 text-slate-300"
              }`}
              title={t("anomaly.scoreTooltip", { s: score })}
            >
              {score}
            </span>
          ) : null}
          <span>{a.metricHours.toFixed(1)} h</span>
        </span>
      </div>
      {!compact ? (
        <>
          <div className="text-[11px] text-slate-400">
            {a.cargoClass
              ? (CARGO_LABELS[a.cargoClass as CargoClass] ?? a.cargoClass)
              : "—"}
            {a.zone ? ` · ${a.zone}` : ""}
            {a.threshold?.isDynamic ? (
              <span
                className="ml-1 text-[9px] uppercase tracking-wider text-sky-400"
                title={t("anomaly.dynamicTooltip", {
                  n: a.threshold.nSamples,
                })}
              >
                · P95
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-slate-300">{a.detail}</div>
        </>
      ) : (
        <div className="text-[11px] text-slate-400">
          {a.cargoClass
            ? (CARGO_LABELS[a.cargoClass as CargoClass] ?? a.cargoClass)
            : "—"}
          {a.zone ? ` · ${a.zone}` : ""}
        </div>
      )}
    </li>
  );
}
