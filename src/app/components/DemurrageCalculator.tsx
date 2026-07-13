"use client";

import { useCallback, useEffect, useState } from "react";

interface PortOpt {
  id: string;
  name: string;
  flag: string;
}

interface ApiResp {
  port: PortOpt;
  cargo: string | null;
  anchoredCount: number;
  currentMedianDwellH: number | null;
  currentMaxDwellH: number | null;
  typicalDwellH: number;
  p95DwellH: number;
  baselineIsDynamic: boolean;
  baselineSamples: number;
  aisCoverage: string;
  error?: string;
}

const CARGOES = [
  { value: "", label: "All tankers" },
  { value: "crude", label: "Crude carrier" },
  { value: "product", label: "Product tanker" },
  { value: "chemical", label: "Chemical tanker" },
  { value: "lng", label: "LNG carrier" },
  { value: "lpg", label: "LPG carrier" },
];

function usd(v: number): string {
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function DemurrageCalculator({
  ports,
  initialPort,
}: {
  ports: PortOpt[];
  initialPort?: string;
}) {
  const [port, setPort] = useState(
    initialPort && ports.some((p) => p.id === initialPort)
      ? initialPort
      : "rotterdam",
  );
  const [cargo, setCargo] = useState("");
  const [rate, setRate] = useState(30000);
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/demurrage?port=${encodeURIComponent(port)}&cargo=${encodeURIComponent(cargo)}`,
      );
      setData((await res.json()) as ApiResp);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [port, cargo]);

  useEffect(() => {
    void load();
  }, [load]);

  const perHour = rate / 24;
  const typical = data ? data.typicalDwellH * perHour : null;
  const p95 = data ? data.p95DwellH * perHour : null;
  const current =
    data && data.currentMedianDwellH !== null
      ? data.currentMedianDwellH * perHour
      : null;
  const surge =
    data && data.currentMedianDwellH !== null && data.typicalDwellH > 0
      ? data.currentMedianDwellH / data.typicalDwellH
      : null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs text-slate-400">
          Port
          <select
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
          >
            {ports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.flag} {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Vessel class
          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
          >
            {CARGOES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Demurrage rate ($/day)
          <input
            type="number"
            min={1000}
            step={1000}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm tabular-nums text-slate-100"
          />
        </label>
      </div>

      {loading && !data ? (
        <p className="mt-5 text-sm text-slate-500">Loading live data…</p>
      ) : data && !data.error ? (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded border border-slate-800 bg-slate-950/60 px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Typical wait exposure
              </div>
              <div className="text-2xl font-semibold tabular-nums text-slate-100">
                {typical !== null ? usd(typical) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {data.typicalDwellH.toFixed(0)} h at anchor (P50
                {data.baselineIsDynamic
                  ? `, ${data.baselineSamples} voyages`
                  : ", sector default"}
                )
              </div>
            </div>
            <div
              className={`rounded border px-4 py-3 ${
                surge !== null && surge > 1.5
                  ? "border-rose-700/50 bg-rose-500/10"
                  : "border-slate-800 bg-slate-950/60"
              }`}
            >
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Right now
              </div>
              <div className="text-2xl font-semibold tabular-nums text-slate-100">
                {current !== null ? usd(current) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {data.currentMedianDwellH !== null
                  ? `${data.anchoredCount} at anchor · median ${data.currentMedianDwellH.toFixed(1)} h${
                      surge !== null && surge > 1
                        ? ` · ${surge.toFixed(1)}× the norm`
                        : ""
                    }`
                  : `no ${cargo || "tanker"}s at anchor right now`}
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/60 px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Bad-day exposure (P95)
              </div>
              <div className="text-2xl font-semibold tabular-nums text-amber-300">
                {p95 !== null ? usd(p95) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {data.p95DwellH.toFixed(0)} h at anchor
              </div>
            </div>
          </div>
          {data.aisCoverage !== "good" ? (
            <p className="mt-3 text-xs text-amber-300/80">
              Community AIS coverage at this port is {data.aisCoverage} —
              live figures understate reality.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-5 text-sm text-rose-400">
          Couldn&apos;t load live data — retry in a moment.
        </p>
      )}
    </div>
  );
}
