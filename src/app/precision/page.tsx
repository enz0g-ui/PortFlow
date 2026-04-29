"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Attributions } from "../components/Attributions";
import { useI18n } from "@/lib/i18n/context";

interface VoyageSample {
  voyageId: string;
  mmsi: number;
  cargoClass?: string;
  arrivedTs?: number | null;
  predictedEta?: number | null;
  broadcastEta?: number | null;
  errorHours?: number | null;
  baselineErrorHours?: number | null;
}

interface AccuracyResp {
  windowDays: number;
  sampleCount: number;
  rmseHours: number | null;
  maeHours: number | null;
  baselineRmseHours: number | null;
  voyages: VoyageSample[];
}

interface PortMini {
  id: string;
  name: string;
  flag?: string;
  country?: string;
  names?: Record<string, string>;
  countryNames?: Record<string, string>;
}

interface PortsResp {
  ports: PortMini[];
}

function fmtH(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(digits)} h`;
}

function fmtTs(ts?: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PrecisionInner() {
  const searchParams = useSearchParams();
  const portId = searchParams.get("port") ?? "rotterdam";
  const { tp, locale } = useI18n();
  const [data, setData] = useState<AccuracyResp | null>(null);
  const [days, setDays] = useState(30);
  const [port, setPort] = useState<PortMini | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(
          `/api/voyages/accuracy?port=${portId}&days=${days}`,
          { cache: "no-store" },
        );
        if (!r.ok) return;
        const json = (await r.json()) as AccuracyResp;
        if (!cancelled) setData(json);
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
  }, [days, portId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ports", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: PortsResp | null) => {
        if (cancelled || !json) return;
        const p = json.ports.find((x) => x.id === portId) ?? null;
        setPort(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [portId]);

  const portLabel = port
    ? (port.names?.[locale] ?? port.name)
    : portId.charAt(0).toUpperCase() + portId.slice(1);
  const portCountry = port ? (port.countryNames?.[locale] ?? port.country) : "";

  const rmse = data?.rmseHours ?? null;
  const baseline = data?.baselineRmseHours ?? null;
  const delta =
    rmse !== null && baseline !== null
      ? ((rmse - baseline) / baseline) * 100
      : null;
  const beats = delta !== null && delta < 0;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("nav.back")}
        </Link>
        <span className="text-xs text-slate-500">
          {tp("precision.window")} :
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`ml-2 rounded px-2 py-0.5 ${
                days === d
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}j
            </button>
          ))}
        </span>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {tp("precision.title")} ·{" "}
          <span className="text-sky-400">
            {port?.flag ? `${port.flag} ` : ""}
            {portLabel}
          </span>
          {portCountry ? (
            <span className="ml-2 text-base font-normal text-slate-500">
              {portCountry}
            </span>
          ) : null}
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          {tp("precision.lead", { port: portLabel })}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label={tp("precision.stat.our")}
          value={fmtH(rmse)}
          tone={beats ? "good" : "warn"}
          hint={tp("precision.stat.our.hint", {
            mae: fmtH(data?.maeHours ?? null),
            n: data?.sampleCount ?? 0,
          })}
        />
        <Stat
          label={tp("precision.stat.broadcast")}
          value={fmtH(baseline)}
          tone="default"
          hint={tp("precision.stat.broadcast.hint")}
        />
        <Stat
          label={
            beats ? tp("precision.stat.advantage") : tp("precision.stat.gap")
          }
          value={delta !== null ? `${Math.abs(delta).toFixed(1)} %` : "—"}
          tone={beats ? "good" : "warn"}
          hint={
            delta === null
              ? tp("precision.stat.delta.notEnough")
              : beats
                ? tp("precision.stat.delta.beats")
                : tp("precision.stat.delta.behind")
          }
        />
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            {tp("precision.table.title")}
          </h2>
          <span className="text-xs text-slate-500">
            {tp("precision.table.errHelp")}
          </span>
        </div>
        {data && data.voyages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr className="text-left">
                  <th className="py-1 pr-3 font-normal">
                    {tp("precision.table.col.mmsi")}
                  </th>
                  <th className="py-1 pr-3 font-normal">
                    {tp("precision.table.col.cargo")}
                  </th>
                  <th className="py-1 pr-3 font-normal">
                    {tp("precision.table.col.arrival")}
                  </th>
                  <th className="py-1 pr-3 font-normal text-right">
                    {tp("precision.table.col.errModel")}
                  </th>
                  <th className="py-1 pr-3 font-normal text-right">
                    {tp("precision.table.col.errBroadcast")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.voyages.map((v) => (
                  <tr key={v.voyageId} className="border-t border-slate-800">
                    <td className="py-1.5 pr-3 tabular-nums text-slate-300">
                      {v.mmsi}
                    </td>
                    <td className="py-1.5 pr-3 text-slate-300">
                      {v.cargoClass ?? "—"}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums text-slate-400">
                      {fmtTs(v.arrivedTs)}
                    </td>
                    <td
                      className={`py-1.5 pr-3 tabular-nums text-right ${errTone(v.errorHours)}`}
                    >
                      {fmtH(v.errorHours)}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums text-right text-slate-400">
                      {fmtH(v.baselineErrorHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {tp("precision.table.empty")}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-sky-700/40 bg-gradient-to-br from-sky-500/10 to-slate-900/40 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {tp("precision.cta.title")}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              {tp("precision.cta.lead")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/?port=${portId}`}
              className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-sky-500"
            >
              {tp("precision.cta.dashboard")}
            </Link>
            <Link
              href="/pricing"
              className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
            >
              {tp("precision.cta.button")} →
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          {tp("precision.method.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>{tp("precision.method.b1")}</li>
          <li>{tp("precision.method.b2")}</li>
          <li>{tp("precision.method.b3")}</li>
          <li>{tp("precision.method.b4")}</li>
          <li>{tp("precision.method.b5")}</li>
        </ul>
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}

export default function PrecisionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          …
        </div>
      }
    >
      <PrecisionInner />
    </Suspense>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-slate-100";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-5 py-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`text-3xl font-semibold tabular-nums ${color}`}>
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}

function errTone(err: number | null | undefined): string {
  if (err === null || err === undefined) return "text-slate-500";
  const a = Math.abs(err);
  if (a < 1) return "text-emerald-300";
  if (a < 3) return "text-amber-300";
  return "text-rose-300";
}
