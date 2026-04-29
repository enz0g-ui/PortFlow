"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { CARGO_LABELS } from "@/lib/cargo";
import type { CargoClass } from "@/lib/types";

interface FleetVessel {
  mmsi: number;
  name: string;
  cargoClass?: string | null;
  draught?: number | null;
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
    country: string;
  };
  openVoyage?: {
    voyageId: string;
    port: string;
    portName: string;
    startTs: number;
    predictedEta?: number | null;
    broadcastEta?: number | null;
    distanceNm?: number | null;
  };
  lastClosedVoyage?: {
    voyageId: string;
    port: string;
    portName: string;
    arrivedTs: number;
    departedTs?: number | null;
  };
  demurrageRisk?: {
    score: number;
    voyageAgeHours: number;
    p50Hours: number;
    p75Hours: number;
    congestionFactor: number;
    sampleCount: number;
  };
}

interface FleetResp {
  count: number;
  vessels: FleetVessel[];
  ts: number;
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
  })} (${sign}${Math.abs(diffH).toFixed(1)}h)`;
}

function hoursAgo(ts: number): number {
  return Math.max(0, Math.round((Date.now() - ts) / 3_600_000));
}

function DemurrageBadge({
  risk,
}: {
  risk?: FleetVessel["demurrageRisk"];
}) {
  if (!risk || risk.sampleCount < 5) {
    return <span className="text-slate-600">—</span>;
  }
  const pct = Math.round(risk.score * 100);
  const tone =
    pct >= 70
      ? "bg-rose-500/15 text-rose-300 border-rose-700"
      : pct >= 40
        ? "bg-amber-500/15 text-amber-300 border-amber-700"
        : "bg-emerald-500/15 text-emerald-300 border-emerald-800";
  return (
    <span
      title={`age ${risk.voyageAgeHours.toFixed(1)}h · p50 ${risk.p50Hours.toFixed(1)}h · p75 ${risk.p75Hours.toFixed(1)}h · cong x${risk.congestionFactor.toFixed(2)}`}
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] ${tone}`}
    >
      {pct}%
    </span>
  );
}

export default function FleetPage() {
  const { tp, t, locale } = useI18n();
  const [data, setData] = useState<FleetResp | null>(null);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/user/fleet", { cache: "no-store" });
        if (r.status === 401) {
          if (!cancelled) setUnauth(true);
          return;
        }
        if (!r.ok) return;
        const json = (await r.json()) as FleetResp;
        if (!cancelled) {
          setData(json);
          setUnauth(false);
        }
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const removeVessel = async (mmsi: number) => {
    setData((cur) =>
      cur
        ? { ...cur, vessels: cur.vessels.filter((v) => v.mmsi !== mmsi) }
        : cur,
    );
    try {
      await fetch(`/api/user/watchlist/vessels?mmsi=${mmsi}`, {
        method: "DELETE",
      });
    } catch {
      /* on error, next refresh will recover */
    }
  };

  if (unauth) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">{tp("fleet.title")}</h1>
        <p className="text-sm text-slate-400">{tp("fleet.signIn")}</p>
        <Link
          href="/sign-in"
          className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
        >
          {t("nav.signIn") || "Sign in"}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("nav.back")}
        </Link>
        <span className="text-xs text-slate-500">{tp("fleet.refresh")}</span>
      </header>

      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          ● {tp("fleet.title")}{" "}
          <span className="text-slate-500">
            ({data?.count ?? "—"})
          </span>
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          {tp("fleet.subtitle")}
        </p>
      </section>

      {data && data.vessels.length === 0 ? (
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-200">
            {tp("fleet.empty.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{tp("fleet.empty.lead")}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
          >
            {tp("fleet.empty.cta")} →
          </Link>
        </section>
      ) : null}

      {data && data.vessels.length > 0 ? (
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-500">
                <tr className="text-left">
                  <th className="px-3 py-2 font-normal">
                    {tp("fleet.col.vessel")}
                  </th>
                  <th className="px-3 py-2 font-normal">
                    {tp("fleet.col.cargo")}
                  </th>
                  <th className="px-3 py-2 font-normal">
                    {tp("fleet.col.currentPort")}
                  </th>
                  <th className="px-3 py-2 font-normal">
                    {tp("fleet.col.voyage")}
                  </th>
                  <th className="px-3 py-2 font-normal">
                    {tp("fleet.col.eta")}
                  </th>
                  <th className="px-3 py-2 font-normal">
                    {tp("fleet.col.last")}
                  </th>
                  <th className="px-3 py-2 font-normal text-right">
                    Demurrage
                  </th>
                  <th className="px-3 py-2 font-normal text-right"></th>
                </tr>
              </thead>
              <tbody>
                {data.vessels.map((v) => {
                  const cargoLabel = v.cargoClass
                    ? (CARGO_LABELS[v.cargoClass as CargoClass] ?? v.cargoClass)
                    : "—";
                  const portLabel = v.currentPort
                    ? `${v.currentPort.flag} ${v.currentPort.name}`
                    : tp("fleet.state.atSea");
                  const voyageLabel = v.openVoyage
                    ? tp("fleet.state.open", { port: v.openVoyage.portName })
                    : v.currentPort
                      ? tp("fleet.state.atPort", {
                          port: v.currentPort.name,
                        })
                      : tp("fleet.state.unknown");
                  const lastLabel = v.lastClosedVoyage
                    ? tp("fleet.last.arrival", {
                        port: v.lastClosedVoyage.portName,
                        h: hoursAgo(v.lastClosedVoyage.arrivedTs),
                      })
                    : tp("fleet.last.none");
                  const dashHref = v.currentPort?.id
                    ? `/?port=${v.currentPort.id}&mmsi=${v.mmsi}`
                    : `/?mmsi=${v.mmsi}`;
                  return (
                    <tr
                      key={v.mmsi}
                      className="border-t border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-100">
                          {v.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          MMSI {v.mmsi}
                          {v.position?.sog != null
                            ? ` · ${v.position.sog.toFixed(1)} kn`
                            : ""}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">{cargoLabel}</td>
                      <td className="px-3 py-2.5 text-slate-300">
                        {portLabel}
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">
                        {voyageLabel}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-sky-300">
                        {fmtEta(v.openVoyage?.predictedEta ?? null, locale)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-400">
                        {lastLabel}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <DemurrageBadge risk={v.demurrageRisk} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={dashHref}
                            className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-sky-500"
                          >
                            {tp("fleet.action.dashboard")}
                          </Link>
                          <button
                            onClick={() => removeVessel(v.mmsi)}
                            className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-400 hover:border-rose-500 hover:text-rose-300"
                          >
                            {tp("fleet.action.remove")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!data ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
          …
        </div>
      ) : null}
    </main>
  );
}
