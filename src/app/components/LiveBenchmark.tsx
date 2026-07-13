"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AccuracyResp {
  windowDays: number;
  sampleCount: number;
  maeHours: number | null;
  baselineMaeHours: number | null;
  baselineCount: number | null;
  modelMaeOnBaselineHours: number | null;
}

/**
 * Live, honest ETA benchmark card for the landing hero — mockup « la preuve
 * d'abord » : our MAE vs the broadcast MAE on the SAME closed voyages,
 * bars + verdict, Rotterdam last 30 days.
 *
 * Integrity rule unchanged: never inflate. Without enough closed voyages we
 * say so and link the methodology instead of showing a hollow number.
 */
export function LiveBenchmark() {
  const [d, setD] = useState<AccuracyResp | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/voyages/accuracy?port=rotterdam&days=30", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        setD(j);
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const ours = d?.modelMaeOnBaselineHours;
  const broadcast = d?.baselineMaeHours;
  const n = d?.baselineCount ?? 0;
  const haveHeadToHead =
    typeof ours === "number" && typeof broadcast === "number" && n > 0;

  const advantage =
    haveHeadToHead && broadcast! > 0
      ? Math.round((1 - ours! / broadcast!) * 100)
      : null;
  const scale = haveHeadToHead ? Math.max(ours!, broadcast!) * 1.05 : 1;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Live benchmark · MAE
        </span>
        <span className="font-mono text-[10.5px] text-slate-600">
          Rotterdam · 30d{haveHeadToHead ? ` · ${n} voyages` : ""}
        </span>
      </div>

      {haveHeadToHead ? (
        <>
          <div className="mb-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-medium text-emerald-300">
                Port Flow — predicted ETA
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-emerald-300">
                {ours!.toFixed(1)}&nbsp;h
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded bg-slate-800/70">
              <div
                className="h-full rounded bg-emerald-300"
                style={{ width: `${Math.max(3, (ours! / scale) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mb-5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-400">
                Broadcast ETA (crew-declared)
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-rose-300">
                {broadcast!.toFixed(1)}&nbsp;h
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded bg-slate-800/70">
              <div
                className="h-full rounded bg-rose-300"
                style={{ width: `${(broadcast! / scale) * 100}%` }}
              />
            </div>
          </div>
          {advantage !== null && advantage > 0 ? (
            <Link
              href="/precision"
              className="block rounded border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-3 text-[13px] font-medium text-emerald-300 hover:border-emerald-400/50"
            >
              {advantage}&nbsp;% more accurate than the broadcast ETA — measured,
              not claimed. →
            </Link>
          ) : (
            <Link
              href="/precision"
              className="block rounded border border-slate-700 px-3.5 py-3 text-[13px] text-slate-400 hover:text-slate-200"
            >
              Full benchmark &amp; methodology →
            </Link>
          )}
        </>
      ) : (
        <p className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
          {loaded
            ? "The published benchmark builds continuously as voyages close. See exactly how it's measured —"
            : "Loading the live benchmark…"}{" "}
          {loaded ? (
            <Link href="/precision" className="text-sky-400 hover:text-sky-300">
              methodology &amp; current numbers →
            </Link>
          ) : null}
        </p>
      )}
    </div>
  );
}
