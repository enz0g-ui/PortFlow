"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Attributions } from "../components/Attributions";

export default function MethodologyPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          ← {t("nav.precision")}
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Méthodologie & SLA
        </h1>
        <p className="text-sm text-slate-300">
          Cette page documente précisément les sources de données, les modèles,
          la persistance et les engagements de service de la plateforme. C&apos;est
          le document que les équipes data des acheteurs B2B (traders,
          assureurs, freight forwarders) examinent avant de signer.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Sources de données</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            <strong>AIS positions</strong> : flux temps réel via{" "}
            <a
              className="text-sky-400 underline"
              href="https://aisstream.io"
              target="_blank"
              rel="noreferrer"
            >
              aisstream.io
            </a>{" "}
            (réseau communautaire). Couverture excellente Europe / US, plus
            faible Méditerranée / Golfe Persique.
          </li>
          <li>
            <strong>AIS données statiques</strong> : <code>ShipStaticData</code>{" "}
            (Type, Name, Destination, Draught, ETA broadcast) — émis toutes les
            ~6 minutes par navire.
          </li>
          <li>
            <strong>Géographie</strong> : bbox + zones (anchorages, berths,
            channels) définies à la main par port. Liste 10 ports v1 :
            ARA + Hamburg + Algeciras + Fujairah + Singapore + Houston + Sabine
            Pass + Ras Laffan.
          </li>
          <li>
            <strong>Pas de données propriétaires</strong> intégrées en v1 — la
            plateforme s&apos;appuie uniquement sur AIS publique. Des sources
            premium (Spire, Orbcomm) sont sur la roadmap pour combler les
            zones de couverture faible.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Classification de cargaison</h2>
        <p className="text-sm text-slate-300">
          Combinaison du shipType AIS (codes 70-89) et d&apos;une heuristique
          mots-clés (nom, destination) pour assigner une classe parmi : crude,
          product, chemical, LNG, LPG, container, dry-bulk, general-cargo,
          ro-ro, passenger, fishing, tug, other. Limitations connues : un
          navire mal nommé ou avec destination vide tombe sur le shipType
          générique. Précision attendue ~85 % sur tankers et ~95 % sur
          containers.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Détection de voyages</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            <strong>Ouverture</strong> : un voyage s&apos;ouvre quand un navire
            (de classe trackable : tanker / container / bulk / general / RoRo)
            est observé en approche/mouillage avec SOG ≥ 1 kn, après la grace
            period de 60 s suivant le démarrage du worker.
          </li>
          <li>
            <strong>Arrivée</strong> : transition vers state = moored dans une
            zone de quai (NavStatus 5 ou SOG &lt; 0,3 kn dans la zone berth).
          </li>
          <li>
            <strong>Départ</strong> : after arrived, vessel reaches state =
            underway et distance &gt; 8 nm du centre du port.
          </li>
          <li>
            <strong>Faux positifs</strong> : tugs, pilotes et fishing exclus du
            tracking — la classe cargaison sert de filtre.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Modèle ETA</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>
            <strong>Estimation naïve</strong> : <code>distance / SOG</code> où
            distance est le grand cercle entre la position courante et le
            centre du port. Recalculée toutes les 5 minutes par voyage actif.
          </li>
          <li>
            <strong>Correction saisonnière</strong> : médiane de l&apos;erreur
            (predicted − actual) calculée sur les 90 jours glissants, par
            heure d&apos;arrivée UTC. Fallback sur la médiane globale si le
            bucket horaire a moins de 3 échantillons. Recompute toutes les 30
            min.
          </li>
          <li>
            <strong>Référence comparée</strong> : champ ETA broadcast extrait
            des messages <code>ShipStaticData</code> (saisi manuellement par
            l&apos;équipage du navire — souvent imprécis et tardif).
          </li>
          <li>
            <strong>Métriques</strong> : RMSE et MAE en heures, sur les
            voyages clos avec ETA prédit ET ETA broadcast disponibles. Mises à
            jour à chaque voyage clos. Fenêtre par défaut : 30 jours.
          </li>
          <li>
            <strong>Roadmap modèle</strong> : intégration congestion, marées,
            météo, vitesse moyenne historique du navire spécifique.
          </li>
        </ol>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Détection d&apos;anomalies</h2>
        <p className="text-sm text-slate-300">
          v1 : seuils absolus de dwell au mouillage, ajustés par classe de
          cargaison.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            Tankers (crude/product/chemical/LNG/LPG) : warn ≥ 12 h, critical ≥
            48 h.
          </li>
          <li>Containers : warn ≥ 6 h, critical ≥ 24 h.</li>
          <li>Autres : warn ≥ 18 h, critical ≥ 72 h.</li>
        </ul>
        <p className="text-sm text-slate-300">
          Roadmap : seuils dérivés de la distribution historique par
          (port, cargo) ; détection de déviation de route filée ; détection de
          loitering hors zone connue (signal &quot;dark fleet&quot;).
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Persistance & lineage</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            Stockage SQLite via <code>node:sqlite</code> (built-in Node 22+).
            Tables : <code>kpi_snapshots</code>, <code>static_ships</code>,
            <code> positions</code>, <code>voyages</code>,{" "}
            <code>webhook_subscriptions</code>, <code>webhook_deliveries</code>.
          </li>
          <li>
            Chaque ligne <code>kpi_snapshots</code> et <code>voyages</code>{" "}
            porte le port et le timestamp. Reproductibilité totale d&apos;une
            métrique à un instant donné.
          </li>
          <li>
            Snapshot des positions : 1 entrée par minute par navire (rate
            limited). Permet le backtesting et la rejouabilité du modèle.
          </li>
          <li>
            Roadmap : export Parquet quotidien vers S3 / GCS pour les data
            scientists clients.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Engagements de service (SLA v1)</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">Disponibilité plateforme</td>
              <td className="py-2 text-slate-200">99,5 %/mois (MVP)</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">Latence positions live</td>
              <td className="py-2 text-slate-200">&lt; 30 s (P95)</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                Latence KPIs / voyages
              </td>
              <td className="py-2 text-slate-200">&lt; 90 s (P95)</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">Webhook delivery</td>
              <td className="py-2 text-slate-200">
                1 retry à 60 s · log 90 j
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">Rétention historique</td>
              <td className="py-2 text-slate-200">
                7 jours KPIs in-memory · illimité en SQLite (compactage 90 j)
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-slate-400">Backfill</td>
              <td className="py-2 text-slate-200">
                Sur demande contractuelle (rejouage des positions persistées)
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Conformité</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            Données AIS : ouvertes, transmises par les navires en respect de la
            convention SOLAS. Aucune donnée personnelle de l&apos;équipage.
          </li>
          <li>
            RGPD : aucun traitement de données personnelles. Les MMSI sont des
            identifiants de navire, pas de personne.
          </li>
          <li>
            Sanctions : la plateforme ne filtre pas activement les navires
            sous sanctions (US OFAC, UK OFSI, EU). Le client doit appliquer
            ses propres listes.
          </li>
          <li>
            Détails complets en{" "}
            <Link
              href="/legal"
              className="text-sky-400 hover:underline"
            >
              page Mentions légales
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <Attributions />
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
