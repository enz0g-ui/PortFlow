import type { Metadata } from "next";
import Link from "next/link";
import { Attributions } from "../components/Attributions";
import { DemoButton } from "../components/DemoButton";
import { DemurrageCalculator } from "../components/DemurrageCalculator";
import { NewsletterForm } from "../components/NewsletterForm";
import { PORTS } from "@/lib/ports";

// Free tool page: demurrage exposure from LIVE anchored-dwell data. The one
// query a charterer or trader types with money on the line — and no
// competitor answers it with real-time figures for free.
export const metadata: Metadata = {
  title: "Tanker demurrage calculator — live port waiting times",
  description:
    "Estimate your demurrage exposure from live anchorage dwell times: current median wait at 51 ports, historical P50/P95 baselines, and your own day rate. Free, no signup.",
  alternates: { canonical: "https://portflow.uk/demurrage-calculator" },
  robots: { index: true, follow: true },
};

export default async function DemurrageCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initialPort = typeof sp.port === "string" ? sp.port : undefined;
  const ports = PORTS.map((p) => ({ id: p.id, name: p.name, flag: p.flag }));

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Port Flow
        </Link>
        <span className="[&>button]:!px-3 [&>button]:!py-1">
          <DemoButton />
        </span>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Demurrage exposure calculator
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          What is waiting at anchor costing you today? Pick a port, set your
          demurrage rate, and get the exposure — computed from{" "}
          <strong>live anchorage dwell</strong> and each port&apos;s own
          historical baseline, not a static average.
        </p>
      </section>

      <DemurrageCalculator ports={ports} initialPort={initialPort} />

      <section className="rounded-lg border border-sky-700/40 bg-gradient-to-br from-sky-500/10 to-slate-900/40 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Don&apos;t discover the queue after your vessel joins it
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Paid tiers watch your vessels and alert you — Slack, Telegram,
              email or webhook — when waiting times surge at the ports you
              care about, with a live demurrage risk score per arrival.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DemoButton />
            <Link
              href="/pricing"
              className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
            >
              See pricing →
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          How it&apos;s computed
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>
            <strong>Right now</strong>: median time-at-anchor of vessels
            currently anchored in the port&apos;s anchorage zones (public AIS,
            refreshed continuously).
          </li>
          <li>
            <strong>Typical / bad-day</strong>: the port&apos;s own P50 / P95
            of completed anchor-dwell episodes, recomputed daily per cargo
            class. Ports without enough history fall back to sector defaults —
            flagged when that&apos;s the case.
          </li>
          <li>
            Exposure = dwell hours × your day rate ÷ 24. Anchor dwell is a
            proxy for waiting-for-berth; loading/discharge laytime is not
            included.
          </li>
          <li>
            Same data feeds the{" "}
            <Link href="/precision" className="underline hover:text-slate-200">
              public ETA benchmark
            </Link>{" "}
            and{" "}
            <Link href="/receipts" className="underline hover:text-slate-200">
              prediction receipts
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
          The weekly data brief
        </h2>
        <p className="mb-3 mt-1 max-w-xl text-sm text-slate-400">
          Congestion anomalies and waiting-time surges across 51 ports — one
          email a week.
        </p>
        <NewsletterForm source="demurrage-calculator" />
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
