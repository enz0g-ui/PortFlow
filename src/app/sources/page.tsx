"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Attributions } from "../components/Attributions";

interface SourceInfo {
  id: string;
  label: string;
  tier: "ais-terrestrial" | "ais-satellite" | "sar" | "optical-night";
  tariff: "free" | "free-with-key" | "paid";
  description: string;
  homepage: string;
  envKeys: string[];
  hasFetchScenes: boolean;
  hasFetchFixes: boolean;
  status: {
    active: boolean;
    configured: boolean;
    reason?: string;
    lastSyncAt?: number;
    lastError?: string;
  };
}

interface Resp {
  sources: SourceInfo[];
}

const TIER_LABEL: Record<SourceInfo["tier"], string> = {
  "ais-terrestrial": "AIS terrestre",
  "ais-satellite": "AIS satellite",
  sar: "Radar SAR",
  "optical-night": "Optique nuit",
};

const TARIFF_BADGE: Record<
  SourceInfo["tariff"],
  { label: string; cls: string }
> = {
  free: {
    label: "Gratuit",
    cls: "bg-emerald-500/10 text-emerald-300 border-emerald-700",
  },
  "free-with-key": {
    label: "Gratuit + clé",
    cls: "bg-sky-500/10 text-sky-300 border-sky-700",
  },
  paid: {
    label: "Payant",
    cls: "bg-amber-500/10 text-amber-300 border-amber-700",
  },
};

export default function SourcesPage() {
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/sources", { cache: "no-store" });
        if (!r.ok) return;
        const json = (await r.json()) as Resp;
        if (!cancelled) setData(json);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← retour
        </Link>
        <Link
          href="/methodology"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Méthodologie →
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Sources de données</h1>
        <p className="text-sm text-slate-300">
          Mix multi-source : AIS terrestre temps réel + radar SAR (gratuit, ~6
          jours de revisite) + connecteurs prêts pour les fournisseurs S-AIS
          payants. Chaque source peut être activée par variable
          d&apos;environnement, sans toucher au code.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data?.sources.map((s) => (
          <article
            key={s.id}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {s.label}
                </h2>
                <div className="text-[11px] text-slate-500">
                  {TIER_LABEL[s.tier]}
                </div>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  TARIFF_BADGE[s.tariff].cls
                }`}
              >
                {TARIFF_BADGE[s.tariff].label}
              </span>
            </div>
            <p className="text-xs text-slate-400">{s.description}</p>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  s.status.active
                    ? "border-emerald-700 text-emerald-300"
                    : s.status.configured
                      ? "border-sky-700 text-sky-300"
                      : "border-slate-700 text-slate-400"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {s.status.active
                  ? "Actif"
                  : s.status.configured
                    ? "Configuré"
                    : "Inactif"}
              </span>
              {s.status.lastSyncAt ? (
                <span className="text-slate-500">
                  sync :{" "}
                  {new Date(s.status.lastSyncAt).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              ) : null}
              {s.status.lastError ? (
                <span className="text-rose-400">⚠ {s.status.lastError}</span>
              ) : null}
            </div>

            {s.status.reason ? (
              <p className="mt-2 text-[11px] italic text-slate-500">
                {s.status.reason}
              </p>
            ) : null}

            {s.envKeys.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                {s.envKeys.map((k) => (
                  <code
                    key={k}
                    className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300"
                  >
                    {k}
                  </code>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-3 text-xs">
              <a
                href={s.homepage}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline"
              >
                {s.homepage.replace(/^https?:\/\//, "")} ↗
              </a>
              {s.hasFetchScenes ? (
                <span className="text-slate-500">scenes API</span>
              ) : null}
              {s.hasFetchFixes ? (
                <span className="text-slate-500">fixes API</span>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Recommandation de mix
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>
            <strong>Démo gratuite</strong> : aisstream.io (live) + Sentinel-1
            (vérité terrain hebdo) — couvre EU/US correctement.
          </li>
          <li>
            <strong>Production trader</strong> : ajouter Spire (geofencé sur
            chokepoints critiques : Hormuz, Singapour, Bab el-Mandeb) pour
            combler le trou Golfe Persique.
          </li>
          <li>
            <strong>Redondance opérationnelle</strong> : MarineTraffic ou
            Orbcomm en fallback — différentes constellations satellites,
            bascule automatique si une source tombe.
          </li>
          <li>
            <strong>Détection dark fleet</strong> : VIIRS (lights de nuit)
            détecte les navires AIS éteints — précieux pour assureurs et
            sanctions.
          </li>
        </ul>
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
