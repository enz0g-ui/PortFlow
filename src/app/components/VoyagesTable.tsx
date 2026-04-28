"use client";

import { CARGO_LABELS } from "@/lib/cargo";
import { useI18n } from "@/lib/i18n/context";
import type { CargoClass } from "@/lib/types";

export interface ActiveVoyage {
  voyageId: string;
  mmsi: number;
  name: string;
  cargoClass?: string;
  startTs: number;
  startDistanceNm?: number;
  currentDistanceNm?: number;
  currentSog: number;
  currentState: string;
  zone?: string;
  predictedEta?: number | null;
  broadcastEta?: number | null;
  draught?: number | null;
}

function fmtEta(ts: number | null | undefined, locale: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = Date.now();
  const diffH = (ts - now) / 3_600_000;
  const sign = diffH < 0 ? "−" : "+";
  return `${d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })} (${sign}${Math.abs(diffH).toFixed(1)} h)`;
}

interface Props {
  voyages: ActiveVoyage[];
  loading?: boolean;
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number) => void;
}

export function VoyagesTable({
  voyages,
  loading,
  selectedMmsi,
  onSelect,
}: Props) {
  const { t, locale } = useI18n();
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          {t("section.activeVoyages")}
        </span>
        <span className="text-slate-500">
          {t("voyages.count", { n: voyages.length })}
        </span>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-900 text-slate-500">
            <tr className="text-left">
              <th className="py-1 pr-2 font-normal">{t("table.vessel")}</th>
              <th className="py-1 pr-2 font-normal">{t("table.cargo")}</th>
              <th className="py-1 pr-2 font-normal text-right">
                {t("table.sog")}
              </th>
              <th className="py-1 pr-2 font-normal text-right">
                {t("table.distance")}
              </th>
              <th className="py-1 pr-2 font-normal">
                {t("table.predictedEta")}
              </th>
              <th className="py-1 pr-2 font-normal">
                {t("table.broadcastEta")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && voyages.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="py-2 pr-2 text-slate-700">—</td>
                    <td className="py-2 pr-2 text-slate-700">—</td>
                    <td className="py-2 pr-2 text-right text-slate-700">—</td>
                    <td className="py-2 pr-2 text-right text-slate-700">—</td>
                    <td className="py-2 pr-2 text-slate-700">—</td>
                    <td className="py-2 pr-2 text-slate-700">—</td>
                  </tr>
                ))
              : null}
            {voyages.map((v) => (
              <tr
                key={v.voyageId}
                className={`cursor-pointer border-t border-slate-800 transition-colors ${
                  v.mmsi === selectedMmsi
                    ? "bg-sky-500/15"
                    : "hover:bg-slate-800/40"
                }`}
                onClick={() => onSelect?.(v.mmsi)}
              >
                <td className="py-2 pr-2">
                  <div className="font-medium text-slate-200">{v.name}</div>
                  <div className="text-[10px] text-slate-500">
                    MMSI {v.mmsi} · {v.currentState}
                  </div>
                </td>
                <td className="py-2 pr-2 text-slate-300">
                  {v.cargoClass
                    ? (CARGO_LABELS[v.cargoClass as CargoClass] ?? v.cargoClass)
                    : "—"}
                </td>
                <td className="py-2 pr-2 text-right tabular-nums text-slate-300">
                  {v.currentSog.toFixed(1)} kn
                </td>
                <td className="py-2 pr-2 text-right tabular-nums text-slate-300">
                  {v.currentDistanceNm?.toFixed(1) ?? "—"} nm
                </td>
                <td className="py-2 pr-2 tabular-nums text-sky-300">
                  {fmtEta(v.predictedEta, locale)}
                </td>
                <td className="py-2 pr-2 tabular-nums text-slate-400">
                  {fmtEta(v.broadcastEta, locale)}
                </td>
              </tr>
            ))}
            {!loading && voyages.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 text-center text-xs text-slate-500"
                >
                  {t("table.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
