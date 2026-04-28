"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Vessel, Zone } from "@/lib/types";
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
}

export function MapView(props: Props) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const containerClass = expanded
    ? "fixed inset-4 z-[1500]"
    : "relative h-full w-full";

  return (
    <>
      {expanded ? (
        <div
          className="fixed inset-0 z-[1400] bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      ) : null}
      <div
        className={`${containerClass} overflow-hidden rounded-lg border border-slate-800 bg-slate-900`}
      >
        <MapInner {...props} expanded={expanded} />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="absolute right-3 top-3 z-[1700] rounded-md border border-slate-700 bg-slate-900/90 px-2 py-1 text-xs text-slate-200 shadow-lg hover:border-sky-500 hover:text-sky-300"
          title={expanded ? "Réduire (Esc)" : "Agrandir"}
        >
          {expanded ? "✕ Réduire" : "⤢ Agrandir"}
        </button>
      </div>
    </>
  );
}
