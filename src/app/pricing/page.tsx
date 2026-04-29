"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

const TIER_IDS = [
  "free",
  "starter",
  "professional",
  "pro",
  "enterprise",
] as const;
type TierId = (typeof TIER_IDS)[number];

const TIER_HREF: Partial<Record<TierId, string>> = {
  free: "/sign-up",
  enterprise: "mailto:contact@portflow.uk",
};

const HIGHLIGHT: Record<TierId, boolean> = {
  free: false,
  starter: false,
  professional: true,
  pro: false,
  enterprise: false,
};

export default function PricingPage() {
  const { tp, tpList } = useI18n();
  const [pending, setPending] = useState<string | null>(null);

  const checkout = async (tier: string) => {
    setPending(tier);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
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
                    {tp(`pricing.tier.${id}.price`)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {tp(`pricing.tier.${id}.period`)}
                  </span>
                </div>
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
