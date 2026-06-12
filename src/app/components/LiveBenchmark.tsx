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
 * Live, honest ETA benchmark for the landing page. Shows OUR predicted-ETA
 * error vs the vessel's own broadcast ETA, measured on the SAME set of closed
 * voyages (apples-to-apples) over the last 30 days at the busiest port.
 *
 * Integrity rule: never inflate. If there aren't enough closed voyages yet,
 * we say so and point to the methodology instead of showing a hollow number.
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

  return (
    <section className="border-y border-slate-800 bg-slate-900/40">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-sky-400">
          Proof, not a marketing claim
        </div>
        <h2 className="mb-3 text-center text-2xl font-semibold text-slate-100 sm:text-3xl">
          Our predicted ETA vs the ship&apos;s own broadcast ETA
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-slate-400">
          Mean absolute error, measured on the{" "}
          <span className="text-slate-200">same closed voyages</span> — Rotterdam,
          last 30 days. Lower is better.
        </p>

        {haveHeadToHead ? (
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-500/5 p-6 text-center">
              <div className="text-xs uppercase tracking-wider text-emerald-300">
                Port Flow predicted ETA
              </div>
              <div className="mt-2 text-4xl font-bold tabular-nums text-emerald-300">
                {ours!.toFixed(1)} h
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Broadcast ETA (crew-declared)
              </div>
              <div className="mt-2 text-4xl font-bold tabular-nums text-slate-300">
                {broadcast!.toFixed(1)} h
              </div>
            </div>
          </div>
        ) : (
          <p className="mx-auto max-w-2xl rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
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

        {haveHeadToHead ? (
          <p className="mt-6 text-center text-xs text-slate-500">
            Measured on {n} closed voyage{n > 1 ? "s" : ""}.{" "}
            <Link href="/precision" className="text-sky-400 hover:text-sky-300">
              See the full benchmark &amp; methodology →
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
