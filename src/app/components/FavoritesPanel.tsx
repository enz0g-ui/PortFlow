"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { CARGO_LABELS } from "@/lib/cargo";
import type { CargoClass } from "@/lib/types";

interface FleetVessel {
  mmsi: number;
  name: string;
  cargoClass?: string | null;
  position?: {
    ts: number;
    lat: number;
    lon: number;
    sog: number;
    state?: string | null;
  };
  currentPort?: {
    id: string;
    name: string;
    flag: string;
  };
  openVoyage?: {
    portName: string;
    predictedEta?: number | null;
  };
  lastClosedVoyage?: {
    portName: string;
    arrivedTs: number;
  };
}

interface FleetResp {
  count: number;
  vessels: FleetVessel[];
  ts: number;
}

function fmtEta(ts: number | null | undefined): string {
  if (!ts) return "—";
  const diff = (ts - Date.now()) / 3_600_000;
  const sign = diff < 0 ? "−" : "+";
  return `${sign}${Math.abs(diff).toFixed(1)}h`;
}

interface Props {
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number, pos?: { lat: number; lon: number }) => void;
  onSelectPort?: (portId: string) => void;
  onToggleBookmark?: (mmsi: number) => void;
}

export function FavoritesPanel({
  selectedMmsi,
  onSelect,
  onSelectPort,
  onToggleBookmark,
}: Props) {
  const { t } = useI18n();
  const [data, setData] = useState<FleetResp | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/user/fleet", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (cancelled || !json) return;
          setData(json as FleetResp);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex h-full min-h-[440px] flex-col rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          ★ {t("port.section.mine") || "Favoris"} · navires
        </span>
        <span className="text-slate-500">
          {data ? `${data.count} navires` : "…"}
        </span>
      </div>
      <div className="scroll-thin flex-1 overflow-auto">
        {!data ? (
          <div className="py-6 text-center text-xs text-slate-500">…</div>
        ) : data.vessels.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Aucun navire favori. Click ☐ sur une ligne de Voyages actifs pour
            ajouter.
          </div>
        ) : (
          <ul className="space-y-1 text-xs">
            {data.vessels.map((v) => {
              const cargo = v.cargoClass
                ? (CARGO_LABELS[v.cargoClass as CargoClass] ?? v.cargoClass)
                : null;
              const stateLabel = v.currentPort
                ? `${v.currentPort.flag} ${v.currentPort.name}`
                : v.openVoyage
                  ? `→ ${v.openVoyage.portName}`
                  : "en mer";
              const eta = v.openVoyage?.predictedEta;
              return (
                <li
                  key={v.mmsi}
                  className={`flex items-start gap-2 rounded border px-2 py-1.5 transition-colors ${
                    v.mmsi === selectedMmsi
                      ? "border-sky-700 bg-sky-500/10"
                      : "border-slate-800 hover:bg-slate-800/40"
                  }`}
                >
                  <button
                    onClick={() =>
                      onSelect?.(
                        v.mmsi,
                        v.position
                          ? { lat: v.position.lat, lon: v.position.lon }
                          : undefined,
                      )
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium text-slate-200">
                        {v.name}
                      </span>
                      {eta ? (
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-sky-300">
                          {fmtEta(eta)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-baseline justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">
                        MMSI {v.mmsi}
                        {cargo ? ` · ${cargo}` : ""}
                        {v.position?.sog != null
                          ? ` · ${v.position.sog.toFixed(1)} kn`
                          : ""}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {stateLabel}
                    </div>
                  </button>
                  <div className="flex flex-col gap-1">
                    {v.currentPort?.id ? (
                      <button
                        onClick={() => onSelectPort?.(v.currentPort!.id)}
                        title={`Aller sur ${v.currentPort.name}`}
                        className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-sky-500"
                      >
                        →
                      </button>
                    ) : null}
                    {onToggleBookmark ? (
                      <button
                        onClick={() => onToggleBookmark(v.mmsi)}
                        title="Retirer des favoris"
                        className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 hover:border-rose-500 hover:text-rose-400"
                      >
                        ✕
                      </button>
                    ) : null}
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
