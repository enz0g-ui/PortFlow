import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { DemoButton } from "./components/DemoButton";
import { LiveBenchmark } from "./components/LiveBenchmark";
import { NewsletterForm } from "./components/NewsletterForm";
import { TickerBar } from "./components/TickerBar";

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

const FEATURES: Array<[stat: string, tone: string, title: string, body: string]> = [
  ["MAE", "text-emerald-300", "Predicted ETA + published benchmark", "Our ETA vs the broadcast ETA, with an open RMSE/MAE benchmark — measured, not claimed."],
  ["51 · 12", "text-sky-500", "Ports & chokepoints, live", "Real-time AIS coverage across the world's tanker hubs and the straits that matter."],
  ["×4", "text-sky-500", "Multi-regime sanctions screening", "UKSL, OFAC, UN-SC and EU FSF in one pass, with an audit trail."],
  ["⌖", "text-amber-300", "Chokepoint transit alerts", "Hormuz, Suez, Bosphorus, Malacca — transit counts, dwell time and deviations."],
  ["⬤", "text-rose-300", "Dark-event / AIS-gap detection", "In-house detection of vessels going dark in contested waters — behavioural, not speculative."],
  ["{ }", "text-sky-500", "Watchlist, alerts & API", "Slack · Telegram · Email · Webhook alerts, plus a JSON API and CSV export."],
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
          {/* « intelligence » en toutes lettres, sur deux lignes — « intel »
              évoquait la marque Intel (retour user 14/07). */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-[17px] font-bold tracking-[-0.02em] text-slate-100">
              PORT FLOW
            </span>
            <span className="hidden flex-col font-mono text-[8px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-sky-500 sm:flex">
              <span>tanker</span>
              <span>intelligence</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/methodology" className="hidden rounded px-3 py-1.5 text-slate-300 hover:text-white lg:inline">
              Methodology
            </Link>
            <Link href="/precision" className="hidden rounded px-3 py-1.5 text-slate-300 hover:text-white sm:inline">
              Benchmark
            </Link>
            <Link href="/ports" className="hidden rounded px-3 py-1.5 text-slate-300 hover:text-white sm:inline">
              Ports
            </Link>
            <Link href="/news" className="hidden rounded px-3 py-1.5 text-slate-300 hover:text-white sm:inline">
              News
            </Link>
            <Link href="/guide" className="hidden rounded px-3 py-1.5 text-slate-300 hover:text-white lg:inline">
              Guide
            </Link>
            <Link href="/pricing" className="rounded px-3 py-1.5 text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link
              href="/app"
              className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-[#06121d] hover:bg-sky-400"
            >
              Open dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Live ticker — real counts, not decoration */}
      <TickerBar />

      {/* Hero split — pitch + live benchmark card */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1fr_420px] sm:pt-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-sky-500">
            <span className="h-1.5 w-1.5 animate-[pf-pulse_2s_infinite] rounded-full bg-emerald-300" />
            Real-time AIS · 51 ports · 12 chokepoints
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
            Crew-declared ETAs drift by{" "}
            <span className="text-rose-300">hours</span>.
            <span className="block">
              Ours are <span className="text-emerald-300">measured</span>.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
            Predicted ETAs, live congestion, sanctions screening and chokepoint
            alerts — with a{" "}
            <span className="text-slate-200">published accuracy benchmark</span>
            , not a marketing claim.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="[&>button]:!bg-sky-500 [&>button]:!text-[#06121d] [&>button]:px-6 [&>button]:py-3 [&>button]:text-base [&>button]:font-semibold hover:[&>button]:!bg-sky-400">
              <DemoButton />
            </div>
            <Link
              href="/demurrage-calculator"
              className="rounded border border-slate-700 px-6 py-3 text-center text-base font-medium text-slate-100 hover:border-sky-500"
            >
              Demurrage calculator — free
            </Link>
          </div>
          <p className="mt-4 font-mono text-[11.5px] text-slate-600">
            open methodology · documented limits · no card for the demo
          </p>
        </div>
        <LiveBenchmark />
      </section>

      {/* Audiences */}
      <section className="border-t border-slate-800">
        <div className="mx-auto grid max-w-6xl md:grid-cols-3">
          {PERSONAS.map((p, i) => (
            <div
              key={p.tag}
              className={`flex flex-col px-8 py-8 ${i < 2 ? "md:border-r md:border-slate-800" : ""} ${i > 0 ? "border-t border-slate-800 md:border-t-0" : ""}`}
            >
              <div className="mb-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sky-500">
                {p.tag}
              </div>
              <p className="mb-2 text-[15px] font-medium text-slate-100">{p.pain}</p>
              <p className="mt-auto text-[13px] leading-relaxed text-slate-400">{p.gain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-sky-500">
            One screen, the whole tanker view
          </div>
          <h2 className="mb-9 text-2xl font-semibold tracking-[-0.02em] sm:text-[32px]">
            Six building blocks, one public benchmark
          </h2>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([stat, tone, title, body]) => (
              <div
                key={title}
                className="rounded-md border border-slate-800 bg-slate-900 px-6 py-5"
              >
                <div className={`mb-2.5 font-mono text-[26px] font-semibold ${tone}`}>
                  {stat}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-slate-100">{title}</h3>
                <p className="text-[12.5px] leading-relaxed text-slate-400">{body}</p>
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
      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-2 text-2xl font-semibold tracking-[-0.02em] sm:text-[32px]">
            Pricing that undercuts the incumbents
          </h2>
          <p className="mb-8 max-w-2xl text-sm text-slate-400">
            A full Kpler or Lloyd&apos;s List seat runs into tens of thousands a
            year. Port Flow starts free, scales with you, and cancels anytime.
          </p>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Free", "€0", "", "Read-only across all 51 ports & 12 chokepoints."],
              ["Starter", "€97", "/mo", "Watchlist, alerts and a single seat for one desk."],
              ["Professional", "€149", "/mo", "Sanctions screening, 60-day history, CSV export, API."],
              ["Pro+", "€374", "/mo", "Dark-fleet detection, SAR fusion, priority support."],
            ].map(([name, price, suffix, body]) => {
              const popular = name === "Professional";
              return (
                <div
                  key={name}
                  className={`relative flex flex-col rounded-md border p-6 ${
                    popular
                      ? "border-sky-500 bg-sky-500/5"
                      : "border-slate-800"
                  }`}
                >
                  {popular ? (
                    <div className="absolute -top-2.5 left-5 rounded bg-sky-500 px-2 py-0.5 font-mono text-[9.5px] font-semibold tracking-[0.08em] text-[#06121d]">
                      POPULAR
                    </div>
                  ) : null}
                  <div className={`text-[13px] font-semibold ${popular ? "text-sky-500" : "text-slate-300"}`}>
                    {name}
                  </div>
                  <div className="mt-2 font-mono text-3xl font-semibold text-slate-100">
                    {price}
                    {suffix ? (
                      <span className="text-[13px] text-slate-500">{suffix}</span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">{body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <Link
              href="/pricing"
              className="inline-block rounded bg-sky-500 px-6 py-3 text-base font-semibold text-[#06121d] hover:bg-sky-400"
            >
              See full pricing &amp; features →
            </Link>
            <p className="mt-3 font-mono text-[11px] text-slate-600">
              annual billing shown · monthly available · VAT not applicable (art. 293 B CGI)
            </p>
          </div>
        </div>
      </section>

      {/* Weekly brief + final CTA — split panel */}
      <section className="border-t border-slate-800">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
          <div className="px-6 py-11 lg:border-r lg:border-slate-800 lg:px-10">
            <h2 className="mb-1.5 text-lg font-semibold text-slate-100">
              The weekly data brief
            </h2>
            <p className="mb-4 max-w-md text-[13px] leading-relaxed text-slate-400">
              Congestion anomalies, chokepoint moves, precision updates — one
              email a week, numbers first. The same briefs published on{" "}
              <Link href="/news" className="underline hover:text-slate-200">
                /news
              </Link>
              .
            </p>
            <div className="max-w-md">
              <NewsletterForm source="landing" />
            </div>
          </div>
          <div className="flex flex-col justify-center border-t border-slate-800 px-6 py-11 lg:border-t-0 lg:px-10">
            <h2 className="mb-1.5 text-[22px] font-semibold text-slate-100">
              A live tanker desk, one click away
            </h2>
            <p className="mb-5 text-[13px] text-slate-400">
              No signup, no card. A 10-minute Professional-tier session,
              instantly.
            </p>
            <div className="[&>button]:!bg-sky-500 [&>button]:!text-[#06121d] [&>button]:px-6 [&>button]:py-3 [&>button]:text-base [&>button]:font-semibold hover:[&>button]:!bg-sky-400 self-start">
              <DemoButton />
            </div>
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
