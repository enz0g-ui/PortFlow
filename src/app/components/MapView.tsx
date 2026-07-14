"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Vessel, Zone } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import type { SarDetection } from "./MapInner";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

interface Props {
  vessels: Vessel[];
  center: [number, number];
  bbox: [number, number, number, number];
  zones: Zone[];
  portKey: string;
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number) => void;
  selectedTrack?: Array<[number, number]>;
  highlightedMmsis?: Set<number>;
  sarDetections?: SarDetection[];
  trails?: Record<string, Array<[number, number, number]>>;
  panTo?: { lat: number; lon: number; tick: number };
  selectedVesselClass?: import("@/lib/types").VesselClass | null;
  onSelectVesselClass?: (
    cls: import("@/lib/types").VesselClass | null,
  ) => void;
}

export function MapView(props: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [resetTick, setResetTick] = useState(0);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  // Expanded map must sit ABOVE the vessel detail panel (z-[1900])
  // otherwise clicking "Agrandir" while a vessel is selected sends the
  // map behind the side panel. Stacking: backdrop 1950 < map 2000 <
  // anything inside the map (controls/legend at 1700 are inside the
  // map's stacking context so they appear above its content).
  const containerClass = expanded
    ? "fixed inset-4 z-[2000]"
    : "relative h-full w-full";

  return (
    <>
      {expanded ? (
        <div
          className="fixed inset-0 z-[1950] bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      ) : null}
      <div
        className={`${containerClass} overflow-hidden rounded-lg border border-slate-800 bg-slate-900`}
      >
        <MapInner
          {...props}
          expanded={expanded}
          resetTick={resetTick}
          panTo={props.panTo}
        />
        <div className="absolute right-3 top-3 z-[1700] flex gap-1.5">
          <button
            onClick={() => setResetTick((n) => n + 1)}
            className="rounded-md border border-slate-700 bg-slate-900/90 px-2 py-1 text-xs text-slate-200 shadow-lg backdrop-blur-sm hover:border-sky-500 hover:text-sky-300"
            title={t("map.recenter")}
          >
            ⊕ {t("map.recenterShort")}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md border border-slate-700 bg-slate-900/90 px-2 py-1 text-xs text-slate-200 shadow-lg backdrop-blur-sm hover:border-sky-500 hover:text-sky-300"
            title={expanded ? t("map.collapse") : t("map.expand")}
          >
            {expanded
              ? `✕ ${t("map.collapseShort")}`
              : `⤢ ${t("map.expandShort")}`}
          </button>
        </div>
        <MapLegend
          selected={props.selectedVesselClass ?? null}
          onSelect={props.onSelectVesselClass}
        />
      </div>
    </>
  );
}

type ClassEntry = {
  cls: import("@/lib/types").VesselClass;
  color: string;
  label: string;
};

function MapLegend({
  selected,
  onSelect,
}: {
  selected: import("@/lib/types").VesselClass | null;
  onSelect?: (cls: import("@/lib/types").VesselClass | null) => void;
}) {
  const { t } = useI18n();
  const entries: ClassEntry[] = [
    { cls: "tanker", color: "#f87171", label: t("map.legend.tanker") },
    { cls: "cargo", color: "#34d399", label: t("map.legend.cargo") },
    {
      cls: "passenger",
      color: "#a78bfa",
      label: t("map.legend.passenger"),
    },
    { cls: "fishing", color: "#facc15", label: t("map.legend.fishing") },
    { cls: "tug", color: "#38bdf8", label: t("map.legend.tug") },
    { cls: "other", color: "#94a3b8", label: t("map.legend.other") },
  ];
  const clickable = !!onSelect;
  return (
    <div
      className="absolute bottom-3 left-3 z-[1700] rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-2 text-[10px] shadow-lg backdrop-blur-sm"
      aria-label={t("map.legend.title")}
    >
      <div className="mb-1 uppercase tracking-wider text-slate-500">
        {t("map.legend.title")}
      </div>
      <ul className="space-y-0.5">
        {clickable ? (
          <li>
            <button
              type="button"
              onClick={() => onSelect!(null)}
              aria-pressed={selected === null}
              className={`flex w-full items-center gap-1.5 rounded px-1 -mx-1 py-0.5 text-left transition-colors ${
                selected === null
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background:
                    "conic-gradient(#f87171 0 25%, #34d399 25% 50%, #facc15 50% 75%, #38bdf8 75% 100%)",
                }}
                aria-hidden
              />
              <span>{t("map.legend.all")}</span>
            </button>
          </li>
        ) : null}
        {entries.map((e) => {
          const isActive = selected === e.cls;
          const isDimmed = selected !== null && !isActive;
          const onClick = clickable
            ? () => onSelect!(isActive ? null : e.cls)
            : undefined;
          return (
            <li key={e.cls}>
              {clickable ? (
                <button
                  type="button"
                  onClick={onClick}
                  aria-pressed={isActive}
                  className={`flex w-full items-center gap-1.5 rounded px-1 -mx-1 py-0.5 text-left transition-colors ${
                    isActive
                      ? "bg-slate-800 text-slate-100"
                      : isDimmed
                        ? "text-slate-500 hover:text-slate-300"
                        : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: e.color }}
                    aria-hidden
                  />
                  <span>{e.label}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: e.color }}
                    aria-hidden
                  />
                  <span className="text-slate-300">{e.label}</span>
                </div>
              )}
            </li>
          );
        })}
        <li className="flex items-center gap-1.5 border-t border-slate-800 pt-1 mt-1">
          <span
            className="inline-block h-3 w-3 rounded-full border-2 border-rose-400"
            style={{ background: "#7f1d1d" }}
            aria-hidden
          />
          <span className="text-slate-300">{t("map.legend.sanctioned")}</span>
        </li>
      </ul>
    </div>
  );
}
