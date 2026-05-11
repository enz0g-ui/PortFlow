"use client";

import { useI18n } from "@/lib/i18n/context";
import { CARGO_LABELS } from "@/lib/cargo";
import type { CargoClass } from "@/lib/types";

export interface EncounterEntry {
  id: number;
  mmsiA: number;
  mmsiB: number;
  startTs: number;
  endTs: number | null;
  durationH: number | null;
  medianDistanceM: number | null;
  chokepointId: string | null;
  startLat: number;
  startLon: number;
  wasSanctionedA: boolean;
  wasSanctionedB: boolean;
  vesselAName: string | null;
  vesselBName: string | null;
  vesselACargoClass: string | null;
  vesselBCargoClass: string | null;
}

export interface LoiteringEntry {
  id: number;
  mmsi: number;
  startTs: number;
  endTs: number | null;
  durationH: number | null;
  avgSpeedKn: number | null;
  startLat: number;
  startLon: number;
  endLat: number | null;
  endLon: number | null;
  wasSanctioned: boolean;
  name: string | null;
  cargoClass: string | null;
}

interface Props {
  encounters: EncounterEntry[];
  loitering: LoiteringEntry[];
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number, lat: number, lon: number) => void;
}

const CHOKEPOINT_NAMES: Record<string, string> = {
  cp_suez: "Suez",
  cp_hormuz: "Hormuz",
  cp_bab_el_mandeb: "Bab el-Mandeb",
  cp_malacca: "Malacca",
  cp_singapore: "Singapore",
  cp_bosphorus: "Bosphorus",
  cp_gibraltar: "Gibraltar",
  cp_skagerrak: "Skagerrak",
  cp_dover: "Dover",
  cp_panama: "Panama",
  cp_good_hope: "Good Hope",
  cp_magellan: "Magellan",
};

function fmtAge(ts: number): string {
  const ageH = (Date.now() - ts) / 3_600_000;
  if (ageH < 1) return `${Math.round(ageH * 60)} min`;
  if (ageH < 24) return `${ageH.toFixed(1)} h`;
  return `${(ageH / 24).toFixed(1)} j`;
}

export function EncountersLoiteringPanel({
  encounters,
  loitering,
  selectedMmsi,
  onSelect,
}: Props) {
  const { t } = useI18n();
  const sanctionedEnc = encounters.filter(
    (e) => e.wasSanctionedA || e.wasSanctionedB,
  ).length;
  const sanctionedLoit = loitering.filter((e) => e.wasSanctioned).length;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="uppercase tracking-wider text-slate-400">
            🛢 {t("encounters.title")}
          </span>
          <span className="text-slate-500">
            {encounters.length} {t("encounters.count")}
            {sanctionedEnc > 0
              ? ` · ${sanctionedEnc} ${t("encounters.sanctioned")}`
              : ""}
          </span>
        </div>
        {encounters.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            {t("encounters.empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {encounters.slice(0, 12).map((e) => {
              const isSelected =
                e.mmsiA === selectedMmsi || e.mmsiB === selectedMmsi;
              const flagged = e.wasSanctionedA || e.wasSanctionedB;
              const cp = e.chokepointId
                ? (CHOKEPOINT_NAMES[e.chokepointId] ?? e.chokepointId)
                : null;
              return (
                <li
                  key={e.id}
                  onClick={
                    onSelect
                      ? () => onSelect(e.mmsiA, e.startLat, e.startLon)
                      : undefined
                  }
                  className={`rounded border-l-2 px-2 py-1 text-xs transition-colors ${
                    flagged
                      ? "border-rose-700 text-rose-200"
                      : "border-amber-700 text-amber-200"
                  } ${
                    isSelected
                      ? "bg-sky-500/15 ring-1 ring-inset ring-sky-600/40"
                      : "bg-slate-950/50"
                  } ${onSelect ? "cursor-pointer hover:bg-slate-800/60" : ""}`}
                  title={
                    onSelect
                      ? `${e.mmsiA} × ${e.mmsiB} — ${t("encounters.tooltipClick")}`
                      : undefined
                  }
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium text-slate-100">
                      {e.vesselAName ?? `MMSI ${e.mmsiA}`}
                      {e.wasSanctionedA ? (
                        <span className="ml-1 text-rose-400" title="Sanctioned">
                          ⚠
                        </span>
                      ) : null}
                      <span className="mx-1 text-slate-500">×</span>
                      {e.vesselBName ?? `MMSI ${e.mmsiB}`}
                      {e.wasSanctionedB ? (
                        <span className="ml-1 text-rose-400" title="Sanctioned">
                          ⚠
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                      {e.durationH != null
                        ? `${e.durationH.toFixed(1)} h`
                        : `${fmtAge(e.startTs)}+`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {cp ? `${cp}` : t("encounters.openWater")}
                    {e.medianDistanceM != null
                      ? ` · ${e.medianDistanceM} m`
                      : ""}
                    {e.vesselACargoClass || e.vesselBCargoClass
                      ? ` · ${
                          CARGO_LABELS[
                            (e.vesselACargoClass ??
                              e.vesselBCargoClass) as CargoClass
                          ] ??
                          e.vesselACargoClass ??
                          e.vesselBCargoClass
                        }`
                      : ""}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="uppercase tracking-wider text-slate-400">
            🐢 {t("loitering.title")}
          </span>
          <span className="text-slate-500">
            {loitering.length} {t("loitering.count")}
            {sanctionedLoit > 0
              ? ` · ${sanctionedLoit} ${t("loitering.sanctioned")}`
              : ""}
          </span>
        </div>
        {loitering.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            {t("loitering.empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {loitering.slice(0, 12).map((e) => {
              const isSelected = e.mmsi === selectedMmsi;
              const flagged = e.wasSanctioned;
              const isOpen = e.endTs === null;
              return (
                <li
                  key={e.id}
                  onClick={
                    onSelect
                      ? () => onSelect(e.mmsi, e.startLat, e.startLon)
                      : undefined
                  }
                  className={`rounded border-l-2 px-2 py-1 text-xs transition-colors ${
                    flagged
                      ? "border-rose-700 text-rose-200"
                      : isOpen
                        ? "border-sky-700 text-sky-200"
                        : "border-amber-700 text-amber-200"
                  } ${
                    isSelected
                      ? "bg-sky-500/15 ring-1 ring-inset ring-sky-600/40"
                      : "bg-slate-950/50"
                  } ${onSelect ? "cursor-pointer hover:bg-slate-800/60" : ""}`}
                  title={
                    onSelect
                      ? `MMSI ${e.mmsi} — ${t("loitering.tooltipClick")}`
                      : undefined
                  }
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium text-slate-100">
                      {e.name ?? `MMSI ${e.mmsi}`}
                      {flagged ? (
                        <span className="ml-1 text-rose-400" title="Sanctioned">
                          ⚠
                        </span>
                      ) : null}
                      {isOpen ? (
                        <span className="ml-1 inline-block rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sky-300">
                          {t("loitering.statusOpen")}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                      {e.durationH != null
                        ? `${e.durationH.toFixed(1)} h`
                        : `${fmtAge(e.startTs)}+`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {e.cargoClass
                      ? (CARGO_LABELS[e.cargoClass as CargoClass] ??
                        e.cargoClass)
                      : "—"}
                    {e.avgSpeedKn != null
                      ? ` · ${e.avgSpeedKn.toFixed(1)} kn`
                      : ""}
                    {` · ${fmtAge(e.startTs)}`}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
