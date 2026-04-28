"use client";

import Link from "next/link";
import { Attributions } from "../components/Attributions";

export default function LegalPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
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
        <h1 className="text-3xl font-bold tracking-tight">Mentions légales</h1>
        <p className="text-sm text-slate-300">
          Cette page consolide attributions de données, conditions
          d&apos;utilisation, vie privée, conformité et limites. Elle est
          référencée depuis le pied de chaque page.
        </p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <Attributions />
      </section>

      <section className="rounded-lg border border-amber-800 bg-amber-950/20 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-300">
          Avis maritime
        </h3>
        <p className="text-sm text-slate-300">
          <strong className="text-amber-300">Not for navigation.</strong> Les
          positions, ETA, anomalies et indicateurs publiés par Port Flow sont
          dérivés de signaux AIS publics et de données météo et imagerie
          satellite. Ils peuvent contenir des erreurs, des retards et des
          omissions. Cette plateforme ne remplace en aucun cas un système de
          navigation certifié, ni une cellule opérationnelle de pilotage.
          L&apos;usage à des fins de sécurité maritime, de pilotage ou de
          décision opérationnelle critique est explicitement exclu.
        </p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Conditions d&apos;utilisation
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>
            Plateforme fournie « en l&apos;état », sans garantie de
            disponibilité, d&apos;exactitude ou d&apos;adéquation à un usage
            particulier.
          </li>
          <li>
            Engagements de service détaillés dans la{" "}
            <Link
              href="/methodology"
              className="text-sky-400 hover:underline"
            >
              page méthodologie
            </Link>{" "}
            (SLA v1).
          </li>
          <li>
            Les données affichées peuvent être dérivées et transformées. La
            plateforme n&apos;est pas un revendeur de données AIS brutes.
          </li>
          <li>
            Tout usage commercial nécessite respect des termes des fournisseurs
            sources (notamment paiement Spire / MarineTraffic / Orbcomm si
            activés).
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Vie privée & RGPD
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>
            La plateforme ne traite aucune donnée personnelle au sens RGPD.
          </li>
          <li>
            Les MMSI affichés sont des identifiants{" "}
            <em>de navire</em>, attribués par l&apos;UIT au pavillon — pas des
            identifiants de personnes physiques.
          </li>
          <li>
            Aucun cookie d&apos;analytics, aucun tracker tiers. Le seul stockage
            local est le cache navigateur (`localStorage`) pour la résilience
            d&apos;onglet — purgeable à tout moment.
          </li>
          <li>
            Les API keys (aisstream.io, Spire, MarineTraffic, Orbcomm) restent
            côté serveur dans `.env.local`, jamais exposées au client.
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Sanctions & conformité
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>
            La plateforme n&apos;applique pas de filtre OFAC, OFSI, EU ou ONU
            sur les navires affichés. Les opérateurs sous sanctions peuvent
            apparaître comme tout autre navire.
          </li>
          <li>
            Il appartient au client utilisateur (trader, assureur, freight
            forwarder) d&apos;appliquer ses propres listes et procédures de
            screening.
          </li>
          <li>
            La plateforme est neutre : aucun navire n&apos;est masqué ou marqué
            sur des critères politiques ou commerciaux.
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Citation académique
        </h3>
        <p className="text-sm text-slate-400">
          Si vous citez Port Flow dans une publication, merci d&apos;inclure :
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
{`Port Flow — Multi-port AIS dashboard with predicted ETA.
Data sources: aisstream.io (terrestrial AIS), Open-Meteo (weather),
Copernicus Sentinel-1 (SAR imagery), EOG/Colorado School of Mines
(VIIRS Boat Detection, when active). Tile providers: CARTO + OpenStreetMap.`}
        </pre>
      </section>
    </main>
  );
}
