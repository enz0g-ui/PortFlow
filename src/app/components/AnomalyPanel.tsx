"use client";

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

export function AnomalyPanel({ anomalies, selectedMmsi, onSelect }: Props) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          {t("section.anomalies")}
        </span>
        <span className="text-slate-500">
          {anomalies.length} {t("anomaly.count")}
        </span>
      </div>
      {anomalies.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">
          {t("anomaly.none")}
        </p>
      ) : (
        <ul className="space-y-2">
          {anomalies.slice(0, 12).map((a) => {
            const isSelected = a.mmsi === selectedMmsi;
            const clickable = !!onSelect;
            return (
              <li
                key={a.id}
                onClick={clickable ? () => onSelect?.(a.mmsi) : undefined}
                className={`rounded border-l-2 px-2 py-1 text-xs transition-colors ${
                  sevColor[a.severity]
                } ${
                  isSelected
                    ? "bg-sky-500/15 ring-1 ring-inset ring-sky-600/40"
                    : "bg-slate-950/50"
                } ${
                  clickable
                    ? "cursor-pointer hover:bg-slate-800/60"
                    : ""
                }`}
                title={
                  clickable
                    ? `MMSI ${a.mmsi} — clic pour centrer la carte`
                    : undefined
                }
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-slate-100">
                    {a.name ?? `MMSI ${a.mmsi}`}
                  </span>
                  <span className="text-[10px] tabular-nums text-slate-400">
                    {a.metricHours.toFixed(1)} h
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {a.cargoClass
                    ? (CARGO_LABELS[a.cargoClass as CargoClass] ?? a.cargoClass)
                    : "—"}
                  {a.zone ? ` · ${a.zone}` : ""}
                </div>
                <div className="text-[11px] text-slate-300">{a.detail}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
