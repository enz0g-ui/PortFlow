"use client";

import Link from "next/link";
import { track } from "./track";

// Carte « déverrouiller » des comptes gratuits : dit précisément ce qui est
// caché (chiffres réels de la fenêtre de référence), puis mène aux formules.

export function UnlockCard({
  id,
  mmsi,
  title,
  lines,
  cta = "See plans",
  href = "/pricing",
  strong = false,
}: {
  id: string;
  mmsi?: number;
  title: string;
  lines: string[];
  cta?: string;
  href?: string;
  strong?: boolean;
}) {
  return (
    <section
      id="unlock"
      className={`mt-4 flex scroll-mt-4 flex-wrap items-center justify-between gap-3 rounded-md border p-4 print:hidden ${
        strong ? "border-amber-400/50 bg-amber-400/[0.07]" : "border-slate-700 bg-slate-900/60"
      }`}
    >
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">🔒 Free plan · last 30 days</div>
        <div className="mt-1 text-[15px] font-semibold text-slate-50">{title}</div>
        {lines.map((l) => (
          <p key={l} className="mt-0.5 text-sm text-slate-300">
            {l}
          </p>
        ))}
      </div>
      <Link
        href={href}
        onClick={() => track(`gate.${id}`, mmsi)}
        className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
      >
        {cta} →
      </Link>
    </section>
  );
}
