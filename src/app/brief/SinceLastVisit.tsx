"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "./track";
import { WatchButton } from "./WatchButton";

// « Since your last visit » : pour un visiteur qui revient sur une fiche,
// liste ce qui s'est passé depuis sa précédente visite (stockée dans son
// navigateur seulement), puis propose la surveillance pour ne plus avoir à
// revenir vérifier à la main.

export interface SinceEvent {
  key: string;
  ts: number;
  label: string;
  href?: string;
  hot?: boolean;
}

const SESSION_MS = 30 * 60_000;

function fmt(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function SinceLastVisit({ mmsi, events }: { mmsi: number; events: SinceEvent[] }) {
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    const key = `portflow.seen.v.${mmsi}`;
    const now = Date.now();
    try {
      const raw = localStorage.getItem(key);
      const s = raw ? (JSON.parse(raw) as { last?: number; prev?: number }) : {};
      // Même visite (rechargement, navigation interne) : on garde la référence.
      const p = s.last && now - s.last < SESSION_MS ? (s.prev ?? null) : (s.last ?? null);
      localStorage.setItem(key, JSON.stringify({ last: now, prev: p }));
      // Lecture d'un état externe (localStorage) au montage, côté client seulement.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrev(p);
      if (p) track("since.shown", mmsi);
    } catch {
      /* stockage indisponible : on n'affiche rien */
    }
  }, [mmsi]);

  if (!prev) return null;
  const fresh = events.filter((e) => e.ts > prev);
  const hot = fresh.filter((e) => e.hot).length;

  return (
    <section
      className={`mt-4 rounded-md border p-4 print:hidden ${
        hot ? "border-amber-400/50 bg-amber-400/[0.07]" : "border-slate-700 bg-slate-900/60"
      }`}
      aria-label="Since your last visit"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Since your last visit · {fmt(prev)}
          </div>
          <div className="mt-1 text-[15px] font-semibold text-slate-50">
            {fresh.length === 0
              ? "Nothing new on this ship."
              : `${fresh.length} new event${fresh.length > 1 ? "s" : ""}${hot ? ` · ${hot} worth a look` : ""}`}
          </div>
        </div>
        <div onClickCapture={() => track("since.watch", mmsi)}>
          <WatchButton
            mmsi={mmsi}
            label="◉ Stop checking back: alert me instead"
            className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
          />
        </div>
      </div>
      {fresh.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-800/80 text-sm">
          {fresh.slice(0, 6).map((e) => (
            <li key={e.key} className="flex items-center gap-3 py-1.5">
              <span className="w-14 shrink-0 font-mono text-xs text-slate-500">{fmt(e.ts)}</span>
              {e.href ? (
                <Link
                  href={e.href}
                  className={e.hot ? "text-amber-200 hover:text-amber-100" : "text-slate-200 hover:text-slate-50"}
                >
                  {e.label}
                </Link>
              ) : (
                <span className={e.hot ? "text-amber-200" : "text-slate-200"}>{e.label}</span>
              )}
            </li>
          ))}
          {fresh.length > 6 ? (
            <li className="py-1.5 text-xs text-slate-500">
              +{fresh.length - 6} more in the{" "}
              <a href="#timeline" className="text-sky-400 hover:text-sky-300">
                timeline
              </a>
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
}
