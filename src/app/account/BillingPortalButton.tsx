"use client";

import { useState } from "react";

export function BillingPortalButton({ tier }: { tier: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" });
      const json = (await r.json()) as { url?: string; error?: string };
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setError(json.error ?? `error ${r.status}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (tier === "free") {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Facturation & abonnement
        </h2>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        Gère ton abonnement, change de carte, télécharge tes factures, ou
        change de plan via le portail Stripe sécurisé.
      </p>
      <button
        onClick={open}
        disabled={busy}
        className="rounded bg-sky-500 px-4 py-2 text-xs font-medium text-white hover:bg-sky-400 disabled:opacity-50"
      >
        {busy ? "…" : "Ouvrir le portail Stripe →"}
      </button>
      {error ? (
        <div className="mt-2 text-[11px] text-rose-400">{error}</div>
      ) : null}
    </div>
  );
}
