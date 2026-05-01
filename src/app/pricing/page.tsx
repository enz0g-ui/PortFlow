"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Cycle = "monthly" | "yearly";

interface FounderSlots {
  enabled: boolean;
  code?: string;
  remaining?: number | null;
  max?: number | null;
  percentOff?: number | null;
  duration?: string;
}

const TIER_IDS = [
  "free",
  "starter",
  "professional",
  "pro",
  "enterprise",
] as const;
type TierId = (typeof TIER_IDS)[number];
const TIERS_WITH_YEARLY: TierId[] = ["starter", "professional", "pro"];

const TIER_HREF: Partial<Record<TierId, string>> = {
  free: "/sign-up",
  enterprise: "mailto:contact@portflow.uk",
};

const HIGHLIGHT: Record<TierId, boolean> = {
  free: false,
  starter: false,
  professional: false,
  pro: true,
  enterprise: false,
};

export default function PricingPage() {
  const { tp, tpList } = useI18n();
  const [pending, setPending] = useState<string | null>(null);
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [founder, setFounder] = useState<FounderSlots | null>(null);

  useEffect(() => {
    fetch("/api/founder/slots")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: FounderSlots | null) => setFounder(j))
      .catch(() => setFounder(null));
  }, []);

  const checkout = async (tier: string) => {
    setPending(tier);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier, cycle }),
      });
      const json = await r.json();
      if (json.url) window.location.href = json.url;
      else alert(json.error ?? tp("pricing.checkout.error"));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  const supportsYearly = (id: TierId) => TIERS_WITH_YEARLY.includes(id);
  const showYearly = (id: TierId) => cycle === "yearly" && supportsYearly(id);

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          {tp("nav.back")}
        </Link>
      </header>

      <section className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          {tp("pricing.title")}
        </h1>
        <p className="text-sm text-slate-400">{tp("pricing.subtitle")}</p>
      </section>

      {founder?.enabled && founder.code ? (
        <section className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <span className="text-2xl">🚀</span>
          <div className="flex-1 space-y-1">
            <div className="font-semibold text-amber-200">
              {tp("pricing.founder.title").replace(
                "{percent}",
                String(founder.percentOff ?? 30),
              )}
            </div>
            <div className="text-xs text-amber-100/80">
              {tp("pricing.founder.body")
                .replace("{code}", founder.code)
                .replace(
                  "{remaining}",
                  founder.remaining != null
                    ? String(founder.remaining)
                    : "—",
                )
                .replace(
                  "{max}",
                  founder.max != null ? String(founder.max) : "—",
                )}
            </div>
          </div>
          <code className="rounded bg-amber-500/20 px-2 py-1 font-mono text-xs text-amber-100">
            {founder.code}
          </code>
        </section>
      ) : null}

      <section className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1 text-sm">
          <button
            onClick={() => setCycle("monthly")}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              cycle === "monthly"
                ? "bg-slate-700 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tp("pricing.cycle.monthly")}
          </button>
          <button
            onClick={() => setCycle("yearly")}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition-colors ${
              cycle === "yearly"
                ? "bg-emerald-500/20 text-emerald-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tp("pricing.cycle.yearly")}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                cycle === "yearly"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {tp("pricing.cycle.save")}
            </span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {TIER_IDS.map((id) => {
          const features = tpList(`pricing.tier.${id}.features`);
          const href = TIER_HREF[id];
          const highlight = HIGHLIGHT[id];
          return (
            <article
              key={id}
              className={`flex flex-col rounded-xl border p-5 ${
                highlight
                  ? "border-sky-500 bg-sky-500/5"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <header className="mb-3">
                <h2 className="text-lg font-semibold text-slate-100">
                  {tp(`pricing.tier.${id}.name`)}
                </h2>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {showYearly(id)
                      ? tp(`pricing.tier.${id}.priceYearlyEquiv`)
                      : tp(`pricing.tier.${id}.price`)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {tp(`pricing.tier.${id}.period`)}
                  </span>
                </div>
                {showYearly(id) ? (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-[11px] text-slate-400">
                      {tp(`pricing.tier.${id}.priceYearlyTotal`)}
                    </div>
                    <div className="inline-block rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {tp(`pricing.tier.${id}.yearlySavings`)}
                    </div>
                  </div>
                ) : null}
              </header>
              <ul className="mb-4 flex-1 space-y-1 text-xs text-slate-300">
                {features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {href ? (
                <Link
                  href={href}
                  className={`rounded px-3 py-2 text-center text-sm font-medium ${
                    highlight
                      ? "bg-sky-500 text-white hover:bg-sky-400"
                      : "border border-slate-700 text-slate-200 hover:border-sky-500"
                  }`}
                >
                  {tp(`pricing.tier.${id}.cta`)}
                </Link>
              ) : (
                <button
                  onClick={() => checkout(id)}
                  disabled={pending !== null}
                  className={`rounded px-3 py-2 text-center text-sm font-medium ${
                    highlight
                      ? "bg-sky-500 text-white hover:bg-sky-400"
                      : "border border-slate-700 text-slate-200 hover:border-sky-500"
                  } disabled:opacity-50`}
                >
                  {pending === id ? "…" : tp(`pricing.tier.${id}.cta`)}
                </button>
              )}
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        <p>
          <strong className="text-slate-200">
            {tp("pricing.note.label")}
          </strong>{" "}
          {tp("pricing.note")}
        </p>
      </section>
    </main>
  );
}
