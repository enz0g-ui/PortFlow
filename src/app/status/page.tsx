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

interface AccuracyResp {
  rmseHours: number | null;
  baselineRmseHours: number | null;
  sampleCount: number;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResp | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyResp | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statusR, accR] = await Promise.all([
          fetch("/api/status", { cache: "no-store" }),
          fetch("/api/voyages/accuracy?port=rotterdam&days=30", {
            cache: "no-store",
          }),
        ]);
        if (statusR.ok) {
          const json = (await statusR.json()) as StatusResp;
          if (!cancelled) setData(json);
        }
        if (accR.ok) {
          const json = (await accR.json()) as AccuracyResp;
          if (!cancelled) setAccuracy(json);
        }
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

  const accuracyDelta =
    accuracy?.rmseHours != null && accuracy?.baselineRmseHours != null
      ? ((accuracy.rmseHours - accuracy.baselineRmseHours) /
          accuracy.baselineRmseHours) *
        100
      : null;
  const accuracyBeats = accuracyDelta !== null && accuracyDelta < 0;

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
            {accuracy && accuracy.sampleCount > 0 ? (
              <ServiceCard
                title="Précision ETA — Rotterdam · 30j"
                state={accuracyBeats ? "ok" : "warn"}
                rows={[
                  [
                    "RMSE Port Flow",
                    accuracy.rmseHours != null
                      ? `${accuracy.rmseHours.toFixed(2)} h`
                      : "—",
                  ],
                  [
                    "RMSE broadcast",
                    accuracy.baselineRmseHours != null
                      ? `${accuracy.baselineRmseHours.toFixed(2)} h`
                      : "—",
                  ],
                  [
                    "Avantage",
                    accuracyDelta !== null
                      ? `${accuracyBeats ? "" : "+"}${accuracyDelta.toFixed(1)}%`
                      : "—",
                  ],
                  [
                    "Voyages clos",
                    String(accuracy.sampleCount),
                  ],
                ]}
                footer={
                  accuracyBeats
                    ? "Plus précis que l'ETA déclarée par les armateurs"
                    : accuracyDelta !== null
                      ? "Moins précis — modèle en apprentissage"
                      : undefined
                }
              />
            ) : null}
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
