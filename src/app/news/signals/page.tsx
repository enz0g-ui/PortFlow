import type { Metadata } from "next";
import Link from "next/link";
import { getNewsSignals } from "@/lib/news/signals";
import { CopyButton } from "../../components/CopyButton";

// Internal composing tool — not for indexing. Surfaces the current, real
// signals and ready-to-post punchlines so a brief / LinkedIn post can be made
// in one click. Aggregate, non-personal data only.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signals (internal)",
  robots: { index: false, follow: false },
};

export default function SignalsPage() {
  const s = getNewsSignals();
  const generated = new Date(s.generatedAt).toLocaleString("en-GB", {
    timeZone: "UTC",
    hour12: false,
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/news" className="text-xs text-slate-400 hover:text-slate-200">
          ← Briefs
        </Link>
        <span className="text-xs text-slate-500">
          live signals · {generated} UTC · cached 60s
        </span>
      </header>

      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Post studio — live signals</h1>
        <p className="text-sm text-slate-400">
          Real figures from the live data, with ready-to-post lines. Pick one,
          copy, post. Pair it with a current news item where it fits — observable
          only, never intent.
        </p>
      </section>

      {/* Ready-to-post punchlines */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          Ready to post
        </h2>
        {s.punchlines.length > 0 ? (
          s.punchlines.map((p, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <p className="text-sm text-slate-200">{p}</p>
              <CopyButton text={p} label="Copy" />
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            Not enough live data yet to draft a line (feed may be reconnecting).
          </p>
        )}
      </section>

      {/* Congestion table */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          Congestion now (top ports by share at anchor)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-xs text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2 font-normal">Port</th>
                <th className="px-3 py-2 text-right font-normal">At anchor</th>
                <th className="px-3 py-2 text-right font-normal">Total</th>
                <th className="px-3 py-2 text-right font-normal">% waiting</th>
              </tr>
            </thead>
            <tbody>
              {s.congestion.map((c) => (
                <tr key={c.portId} className="border-t border-slate-800">
                  <td className="px-3 py-2 text-slate-200">
                    {c.flag} {c.portName}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                    {c.anchored}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                    {c.total}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-100">
                    {c.ratioPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Chokepoints + counts */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            Chokepoint transits · 7 days
          </h2>
          <ul className="rounded-xl border border-slate-800 bg-slate-900/60 text-sm">
            {s.chokepoints.length > 0 ? (
              s.chokepoints.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between border-b border-slate-800 px-3 py-2 last:border-0"
                >
                  <span className="text-slate-200">{c.label}</span>
                  <span className="tabular-nums text-slate-100">{c.transits7d}</span>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-slate-500">no transits recorded</li>
            )}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            Behavioural signals · 7 days <span className="text-slate-500">(raw — don&apos;t post as-is)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-500">AIS gaps (dark)</div>
              <div className="text-2xl font-semibold text-slate-100">
                {s.darkEvents7d}
                {s.darkEvents7d >= 1000 ? "+" : ""}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-500">Loitering</div>
              <div className="text-2xl font-semibold text-slate-100">
                {s.loitering7d}
                {s.loitering7d >= 1000 ? "+" : ""}
              </div>
            </div>
          </div>
          <p className="text-[11px] leading-snug text-slate-500">
            Raw detector counts (capped at 1000). On public AIS these mix
            intentional gaps with coverage holes — useful as a lead to
            investigate, not a number to publish.
          </p>
          {s.benchmark ? (
            <div className="rounded-xl border border-emerald-700/40 bg-emerald-500/5 p-4 text-sm">
              <div className="text-xs text-emerald-300">ETA benchmark · Rotterdam · 30d</div>
              <div className="mt-1 text-slate-200">
                ours{" "}
                <span className="font-semibold text-emerald-300">
                  {s.benchmark.ourMaeHours.toFixed(1)} h
                </span>{" "}
                vs broadcast{" "}
                <span className="font-semibold">
                  {s.benchmark.broadcastMaeHours.toFixed(1)} h
                </span>{" "}
                · {s.benchmark.voyages} voyages
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <p className="border-t border-slate-800 pt-4 text-xs text-slate-500">
        Guardrails: describe the observable, never the intent. Don&apos;t post a
        figure from a port with weak AIS coverage as if it were complete. Date
        everything. One solid line beats five shaky ones.
      </p>
    </main>
  );
}
