"use client";

import Link from "next/link";
import { useState } from "react";

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "0 €",
    period: "",
    features: [
      "3 ports stratégiques",
      "Dashboard live, 7j historique",
      "Pas d'API publique",
    ],
    cta: "Démarrer",
    href: "/sign-up",
  },
  {
    id: "starter",
    name: "Starter",
    price: "99 €",
    period: "/ mois",
    features: [
      "15 ports",
      "API publique 5k req/j",
      "Webhooks alertes",
      "Export CSV",
      "30 jours d'historique",
      "25 navires watchlist",
    ],
    cta: "Choisir Starter",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "499 €",
    period: "/ mois",
    features: [
      "Tous les 51 ports",
      "API 600 req/min",
      "ETA precision detail + attribution retards",
      "Fusion AIS + SAR Sentinel-1",
      "Détection dark fleet",
      "Sanctions OFAC + UK OFSI",
      "Émissions CO2 par voyage",
      "90 jours d'historique",
      "250 navires watchlist",
    ],
    cta: "Choisir Pro",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Sur devis",
    period: "",
    features: [
      "Tout Pro +",
      "Connecteurs Spire / MarineTraffic / Orbcomm",
      "SLA 99.9% contractuel",
      "365j+ historique + backfill",
      "White-label & dédié",
      "Support dédié",
    ],
    cta: "Nous contacter",
    href: "mailto:contact@portflow.io",
  },
];

export default function PricingPage() {
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
      else alert(json.error ?? "Stripe checkout indisponible");
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
          ← retour
        </Link>
      </header>

      <section className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Tarifs</h1>
        <p className="text-sm text-slate-400">
          Multi-port AIS · ETA prediction · SAR fusion · sanctions screening ·
          51 ports stratégiques
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier) => (
          <article
            key={tier.id}
            className={`flex flex-col rounded-xl border p-5 ${
              tier.highlight
                ? "border-sky-500 bg-sky-500/5"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <header className="mb-3">
              <h2 className="text-lg font-semibold text-slate-100">
                {tier.name}
              </h2>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{tier.price}</span>
                <span className="text-xs text-slate-500">{tier.period}</span>
              </div>
            </header>
            <ul className="mb-4 flex-1 space-y-1 text-xs text-slate-300">
              {tier.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            {tier.href ? (
              <Link
                href={tier.href}
                className={`rounded px-3 py-2 text-center text-sm font-medium ${
                  tier.highlight
                    ? "bg-sky-500 text-white hover:bg-sky-400"
                    : "border border-slate-700 text-slate-200 hover:border-sky-500"
                }`}
              >
                {tier.cta}
              </Link>
            ) : (
              <button
                onClick={() => checkout(tier.id)}
                disabled={pending !== null}
                className={`rounded px-3 py-2 text-center text-sm font-medium ${
                  tier.highlight
                    ? "bg-sky-500 text-white hover:bg-sky-400"
                    : "border border-slate-700 text-slate-200 hover:border-sky-500"
                } disabled:opacity-50`}
              >
                {pending === tier.id ? "…" : tier.cta}
              </button>
            )}
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        <p>
          <strong className="text-slate-200">Note dev :</strong> les paiements
          sont opérationnels uniquement quand <code>STRIPE_SECRET_KEY</code> et{" "}
          <code>STRIPE_PRICE_*</code> sont définis dans{" "}
          <code>.env.local</code>. Sinon le bouton renvoie une erreur 503.
        </p>
      </section>
    </main>
  );
}
