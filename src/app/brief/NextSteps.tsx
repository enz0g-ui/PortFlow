"use client";

import Link from "next/link";
import { track } from "./track";
import { WatchButton } from "./WatchButton";

// Encart « What next? » : 2 à 3 actions choisies côté serveur selon ce que
// la fiche vient de montrer (sanctionné, exposé, coupures AIS, identité…).
// La surveillance est toujours la première carte : c'est ce que l'abonnement
// apporte et qu'une fiche figée ne peut pas faire.

export interface NextStep {
  id: string;
  tone: "red" | "amber" | "sky" | "slate";
  kicker: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
  watch?: boolean;
}

const TONE: Record<NextStep["tone"], string> = {
  red: "border-red-500/40 bg-red-500/[0.06]",
  amber: "border-amber-400/40 bg-amber-400/[0.06]",
  sky: "border-sky-500/50 bg-sky-500/[0.08]",
  slate: "border-slate-700 bg-slate-900/60",
};
const KICK: Record<NextStep["tone"], string> = {
  red: "text-red-300",
  amber: "text-amber-300",
  sky: "text-sky-300",
  slate: "text-slate-400",
};

export function NextSteps({ mmsi, steps }: { mmsi: number; steps: NextStep[] }) {
  if (steps.length === 0) return null;
  return (
    <section className="mt-4 print:hidden" aria-label="What next">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">What next?</h2>
      <div className={`mt-2 grid gap-3 ${steps.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {steps.map((s) => (
          <div key={s.id} className={`flex flex-col rounded-md border p-4 ${TONE[s.tone]}`}>
            <div className={`text-[11px] font-medium uppercase tracking-wider ${KICK[s.tone]}`}>{s.kicker}</div>
            <div className="mt-1 text-[15px] font-semibold text-slate-50">{s.title}</div>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-300">{s.body}</p>
            <div className="mt-3" onClickCapture={() => track(`next.${s.id}`, mmsi)}>
              {s.watch ? (
                <WatchButton
                  mmsi={mmsi}
                  label={s.cta ?? "◉ Watch this ship"}
                  className="inline-block rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                />
              ) : s.href ? (
                <Link
                  href={s.href}
                  className="inline-block rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-100 hover:border-slate-400"
                >
                  {s.cta ?? "Open"} →
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
