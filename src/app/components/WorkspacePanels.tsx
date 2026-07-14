"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

/**
 * Workspace « tout sur un écran » (maquette Claude Design v2, 14/07/2026) :
 * composants compacts du shell — rail de navigation, panneau contexte
 * (navire sélectionné + feed risque) accolé à la carte, mix flotte accolé
 * à la table. Les panneaux détaillés historiques restent sous la ligne de
 * flottaison : ces composants condensent, ils ne remplacent pas.
 */

/* ------------------------------------------------------------------ */
/* Rail                                                                */
/* ------------------------------------------------------------------ */

export function WorkspaceRail({ portId }: { portId: string }) {
  const { t } = useI18n();
  const items: Array<{
    icon: string;
    label: string;
    tip: string;
    href: string;
    active?: boolean;
  }> = [
    { icon: "◉", label: "LIVE", tip: t("ws.rail.live"), href: "#top", active: true },
    { icon: "◷", label: "ETA", tip: t("ws.rail.eta"), href: `/precision?port=${portId}` },
    { icon: "⚠", label: "RISK", tip: t("ws.rail.risk"), href: "#risk" },
    { icon: "⚓", label: "PORTS", tip: t("ws.rail.ports"), href: "/ports" },
    { icon: "≣", label: "LIST", tip: t("ws.rail.list"), href: "#voyages" },
  ];
  return (
    <div className="hidden w-[52px] flex-none flex-col items-center gap-1 border-r border-slate-800 bg-slate-900/70 py-2.5 lg:flex">
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          title={it.tip}
          className={`flex h-[42px] w-[42px] flex-col items-center justify-center gap-0.5 rounded-md border ${
            it.active
              ? "border-sky-500/40 bg-sky-500/15 text-sky-400"
              : "border-transparent text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
          }`}
        >
          <span className="text-[13px] leading-none">{it.icon}</span>
          <span className="font-mono text-[7.5px] font-semibold tracking-[0.06em]">
            {it.label}
          </span>
        </Link>
      ))}
      <Link
        href="/api-docs"
        title={t("ws.rail.api")}
        className="mt-auto flex h-[42px] w-[42px] flex-col items-center justify-center gap-0.5 rounded-md text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
      >
        <span className="text-[13px] leading-none">⚙</span>
        <span className="font-mono text-[7.5px] font-semibold tracking-[0.06em]">API</span>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Context panel — selected vessel + risk feed                         */
/* ------------------------------------------------------------------ */

export interface ContextVessel {
  mmsi: number;
  name?: string;
  cargoClass?: string;
  sog: number;
  state: string;
  zone?: string;
  sanctioned?: boolean;
}

export interface ContextVoyage {
  predictedEta?: number | null;
  broadcastEta?: number | null;
  currentDistanceNm?: number;
  startDistanceNm?: number;
  currentSog: number;
  voyageState?: "inbound" | "waiting";
}

export interface RiskFeedItem {
  id: string;
  name: string;
  meta: string;
  value: string;
  mmsi?: number;
}

function fmtEta(ts?: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContextPanel({
  vessel,
  voyage,
  portName,
  portBlurb,
  darkCount,
  stsCount,
  loiterCount,
  riskItems,
  onSelectMmsi,
  onOpenDetail,
  onClear,
}: {
  vessel: ContextVessel | null;
  voyage: ContextVoyage | null;
  portName: string;
  portBlurb?: string;
  darkCount: number;
  stsCount: number;
  loiterCount: number;
  riskItems: RiskFeedItem[];
  onSelectMmsi: (mmsi: number) => void;
  onOpenDetail: () => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const deltaH =
    voyage?.predictedEta != null && voyage?.broadcastEta != null
      ? (voyage.broadcastEta - voyage.predictedEta) / 3_600_000
      : null;
  const anomalous = deltaH != null && Math.abs(deltaH) > 48;
  const progress =
    voyage?.currentDistanceNm != null &&
    voyage?.startDistanceNm != null &&
    voyage.startDistanceNm > 0
      ? Math.max(
          4,
          Math.min(
            100,
            Math.round(
              (1 - voyage.currentDistanceNm / voyage.startDistanceNm) * 100,
            ),
          ),
        )
      : null;

  return (
    <div className="flex min-h-0 flex-col border-t border-slate-800 bg-slate-900/40 lg:border-l lg:border-t-0">
      <div className="flex flex-none items-center gap-2 border-b border-slate-800 px-4 py-2.5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sky-500">
          ◈ {t("ws.selectedVessel")}
        </span>
        <span className="ml-auto font-mono text-[9.5px] text-slate-600">
          {t("ws.sync")}
        </span>
      </div>

      {vessel ? (
        <div className="flex-none border-b border-slate-800 p-4">
          <div className="flex items-baseline gap-2.5">
            <span className="truncate text-[17px] font-bold tracking-tight text-slate-100">
              {vessel.name ?? `MMSI ${vessel.mmsi}`}
            </span>
            <span
              className={`flex-none rounded border px-2 py-0.5 font-mono text-[9px] font-semibold ${
                vessel.sanctioned
                  ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                  : anomalous
                    ? "border-rose-400/35 bg-rose-400/10 text-rose-300"
                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {vessel.sanctioned
                ? t("ws.state.sanctioned")
                : anomalous
                  ? t("ws.state.anomalous")
                  : voyage?.voyageState === "waiting"
                    ? t("ws.state.waiting")
                    : t("ws.state.approaching")}
            </span>
            <button
              onClick={onClear}
              className="ml-auto flex-none text-slate-600 hover:text-slate-300"
              aria-label={t("ws.clearSelection")}
            >
              ✕
            </button>
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] text-slate-500">
            MMSI {vessel.mmsi} · {vessel.cargoClass ?? "—"} · {vessel.state}
            {vessel.zone ? ` · ${vessel.zone}` : ""}
          </div>

          {progress != null ? (
            <div className="mt-3.5">
              <div className="mb-1 flex justify-between font-mono text-[9.5px] uppercase text-slate-500">
                <span>{t("ws.approach")}</span>
                <span className="text-slate-200">
                  {voyage?.currentDistanceNm?.toFixed(1)} nm
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full rounded bg-gradient-to-r from-sky-500/50 to-sky-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {voyage ? (
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-md border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5">
                <div className="mb-0.5 font-mono text-[8.5px] font-medium uppercase tracking-[0.1em] text-emerald-300">
                  {t("ws.portFlowEta")}
                </div>
                <div className="font-mono text-[15px] font-semibold text-emerald-300">
                  {fmtEta(voyage.predictedEta)}
                </div>
              </div>
              <div className="rounded-md border border-rose-400/15 bg-rose-400/5 px-3 py-2.5">
                <div className="mb-0.5 font-mono text-[8.5px] font-medium uppercase tracking-[0.1em] text-rose-300/80">
                  {t("ws.broadcastEta")}
                </div>
                <div
                  className={`font-mono text-[15px] font-semibold ${
                    anomalous ? "text-rose-300" : "text-slate-300"
                  }`}
                >
                  {fmtEta(voyage.broadcastEta)}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-4 font-mono text-[10.5px] text-slate-400">
            <span>
              SOG <b className="text-slate-100">{vessel.sog.toFixed(1)} kn</b>
            </span>
            {deltaH != null ? (
              <span>
                Δ broadcast{" "}
                <b className={anomalous ? "text-rose-300" : deltaH > 0 ? "text-emerald-300" : "text-slate-300"}>
                  {deltaH > 0 ? "+" : ""}
                  {deltaH.toFixed(1)} h
                </b>
              </span>
            ) : null}
            <button
              onClick={onOpenDetail}
              className="ml-auto font-sans text-[11px] font-semibold text-sky-400 hover:text-sky-300"
            >
              {t("ws.fullProfile")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-none border-b border-slate-800 p-4">
          <div className="text-[15px] font-semibold text-slate-100">
            {portName}
          </div>
          {portBlurb ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {portBlurb}
            </p>
          ) : null}
          <p className="mt-2 font-mono text-[10px] text-slate-600">
            {t("ws.clickHint")}
          </p>
        </div>
      )}

      {/* risk feed */}
      <div className="flex flex-none items-center gap-1.5 px-4 pb-1.5 pt-2.5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-rose-300">
          ⚠ {t("ws.riskHeader")}
        </span>
        <span className="ml-auto flex gap-1 font-mono text-[9.5px]">
          <span className="rounded border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 font-semibold text-rose-300">
            Dark {darkCount}
          </span>
          <span className="px-1.5 py-0.5 text-slate-500">STS {stsCount}</span>
          <span className="px-1.5 py-0.5 text-slate-500">Loiter {loiterCount}</span>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {riskItems.length > 0 ? (
            riskItems.map((e) => (
              <button
                key={e.id}
                onClick={() => (e.mmsi != null ? onSelectMmsi(e.mmsi) : undefined)}
                className="flex w-full items-center justify-between border-t border-slate-800/60 px-4 py-2 text-left hover:bg-rose-400/5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] font-semibold text-slate-100">
                    {e.name}
                  </span>
                  <span className="block truncate font-mono text-[9.5px] text-slate-500">
                    {e.meta}
                  </span>
                </span>
                <span className="ml-3 flex-none font-mono text-[11.5px] font-semibold text-rose-300">
                  {e.value}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-4 font-mono text-[10px] text-slate-600">
              {t("ws.noDetections")}
            </div>
          )}
        </div>
        <a
          href="#risk"
          className="flex flex-none items-center justify-between border-t border-slate-800 px-4 py-2"
        >
          <span className="font-mono text-[10px] text-slate-500">
            {t("ws.eventsDetected", { n: darkCount + stsCount + loiterCount })}
          </span>
          <span className="text-[11px] font-semibold text-sky-400">
            {t("ws.seeAll")}
          </span>
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mix panel — fleet + cargo bars                                      */
/* ------------------------------------------------------------------ */

export function MixPanel({
  fleet,
  cargo,
  avgSpeed,
}: {
  fleet: Array<{ label: string; n: number }>;
  cargo: Array<{ label: string; n: number }>;
  avgSpeed: number | null;
}) {
  const { t } = useI18n();
  const fleetMax = Math.max(1, ...fleet.map((m) => m.n));
  const cargoMax = Math.max(1, ...cargo.map((m) => m.n));
  return (
    <div className="flex min-h-0 flex-col border-t border-slate-800 bg-slate-900/40 lg:border-l lg:border-t-0">
      <div className="flex-none border-b border-slate-800 px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {t("ws.mixTitle")}
      </div>
      <div className="grid flex-none content-start gap-2 px-4 py-3">
        {fleet.map((m) => (
          <div
            key={m.label}
            className="grid grid-cols-[76px_1fr_36px] items-center gap-2.5 font-mono text-[10.5px] text-slate-400"
          >
            <span>{m.label}</span>
            <div className="h-[5px] overflow-hidden rounded bg-slate-800">
              <div
                className="h-full rounded bg-sky-500"
                style={{ width: `${Math.round((m.n / fleetMax) * 100)}%` }}
              />
            </div>
            <span className="text-right text-slate-100">{m.n}</span>
          </div>
        ))}
      </div>
      <div className="grid flex-none content-start gap-2 border-t border-slate-800/60 px-4 py-3">
        {cargo.map((m) => (
          <div
            key={m.label}
            className="grid grid-cols-[76px_1fr_36px] items-center gap-2.5 font-mono text-[10.5px] text-slate-400"
          >
            <span>{m.label}</span>
            <div className="h-[5px] overflow-hidden rounded bg-slate-800">
              <div
                className="h-full rounded bg-amber-400"
                style={{ width: `${Math.round((m.n / cargoMax) * 100)}%` }}
              />
            </div>
            <span className="text-right text-slate-100">{m.n}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex-none border-t border-slate-800/60 px-4 py-2 font-mono text-[10px] text-slate-600">
        {avgSpeed != null ? t("ws.avgSpeed", { v: avgSpeed.toFixed(1) }) : ""}
      </div>
    </div>
  );
}
