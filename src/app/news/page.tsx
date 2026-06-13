import type { Metadata } from "next";
import Link from "next/link";
import { listBriefs } from "@/lib/news/briefs";
import { getNewsSignals } from "@/lib/news/signals";
import { getWorldEvents } from "@/lib/news/world-events";
import { CopyButton } from "../components/CopyButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News & live signals — the numbers behind the maritime headlines",
  description:
    "Port Flow crosses live signals — port congestion, chokepoint transits and ETA accuracy — with the maritime news. Named sources, observed figures, dated and sourced.",
  alternates: { canonical: "https://portflow.uk/news" },
  robots: { index: true, follow: true },
};

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function NewsPage() {
  const briefs = listBriefs();
  const s = getNewsSignals();
  const events = await getWorldEvents();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 p-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Port Flow
        </Link>
        <Link
          href="/app"
          className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-sky-500"
        >
          Open dashboard
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          News &amp; live signals
        </h1>
        <p className="max-w-2xl text-slate-400">
          The real numbers behind the maritime news — port congestion, chokepoint
          transits and ETA accuracy, pulled live from AIS across 51 ports and 12
          chokepoints. Observed, dated, sourced. We state the figure; we don&apos;t
          infer intent.
        </p>
      </section>

      {/* Briefs */}
      {briefs.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            Briefs
          </h2>
          {briefs.map((b) => (
            <Link
              key={b.slug}
              href={`/news/${b.slug}`}
              className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-colors hover:border-sky-600"
            >
              <div className="text-xs text-slate-500">{fmtDate(b.publishedAt)}</div>
              <h3 className="mt-1 text-xl font-semibold text-slate-100">{b.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{b.dek}</p>
              <span className="mt-3 inline-block text-sm text-sky-400">Read →</span>
            </Link>
          ))}
        </section>
      ) : null}

      {/* In the news — world events tied to our coverage */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          In the news — tied to our coverage
        </h2>
        <p className="text-xs text-slate-500">
          Named sources, headlines &amp; links only. Where a story overlaps a place
          we track, our live figure is attached.
        </p>
        {events.length > 0 ? (
          <ul className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
            {events.map((e, i) => (
              <li key={i} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-sky-400">
                      {e.source}
                      {e.places.length ? ` · ${e.places.join(", ")}` : ""}
                    </div>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener"
                      className="text-sm text-slate-100 hover:text-sky-300"
                    >
                      {e.title}
                    </a>
                    {e.ourData ? (
                      <div className="mt-0.5 text-xs text-emerald-300">
                        Our data — {e.ourData}
                      </div>
                    ) : null}
                  </div>
                  {e.line ? <CopyButton text={e.line} label="Copy" /> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            Nothing currently overlaps our tracked places (or feeds are
            momentarily unreachable).
          </p>
        )}
      </section>

      {/* Numbers worth sharing */}
      {s.punchlines.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            Numbers worth sharing
          </h2>
          {s.punchlines.map((p, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <p className="text-sm text-slate-200">{p}</p>
              <CopyButton text={p} label="Copy" />
            </div>
          ))}
        </section>
      ) : null}

      {/* Live now — congestion + chokepoints + benchmark */}
      <section className="space-y-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          Live now
        </h2>

        <div>
          <div className="mb-2 text-sm font-medium text-slate-300">
            Most congested ports — share of vessels at anchor
          </div>
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
                {s.congestion.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-slate-500">
                      Building — live feed catching up.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-medium text-slate-300">
              Chokepoint transits · 7 days
            </div>
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
                <li className="px-3 py-2 text-slate-500">building</li>
              )}
            </ul>
          </div>
          {s.benchmark ? (
            <div>
              <div className="mb-2 text-sm font-medium text-slate-300">
                ETA accuracy · Rotterdam · 30 days
              </div>
              <Link
                href="/precision"
                className="block rounded-xl border border-emerald-700/40 bg-emerald-500/5 p-4 hover:border-emerald-500"
              >
                <div className="text-slate-200">
                  ours{" "}
                  <span className="font-semibold text-emerald-300">
                    {s.benchmark.ourMaeHours.toFixed(1)} h
                  </span>{" "}
                  vs broadcast{" "}
                  <span className="font-semibold">
                    {s.benchmark.broadcastMaeHours.toFixed(1)} h
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  mean error on {s.benchmark.voyages} closed voyages · see the
                  benchmark →
                </div>
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <p className="border-t border-slate-800 pt-6 text-xs leading-relaxed text-slate-500">
        Methodology: figures are from public AIS across 51 ports and 12
        chokepoints. We also run AIS-gap (dark) and loitering detection, but raw
        counts conflate intentional gaps with coverage holes — so we treat those
        as leads to investigate, not headline numbers. Where coverage is thin
        (parts of the Med and the Gulf) we say so rather than overstate. See the{" "}
        <Link href="/methodology" className="text-sky-400 hover:text-sky-300">
          methodology
        </Link>{" "}
        and{" "}
        <Link href="/precision" className="text-sky-400 hover:text-sky-300">
          accuracy benchmark
        </Link>
        .
      </p>

      <footer className="border-t border-slate-800 pt-6 text-xs text-slate-500">
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-slate-200">Home</Link>
          <Link href="/app" className="hover:text-slate-200">Dashboard</Link>
          <Link href="/precision" className="hover:text-slate-200">Benchmark</Link>
          <Link href="/methodology" className="hover:text-slate-200">Methodology</Link>
          <Link href="/pricing" className="hover:text-slate-200">Pricing</Link>
        </nav>
      </footer>
    </main>
  );
}
