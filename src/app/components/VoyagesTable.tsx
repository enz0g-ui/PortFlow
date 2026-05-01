"use client";

import { useMemo, useState } from "react";
import { CARGO_LABELS } from "@/lib/cargo";
import { useI18n } from "@/lib/i18n/context";
import type { CargoClass } from "@/lib/types";

type SortKey =
  | "name"
  | "cargo"
  | "sog"
  | "distance"
  | "predictedEta"
  | "broadcastEta";
type SortDir = "asc" | "desc";

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
  bookmarkedMmsis?: ReadonlySet<number>;
  onToggleBookmark?: (mmsi: number) => void;
  bookmarksEnabled?: boolean;
}

export function VoyagesTable({
  voyages,
  loading,
  selectedMmsi,
  onSelect,
  bookmarkedMmsis,
  onToggleBookmark,
  bookmarksEnabled = false,
}: Props) {
  const { t, locale } = useI18n();
  const isBookmarked = (mmsi: number) => bookmarkedMmsis?.has(mmsi) ?? false;
  const [sortKey, setSortKey] = useState<SortKey>("predictedEta");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const cycleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(
        key === "name" || key === "cargo" ? "asc" : "asc",
      );
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const sortedVoyages = useMemo(() => {
    const arr = [...voyages];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "cargo":
          return (a.cargoClass ?? "").localeCompare(b.cargoClass ?? "") * dir;
        case "sog":
          return (a.currentSog - b.currentSog) * dir;
        case "distance":
          return (
            ((a.currentDistanceNm ?? Infinity) -
              (b.currentDistanceNm ?? Infinity)) *
            dir
          );
        case "predictedEta":
          return (
            ((a.predictedEta ?? Infinity) - (b.predictedEta ?? Infinity)) * dir
          );
        case "broadcastEta":
          return (
            ((a.broadcastEta ?? Infinity) - (b.broadcastEta ?? Infinity)) * dir
          );
        default:
          return 0;
      }
    });
    return arr;
  }, [voyages, sortKey, sortDir]);
  return (
    <div className="flex h-full min-h-[440px] flex-col rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          {t("section.activeVoyages")}
        </span>
        <span className="text-slate-500">
          {t("voyages.count", { n: voyages.length })}
        </span>
      </div>
      <div className="scroll-thin flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-900 text-slate-500">
            <tr className="text-left">
              {bookmarksEnabled ? (
                <th className="py-1 pr-1 font-normal w-6"></th>
              ) : null}
              <th
                className="cursor-pointer py-1 pr-2 font-normal hover:text-slate-300"
                onClick={() => cycleSort("name")}
                title="Trier par nom"
              >
                {t("table.vessel")}
                {sortIndicator("name")}
              </th>
              <th
                className="cursor-pointer py-1 pr-2 font-normal hover:text-slate-300"
                onClick={() => cycleSort("cargo")}
                title="Trier par cargo"
              >
                {t("table.cargo")}
                {sortIndicator("cargo")}
              </th>
              <th
                className="cursor-pointer py-1 pr-2 font-normal text-right hover:text-slate-300"
                onClick={() => cycleSort("sog")}
                title="Trier par vitesse"
              >
                {t("table.sog")}
                {sortIndicator("sog")}
              </th>
              <th
                className="cursor-pointer py-1 pr-2 font-normal text-right hover:text-slate-300"
                onClick={() => cycleSort("distance")}
                title="Trier par distance"
              >
                {t("table.distance")}
                {sortIndicator("distance")}
              </th>
              <th
                className="cursor-pointer py-1 pr-2 font-normal hover:text-slate-300"
                onClick={() => cycleSort("predictedEta")}
                title="Trier par ETA prédit"
              >
                {t("table.predictedEta")}
                {sortIndicator("predictedEta")}
              </th>
              <th
                className="cursor-pointer py-1 pr-2 font-normal hover:text-slate-300"
                onClick={() => cycleSort("broadcastEta")}
                title="Trier par ETA broadcast"
              >
                {t("table.broadcastEta")}
                {sortIndicator("broadcastEta")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && voyages.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    {bookmarksEnabled ? (
                      <td className="py-2 pr-1 text-slate-700">—</td>
                    ) : null}
                    <td className="py-2 pr-2 text-slate-700">—</td>
                    <td className="py-2 pr-2 text-slate-700">—</td>
                    <td className="py-2 pr-2 text-right text-slate-700">—</td>
                    <td className="py-2 pr-2 text-right text-slate-700">—</td>
                    <td className="py-2 pr-2 text-slate-700">—</td>
                    <td className="py-2 pr-2 text-slate-700">—</td>
                  </tr>
                ))
              : null}
            {sortedVoyages.map((v) => (
              <tr
                key={v.voyageId}
                className={`cursor-pointer border-t border-slate-800 transition-colors ${
                  v.mmsi === selectedMmsi
                    ? "bg-sky-500/15"
                    : "hover:bg-slate-800/40"
                }`}
                onClick={() => onSelect?.(v.mmsi)}
              >
                {bookmarksEnabled ? (
                  <td
                    className="py-2 pr-1 align-top"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BookmarkButton
                      active={isBookmarked(v.mmsi)}
                      onClick={() => onToggleBookmark?.(v.mmsi)}
                      addLabel={t("vessel.bookmark.add")}
                      removeLabel={t("vessel.bookmark.remove")}
                    />
                  </td>
                ) : null}
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
                <td className="py-2 pr-2 align-middle">
                  <div className="flex flex-col items-end gap-1">
                    <span className="tabular-nums text-slate-300">
                      {v.currentDistanceNm?.toFixed(1) ?? "—"} nm
                    </span>
                    {v.startDistanceNm != null &&
                    v.currentDistanceNm != null &&
                    v.startDistanceNm > 0 ? (
                      <ProgressBar
                        progress={Math.max(
                          0,
                          Math.min(
                            1,
                            1 - v.currentDistanceNm / v.startDistanceNm,
                          ),
                        )}
                      />
                    ) : null}
                  </div>
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
                  colSpan={bookmarksEnabled ? 7 : 6}
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

function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  // < 33% amber (early), 33-80% sky (in transit), > 80% emerald (almost there).
  const color =
    pct >= 80
      ? "bg-emerald-400"
      : pct >= 33
        ? "bg-sky-400"
        : "bg-amber-400";
  return (
    <div
      className="relative h-1 w-20 overflow-hidden rounded-full bg-slate-800"
      title={`${pct}% du voyage`}
      aria-label={`${pct}% complete`}
    >
      <div
        className={`absolute left-0 top-0 h-full ${color} transition-[width]`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BookmarkButton({
  active,
  onClick,
  addLabel,
  removeLabel,
}: {
  active: boolean;
  onClick: () => void;
  addLabel: string;
  removeLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      title={active ? removeLabel : addLabel}
      aria-label={active ? removeLabel : addLabel}
      className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
        active
          ? "text-sky-400 hover:bg-sky-500/20"
          : "text-slate-600 hover:text-sky-400 hover:bg-slate-700"
      }`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
        {active ? (
          <path d="M3 2v12.5l5-3 5 3V2H3z" />
        ) : (
          <path
            d="M3.5 2v11.5l4.5-2.7 4.5 2.7V2h-9zm1 1h7v9.2L8 10.5l-3.5 1.7V3z"
            fillRule="evenodd"
          />
        )}
      </svg>
    </button>
  );
}
