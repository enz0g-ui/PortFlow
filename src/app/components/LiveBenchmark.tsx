import Link from "next/link";
import { getVoyageAccuracy } from "@/lib/voyages";
import { DEFAULT_PORT_ID } from "@/lib/ports";

/**
 * Live, honest ETA benchmark card for the landing hero — mockup « la preuve
 * d'abord » : our MAE vs the broadcast MAE on the SAME closed voyages,
 * bars + verdict, Rotterdam last 30 days.
 *
 * COMPOSANT SERVEUR (depuis le 03/09/2026). Il était client (useEffect +
 * fetch), donc le HTML servi ne contenait que « Loading the live benchmark… » :
 * tout lecteur qui n'exécute pas JavaScript — crawlers, aperçus de liens et
 * surtout les assistants IA, devenus un canal de découverte réel — ne voyait
 * jamais notre meilleure preuve. Un audit externe du site a d'ailleurs conclu
 * que le benchmark « ne chargeait pas », alors que l'API répond en ~0,4 s.
 * Rendu côté serveur, le chiffre est désormais dans le HTML pour tout le monde.
 *
 * Integrity rule unchanged: never inflate. Without enough closed voyages we
 * say so and link the methodology instead of showing a hollow number.
 */

const WINDOW_DAYS = 30;
// Le calcul tape la base à chaque rendu ; la landing est dynamique (cookies)
// et peut être martelée par les crawlers. 5 min de cache mémoire suffisent :
// le benchmark n'évolue qu'à la clôture d'un voyage.
const TTL_MS = 5 * 60_000;

interface Snapshot {
  ours: number | null;
  broadcast: number | null;
  n: number;
}

let cache: { at: number; data: Snapshot } | null = null;

function snapshot(): Snapshot {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  let data: Snapshot = { ours: null, broadcast: null, n: 0 };
  try {
    const since = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const r = getVoyageAccuracy(DEFAULT_PORT_ID, since);
    data = {
      ours: r.modelMaeOnBaselineHours,
      broadcast: r.baselineMaeHours,
      n: r.baselineCount ?? 0,
    };
  } catch {
    // Base indisponible : on retombe sur le renvoi vers la méthodologie
    // plutôt que d'afficher un chiffre creux ou de casser la page.
  }
  cache = { at: Date.now(), data };
  return data;
}

export function LiveBenchmark() {
  const { ours, broadcast, n } = snapshot();
  const haveHeadToHead =
    typeof ours === "number" && typeof broadcast === "number" && n > 0;

  const advantage =
    haveHeadToHead && broadcast! > 0
      ? Math.round((1 - ours! / broadcast!) * 100)
      : null;
  const scale = haveHeadToHead ? Math.max(ours!, broadcast!) * 1.05 : 1;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Live benchmark · MAE
        </span>
        <span className="font-mono text-[10.5px] text-slate-600">
          Rotterdam · 30d{haveHeadToHead ? ` · ${n} voyages` : ""}
        </span>
      </div>

      {haveHeadToHead ? (
        <>
          <div className="mb-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-medium text-emerald-300">
                Port Flow — predicted ETA
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-emerald-300">
                {ours!.toFixed(1)}&nbsp;h
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded bg-slate-800/70">
              <div
                className="h-full rounded bg-emerald-300"
                style={{ width: `${Math.max(3, (ours! / scale) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mb-5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-400">
                Broadcast ETA (crew-declared)
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-rose-300">
                {broadcast!.toFixed(1)}&nbsp;h
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded bg-slate-800/70">
              <div
                className="h-full rounded bg-rose-300"
                style={{ width: `${(broadcast! / scale) * 100}%` }}
              />
            </div>
          </div>
          {advantage !== null && advantage > 0 ? (
            <Link
              href="/precision"
              className="block rounded border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-3 text-[13px] font-medium text-emerald-300 hover:border-emerald-400/50"
            >
              {advantage}&nbsp;% more accurate than the broadcast ETA — measured,
              not claimed. →
            </Link>
          ) : (
            <Link
              href="/precision"
              className="block rounded border border-slate-700 px-3.5 py-3 text-[13px] text-slate-400 hover:text-slate-200"
            >
              Full benchmark &amp; methodology →
            </Link>
          )}
        </>
      ) : (
        <p className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
          The published benchmark builds continuously as voyages close. See
          exactly how it&apos;s measured —{" "}
          <Link href="/precision" className="text-sky-400 hover:text-sky-300">
            methodology &amp; current numbers →
          </Link>
        </p>
      )}
    </div>
  );
}
