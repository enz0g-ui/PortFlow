import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { DemoButton } from "./components/DemoButton";
import { LiveBenchmark } from "./components/LiveBenchmark";
import { NewsletterForm } from "./components/NewsletterForm";

// Problem-oriented title — captures intent searches ("tanker ETA prediction",
// "port congestion"), not just the brand name. Layout appends "· Port Flow".
export const metadata: Metadata = {
  title: "Tanker ETA prediction & live port congestion",
  description:
    "Predicted vessel ETAs with a published accuracy benchmark, live congestion across 51 ports, multi-regime sanctions screening and chokepoint alerts. Built for commodity traders, charterers and P&I underwriters.",
  alternates: { canonical: "https://portflow.uk" },
};

const PERSONAS = [
  {
    tag: "Commodity traders",
    pain: "Cargo timing drives your P&L, but crew-declared ETAs drift by hours.",
    gain: "Predicted ETAs and live congestion indices feed your pricing and positioning before the market moves.",
  },
  {
    tag: "Charterers & forwarders",
    pain: "Demurrage eats margin when a berth is congested and you didn't see it coming.",
    gain: "Live waiting times and congestion across 51 ports — spot the bottleneck days ahead, route around it.",
  },
  {
    tag: "P&I & compliance",
    pain: "Sanctions and dark-fleet exposure are a daily liability, priced manually.",
    gain: "Multi-regime screening (UKSL · OFAC · UN-SC · EU FSF), war-risk zones and AIS-gap detection in one screen.",
  },
];

const FEATURES = [
  ["Predicted ETA + published benchmark", "Our ETA vs the broadcast ETA, with an open RMSE/MAE benchmark — measured, not claimed."],
  ["51 ports · 12 chokepoints, live", "Real-time AIS coverage across the world's tanker hubs and the straits that matter."],
  ["Multi-regime sanctions screening", "UKSL, OFAC, UN-SC and EU FSF in one pass, with an audit trail."],
  ["Chokepoint transit alerts", "Hormuz, Suez, Bosphorus, Malacca — transit counts, dwell time and deviations."],
  ["Dark-event / AIS-gap detection", "In-house detection of vessels going dark in contested waters — behavioural, not speculative."],
  ["Watchlist, alerts & API", "Slack · Telegram · Email · Webhook alerts, plus a JSON API and CSV export."],
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Logged-in users and active demo sessions skip the marketing page and go
  // straight to the product — UNLESS they explicitly ask to view the landing
  // (?home, used by the "Home" link inside the dashboard). The local dev
  // fallback (id "dev", Clerk disabled) is never redirected.
  const sp = await searchParams;
  const wantsHome = sp.home !== undefined;
  const user = await getCurrentUser();
  if (user && user.id !== "dev" && !wantsHome) {
    redirect("/app");
  }

  return (
    <main className="flex-1 bg-slate-950 text-slate-100">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Port Flow
            <span className="ml-1.5 text-sky-400">·</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/methodology" className="hidden rounded px-3 py-1.5 text-slate-300 hover:text-white sm:inline">
              Methodology
            </Link>
            <Link href="/guide" className="hidden rounded px-3 py-1.5 text-slate-300 hover:text-white sm:inline">
              Guide
            </Link>
            <Link href="/news" className="hidden rounded px-3 py-1.5 text-slate-300 hover:text-white sm:inline">
              News
            </Link>
            <Link href="/pricing" className="rounded px-3 py-1.5 text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link
              href="/app"
              className="rounded border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-sky-500 hover:text-white"
            >
              Open dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <div className="mb-4 inline-block rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-widest text-sky-400">
          Tanker intelligence · 51 ports
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Crew-declared ETAs are off by hours.
          <span className="block text-sky-400">Ours aren&apos;t.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Port Flow turns public AIS into predicted ETAs, live port congestion,
          sanctions screening and chokepoint alerts — with a{" "}
          <span className="text-slate-200">published accuracy benchmark</span>,
          not a marketing claim.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <div className="[&>button]:px-6 [&>button]:py-3 [&>button]:text-base">
            <DemoButton />
          </div>
          <Link
            href="/pricing"
            className="rounded border border-slate-700 px-6 py-3 text-base font-medium text-slate-200 hover:border-sky-500 hover:text-white"
          >
            See pricing
          </Link>
        </div>
        <p className="mt-5 text-xs text-slate-500">
          Open methodology · documented limits · cancel anytime · no card for the demo
        </p>
      </section>

      {/* Proof — honest live benchmark */}
      <LiveBenchmark />

      {/* Personas */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-2xl font-semibold sm:text-3xl">
          Built for the people who move cargo
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {PERSONAS.map((p) => (
            <div
              key={p.tag}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-7"
            >
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">
                {p.tag}
              </div>
              <p className="mb-4 text-sm text-slate-400">{p.pain}</p>
              <p className="mt-auto text-sm font-medium text-slate-100">{p.gain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-center text-2xl font-semibold sm:text-3xl">
            One screen, the whole tanker picture
          </h2>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, body]) => (
              <div key={title} className="bg-slate-950 p-7">
                <h3 className="mb-2 text-base font-semibold text-slate-100">{title}</h3>
                <p className="text-sm text-slate-400">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Transparent by design —{" "}
            <Link href="/methodology" className="text-sky-400 hover:text-sky-300">
              read the methodology
            </Link>{" "}
            and{" "}
            <Link href="/sources" className="text-sky-400 hover:text-sky-300">
              the data sources
            </Link>
            , limits included.
          </p>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-3 text-center text-2xl font-semibold sm:text-3xl">
          Pricing that undercuts the incumbents
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-slate-400">
          A full Kpler or Lloyd&apos;s List seat runs into tens of thousands a year.
          Port Flow starts free, scales with you, and cancels anytime.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Free", "€0", "Read-only across all 51 ports & 12 chokepoints."],
            ["Starter", "€97/mo", "Watchlist, alerts and a single seat for one desk."],
            ["Professional", "€149/mo", "Sanctions screening, 60-day history, CSV export, API."],
            ["Pro+", "€374/mo", "Dark-fleet detection, SAR fusion, priority support."],
          ].map(([name, price, body]) => (
            <div
              key={name}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
            >
              <div className="text-sm font-semibold text-slate-100">{name}</div>
              <div className="mt-1 text-2xl font-bold text-sky-400">{price}</div>
              <p className="mt-3 text-xs text-slate-400">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/pricing"
            className="inline-block rounded bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 hover:bg-sky-400"
          >
            See full pricing &amp; features →
          </Link>
          <p className="mt-3 text-xs text-slate-500">
            Annual billing shown · monthly available · VAT not applicable (art. 293 B CGI)
          </p>
        </div>
      </section>

      {/* Weekly data brief — every visitor should be able to leave a trace */}
      <section className="border-t border-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="text-xl font-semibold text-slate-100">
            The weekly data brief
          </h2>
          <p className="mb-4 mt-1 text-sm text-slate-400">
            Congestion anomalies, chokepoint moves, precision updates — one
            email a week, numbers first. The same briefs published on{" "}
            <Link href="/news" className="underline hover:text-slate-200">
              /news
            </Link>
            .
          </p>
          <NewsletterForm source="landing" />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-800 bg-gradient-to-b from-slate-900/40 to-slate-950">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See it on a live tanker desk in one click
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            No signup, no card. A 10-minute Professional-tier session, instantly.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="[&>button]:px-6 [&>button]:py-3 [&>button]:text-base">
              <DemoButton />
            </div>
            <Link
              href="/app"
              className="rounded border border-slate-700 px-6 py-3 text-base font-medium text-slate-200 hover:border-sky-500 hover:text-white"
            >
              Open the live dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-semibold text-slate-300">Port Flow</span> — a product of
            OCTOPODUS · Laurent Guglielmetti EI · SIREN 491 489 654 · VAT not
            applicable (art. 293 B CGI)
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/app" className="hover:text-slate-200">Dashboard</Link>
            <Link href="/about" className="hover:text-slate-200">About</Link>
            <Link href="/news" className="hover:text-slate-200">News</Link>
            <Link href="/methodology" className="hover:text-slate-200">Methodology</Link>
            <Link href="/precision" className="hover:text-slate-200">Benchmark</Link>
            <Link href="/receipts" className="hover:text-slate-200">Receipts</Link>
            <Link href="/ports" className="hover:text-slate-200">Ports</Link>
            <Link href="/demurrage-calculator" className="hover:text-slate-200">Demurrage calc</Link>
            <Link href="/security" className="hover:text-slate-200">Security</Link>
            <Link href="/guide" className="hover:text-slate-200">Guide</Link>
            <Link href="/sources" className="hover:text-slate-200">Sources</Link>
            <Link href="/pricing" className="hover:text-slate-200">Pricing</Link>
            <Link href="/legal" className="hover:text-slate-200">Legal</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
