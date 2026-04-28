"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StatusResp {
  ts: number;
  services: {
    ais: {
      healthy: boolean;
      started: boolean;
      lastMessageAgeSeconds: number | null;
      vesselCount: number;
      messageCount: number;
    };
    sar: {
      healthy: boolean | null;
      started: boolean;
      authAvailable: boolean;
      demoEnabled: boolean;
      lastScanAgeSeconds: number | null;
      lastError?: string;
    };
    sanctions: {
      healthy: boolean;
      count: number;
      countByImo: number;
      countByMmsi: number;
      ageSeconds: number | null;
      errors: string[];
    };
  };
  coverage: { portsTracked: number; portsActive: number };
}

function dot(state: "ok" | "warn" | "down" | "idle") {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        state === "ok"
          ? "bg-emerald-400"
          : state === "warn"
            ? "bg-amber-400"
            : state === "down"
              ? "bg-rose-400"
              : "bg-slate-600"
      }`}
    />
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResp | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/status", { cache: "no-store" });
        if (!r.ok) return;
        const json = (await r.json()) as StatusResp;
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
    <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← retour
        </Link>
        <span className="text-xs text-slate-500">
          {data ? new Date(data.ts).toLocaleString() : "—"}
        </span>
      </header>

      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System status</h1>
        <p className="text-sm text-slate-300">
          Disponibilité publique des services Port Flow. Mise à jour automatique
          toutes les 30 s.
        </p>
      </section>

      {data ? (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ServiceCard
              title="AIS terrestre (aisstream.io)"
              state={
                data.services.ais.healthy
                  ? "ok"
                  : data.services.ais.started
                    ? "warn"
                    : "down"
              }
              rows={[
                ["Connexion", data.services.ais.started ? "active" : "down"],
                [
                  "Dernier message",
                  data.services.ais.lastMessageAgeSeconds != null
                    ? `${data.services.ais.lastMessageAgeSeconds} s`
                    : "—",
                ],
                ["Navires en cache", String(data.services.ais.vesselCount)],
                [
                  "Messages reçus",
                  data.services.ais.messageCount.toLocaleString(),
                ],
              ]}
            />
            <ServiceCard
              title="Sentinel-1 SAR scanner"
              state={
                !data.services.sar.started
                  ? "idle"
                  : data.services.sar.healthy
                    ? "ok"
                    : "warn"
              }
              rows={[
                ["Activé", data.services.sar.started ? "yes" : "no"],
                [
                  "Auth Copernicus",
                  data.services.sar.authAvailable ? "configurée" : "absente",
                ],
                [
                  "Mode démo",
                  data.services.sar.demoEnabled ? "actif" : "off",
                ],
                [
                  "Dernier scan",
                  data.services.sar.lastScanAgeSeconds != null
                    ? `${Math.round(data.services.sar.lastScanAgeSeconds / 60)} min`
                    : "—",
                ],
              ]}
              footer={data.services.sar.lastError}
            />
            <ServiceCard
              title="Listes de sanctions (OFAC + UK OFSI)"
              state={data.services.sanctions.healthy ? "ok" : "warn"}
              rows={[
                [
                  "Entrées indexées",
                  data.services.sanctions.count.toLocaleString(),
                ],
                [
                  "Par IMO",
                  String(data.services.sanctions.countByImo),
                ],
                [
                  "Par MMSI",
                  String(data.services.sanctions.countByMmsi),
                ],
                [
                  "Dernière maj",
                  data.services.sanctions.ageSeconds != null
                    ? `${Math.round(data.services.sanctions.ageSeconds / 60)} min`
                    : "—",
                ],
              ]}
              footer={data.services.sanctions.errors.join("; ")}
            />
            <ServiceCard
              title="Couverture ports"
              state="ok"
              rows={[
                [
                  "Ports tracés",
                  String(data.coverage.portsTracked),
                ],
                [
                  "Ports actifs (≥1 navire)",
                  String(data.coverage.portsActive),
                ],
                [
                  "Taux d'activité",
                  `${Math.round((data.coverage.portsActive / data.coverage.portsTracked) * 100)}%`,
                ],
              ]}
            />
          </section>
        </>
      ) : (
        <div className="text-sm text-slate-500">Chargement…</div>
      )}
    </main>
  );
}

function ServiceCard({
  title,
  state,
  rows,
  footer,
}: {
  title: string;
  state: "ok" | "warn" | "down" | "idle";
  rows: Array<[string, string]>;
  footer?: string;
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <header className="mb-3 flex items-center gap-2">
        {dot(state)}
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      </header>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {rows.map(([k, v]) => (
          <span key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-slate-200">{v}</dd>
          </span>
        ))}
      </dl>
      {footer ? (
        <p className="mt-2 text-[11px] text-rose-300">{footer}</p>
      ) : null}
    </article>
  );
}
