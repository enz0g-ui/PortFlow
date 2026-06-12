import type { Metadata } from "next";
import Link from "next/link";
import { listBriefs } from "@/lib/news/briefs";
import { getNewsSignals } from "@/lib/news/signals";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News & data briefs — the numbers behind the maritime headlines",
  description:
    "Port Flow data briefs cross live signals — port congestion, chokepoint transits, AIS gaps and ETA accuracy — with the maritime news. Observed, dated, sourced.",
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

export default function NewsIndex() {
  const briefs = listBriefs();
  const s = getNewsSignals();
  const topPort = s.congestion[0];
  const topChoke = s.chokepoints[0];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 p-6 py-10">
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
          Data briefs
        </h1>
        <p className="max-w-2xl text-slate-400">
          The real numbers behind the maritime news — port congestion, chokepoint
          transits, AIS gaps and ETA accuracy, pulled from live AIS across 51
          ports. Observed, dated, sourced. We state the figure; we don&apos;t infer
          intent.
        </p>
      </section>

      {/* Live signals strip — grounded, server-rendered */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-4">
        <div className="bg-slate-950 p-4">
          <div className="text-[10px] uppercase tracking-widest text-sky-400">
            Most congested now
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {topPort ? `${topPort.flag} ${topPort.portName}` : "—"}
          </div>
          <div className="text-xs text-slate-500">
            {topPort ? `${topPort.anchored} at anchor · ${topPort.ratioPct}%` : "building"}
          </div>
        </div>
        <div className="bg-slate-950 p-4">
          <div className="text-[10px] uppercase tracking-widest text-sky-400">
            Busiest chokepoint · 7d
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {topChoke ? topChoke.label : "—"}
          </div>
          <div className="text-xs text-slate-500">
            {topChoke ? `${topChoke.transits7d} transits` : "building"}
          </div>
        </div>
        <div className="bg-slate-950 p-4">
          <div className="text-[10px] uppercase tracking-widest text-sky-400">
            Live coverage
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-100">51 ports</div>
          <div className="text-xs text-slate-500">+ 12 chokepoints</div>
        </div>
        <div className="bg-slate-950 p-4">
          <div className="text-[10px] uppercase tracking-widest text-sky-400">
            ETA error · Rotterdam
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {s.benchmark ? `${s.benchmark.ourMaeHours.toFixed(1)} h` : "—"}
          </div>
          <div className="text-xs text-slate-500">
            {s.benchmark
              ? `vs ${s.benchmark.broadcastMaeHours.toFixed(1)} h broadcast`
              : "building"}
          </div>
        </div>
      </section>

      {/* Briefs */}
      <section className="space-y-4">
        {briefs.map((b) => (
          <Link
            key={b.slug}
            href={`/news/${b.slug}`}
            className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-colors hover:border-sky-600"
          >
            <div className="text-xs text-slate-500">{fmtDate(b.publishedAt)}</div>
            <h2 className="mt-1 text-xl font-semibold text-slate-100">{b.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{b.dek}</p>
            <span className="mt-3 inline-block text-sm text-sky-400">Read →</span>
          </Link>
        ))}
      </section>

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
