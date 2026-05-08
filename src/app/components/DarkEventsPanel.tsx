"use client";

import { useI18n } from "@/lib/i18n/context";
import { CARGO_LABELS } from "@/lib/cargo";
import type { CargoClass } from "@/lib/types";

export interface DarkEventEntry {
  id: number;
  mmsi: number;
  startTs: number;
  endTs: number | null;
  durationHours: number | null;
  startLat: number;
  startLon: number;
  endLat: number | null;
  endLon: number | null;
  startState: string | null;
  startZone: string | null;
  startPort: string | null;
  name: string | null;
  cargoClass: string | null;
}

interface Props {
  events: DarkEventEntry[];
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number, lat: number, lon: number) => void;
}

function fmtAge(ts: number): string {
  const ageH = (Date.now() - ts) / 3_600_000;
  if (ageH < 1) return `${Math.round(ageH * 60)} min`;
  if (ageH < 24) return `${ageH.toFixed(1)} h`;
  return `${(ageH / 24).toFixed(1)} j`;
}

export function DarkEventsPanel({ events, selectedMmsi, onSelect }: Props) {
  const { tp } = useI18n();
  const open = events.filter((e) => e.endTs === null).length;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          🌒 {tp("darkEvents.title")}
        </span>
        <span className="text-slate-500">
          {events.length} {tp("darkEvents.count")}
          {open > 0 ? ` · ${open} ${tp("darkEvents.open")}` : ""}
        </span>
      </div>
      {events.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">
          {tp("darkEvents.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {events.slice(0, 12).map((e) => {
            const isSelected = e.mmsi === selectedMmsi;
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
                  isOpen
                    ? "border-rose-700 text-rose-300"
                    : "border-amber-700 text-amber-300"
                } ${
                  isSelected
                    ? "bg-sky-500/15 ring-1 ring-inset ring-sky-600/40"
                    : "bg-slate-950/50"
                } ${onSelect ? "cursor-pointer hover:bg-slate-800/60" : ""}`}
                title={
                  onSelect
                    ? `MMSI ${e.mmsi} — ${tp("darkEvents.tooltipClick")}`
                    : undefined
                }
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-slate-100">
                    {e.name ?? `MMSI ${e.mmsi}`}
                    {isOpen ? (
                      <span className="ml-1 inline-block rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-300">
                        {tp("darkEvents.statusOpen")}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[10px] tabular-nums text-slate-400">
                    {e.durationHours != null
                      ? `${e.durationHours.toFixed(1)} h`
                      : `${fmtAge(e.startTs)}+`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {e.cargoClass
                    ? (CARGO_LABELS[e.cargoClass as CargoClass] ?? e.cargoClass)
                    : "—"}
                  {e.startPort ? ` · ${e.startPort}` : ""}
                  {e.startZone ? ` · ${e.startZone}` : ""}
                </div>
                <div className="text-[11px] text-slate-300">
                  {tp("darkEvents.silenceFrom").replace(
                    "{age}",
                    fmtAge(e.startTs),
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
