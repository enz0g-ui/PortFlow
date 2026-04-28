"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Attributions } from "../components/Attributions";

interface VoyageSample {
  voyageId: string;
  mmsi: number;
  cargoClass?: string;
  arrivedTs?: number | null;
  predictedEta?: number | null;
  broadcastEta?: number | null;
  errorHours?: number | null;
  baselineErrorHours?: number | null;
}

interface AccuracyResp {
  windowDays: number;
  sampleCount: number;
  rmseHours: number | null;
  maeHours: number | null;
  baselineRmseHours: number | null;
  voyages: VoyageSample[];
}

function fmtH(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(digits)} h`;
}

function fmtTs(ts?: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PrecisionInner() {
  const searchParams = useSearchParams();
  const portId = searchParams.get("port") ?? "rotterdam";
  const [data, setData] = useState<AccuracyResp | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(
          `/api/voyages/accuracy?port=${portId}&days=${days}`,
          { cache: "no-store" },
        );
        if (!r.ok) return;
        const json = (await r.json()) as AccuracyResp;
        if (!cancelled) setData(json);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [days, portId]);

  const rmse = data?.rmseHours ?? null;
  const baseline = data?.baselineRmseHours ?? null;
  const delta =
    rmse !== null && baseline !== null
      ? ((rmse - baseline) / baseline) * 100
      : null;
  const beats = delta !== null && delta < 0;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          ← retour au dashboard
        </Link>
        <span className="text-xs text-slate-500">
          fenêtre :
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`ml-2 rounded px-2 py-0.5 ${
                days === d
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}j
            </button>
          ))}
        </span>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          ETA precision · {portId}
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Nous prédisons l&apos;heure d&apos;arrivée des navires au Port de
          Rotterdam à partir de la position AIS, vitesse, et cap, puis
          comparons à l&apos;heure d&apos;arrivée réelle{" "}
          <em>et</em> à l&apos;ETA déclarée par les armateurs (champ ETA
          broadcast AIS). Tout est public, recalculé à chaque voyage clos, et
          reproductible — voir la méthodologie en bas de page.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="Notre RMSE"
          value={fmtH(rmse)}
          tone={beats ? "good" : "warn"}
          hint={`MAE ${fmtH(data?.maeHours ?? null)} · ${data?.sampleCount ?? 0} voyages`}
        />
        <Stat
          label="RMSE ETA broadcast"
          value={fmtH(baseline)}
          tone="default"
          hint="Référence : ETA déclarée par les armateurs"
        />
        <Stat
          label={beats ? "Avantage modèle" : "Écart"}
          value={delta !== null ? `${Math.abs(delta).toFixed(1)} %` : "—"}
          tone={beats ? "good" : "warn"}
          hint={
            delta === null
              ? "Comparaison disponible après quelques voyages"
              : beats
                ? "Plus précis que l'ETA broadcast"
                : "Moins précis que l'ETA broadcast"
          }
        />
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            50 derniers voyages clos
          </h2>
          <span className="text-xs text-slate-500">
            err = predicted − actual
          </span>
        </div>
        {data && data.voyages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr className="text-left">
                  <th className="py-1 pr-3 font-normal">MMSI</th>
                  <th className="py-1 pr-3 font-normal">Cargo</th>
                  <th className="py-1 pr-3 font-normal">Arrivée</th>
                  <th className="py-1 pr-3 font-normal text-right">
                    Erreur modèle
                  </th>
                  <th className="py-1 pr-3 font-normal text-right">
                    Erreur broadcast
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.voyages.map((v) => (
                  <tr key={v.voyageId} className="border-t border-slate-800">
                    <td className="py-1.5 pr-3 tabular-nums text-slate-300">
                      {v.mmsi}
                    </td>
                    <td className="py-1.5 pr-3 text-slate-300">
                      {v.cargoClass ?? "—"}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums text-slate-400">
                      {fmtTs(v.arrivedTs)}
                    </td>
                    <td
                      className={`py-1.5 pr-3 tabular-nums text-right ${errTone(v.errorHours)}`}
                    >
                      {fmtH(v.errorHours)}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums text-right text-slate-400">
                      {fmtH(v.baselineErrorHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Pas encore de voyages clos sur la fenêtre. La table se remplit dès
            qu&apos;un navire suivi se met à quai.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Méthodologie
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>
            Source : flux AIS aisstream.io filtré sur la bbox Rotterdam (incluant
            les zones de mouillage offshore).
          </li>
          <li>
            Voyage = première observation en approche/mouillage → arrivée à quai
            (NavStatus moored ou SOG &lt; 0,3 kn dans une zone de quai).
          </li>
          <li>
            Modèle ETA v1 : <code>distance / SOG</code> recalculé toutes les 5
            minutes. Modèles plus avancés (saisonnier, congestion-aware,
            tide-aware) en roadmap.
          </li>
          <li>
            Référence : champ ETA broadcast extrait des messages
            <code> ShipStaticData </code> (saisi par l&apos;équipage).
          </li>
          <li>
            Métriques : RMSE et MAE sur les voyages clos avec ETA prédit et ETA
            broadcast disponibles.
          </li>
        </ul>
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}

export default function PrecisionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Chargement…
        </div>
      }
    >
      <PrecisionInner />
    </Suspense>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-slate-100";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-5 py-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`text-3xl font-semibold tabular-nums ${color}`}>
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}

function errTone(err: number | null | undefined): string {
  if (err === null || err === undefined) return "text-slate-500";
  const a = Math.abs(err);
  if (a < 1) return "text-emerald-300";
  if (a < 3) return "text-amber-300";
  return "text-rose-300";
}
