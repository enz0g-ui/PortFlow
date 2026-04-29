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
          Politique de confidentialité (RGPD)
        </h3>
        <p className="mb-2 text-sm text-slate-400">
          <strong className="text-slate-200">Responsable de traitement :</strong>{" "}
          Port Flow — contact :{" "}
          <a
            href="mailto:privacy@portflow.uk"
            className="text-sky-400 hover:underline"
          >
            privacy@portflow.uk
          </a>
        </p>
        <p className="mb-3 text-sm text-slate-400">
          Cette section décrit les données personnelles collectées, leurs
          finalités et les droits de l&apos;utilisateur conformément au RGPD
          (UE) 2016/679. Pour les clients EU, un{" "}
          <strong className="text-slate-200">DPA signable</strong> est
          disponible sur demande à privacy@portflow.uk.
        </p>

        <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
          Données collectées et finalités
        </h4>
        <table className="mt-2 w-full text-xs">
          <thead className="text-slate-500">
            <tr className="text-left">
              <th className="py-1 pr-3 font-normal">Donnée</th>
              <th className="py-1 pr-3 font-normal">Finalité</th>
              <th className="py-1 pr-3 font-normal">Base légale</th>
              <th className="py-1 font-normal">Conservation</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Email + identifiant Clerk</td>
              <td className="py-1.5 pr-3">Authentification, support</td>
              <td className="py-1.5 pr-3">Exécution contractuelle</td>
              <td className="py-1.5">Tant que compte actif + 12 mois</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">ID client Stripe + historique paiement</td>
              <td className="py-1.5 pr-3">Facturation, abonnement</td>
              <td className="py-1.5 pr-3">Exécution contractuelle</td>
              <td className="py-1.5">10 ans (obligation comptable)</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">URLs webhook Slack/Discord/Telegram, email alertes</td>
              <td className="py-1.5 pr-3">Envoi d&apos;alertes que vous configurez</td>
              <td className="py-1.5 pr-3">Consentement explicite (saisie UI)</td>
              <td className="py-1.5">Jusqu&apos;à suppression par l&apos;utilisateur</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Clés API tierces (Spire/VIIRS/Orbcomm) chiffrées AES-256-GCM</td>
              <td className="py-1.5 pr-3">Intégration BYO key</td>
              <td className="py-1.5 pr-3">Consentement explicite (saisie UI)</td>
              <td className="py-1.5">Jusqu&apos;à suppression par l&apos;utilisateur</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Watchlist (MMSI navires, IDs ports)</td>
              <td className="py-1.5 pr-3">Personnalisation dashboard</td>
              <td className="py-1.5 pr-3">Exécution contractuelle</td>
              <td className="py-1.5">Tant que compte actif</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Logs API (timestamp, key prefix, endpoint)</td>
              <td className="py-1.5 pr-3">Audit, sécurité, anti-abus</td>
              <td className="py-1.5 pr-3">Intérêt légitime</td>
              <td className="py-1.5">90 jours rolling</td>
            </tr>
          </tbody>
        </table>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
          Sous-traitants (sub-processors)
        </h4>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          <li>
            <strong className="text-slate-200">Clerk Inc.</strong> (US) —
            authentification utilisateur · clerk.com (DPA disponible)
          </li>
          <li>
            <strong className="text-slate-200">Stripe Inc.</strong> (US) —
            facturation · stripe.com (DPA + SCCs disponibles)
          </li>
          <li>
            <strong className="text-slate-200">DigitalOcean LLC</strong>
            (Frankfurt EU region) — hébergement · digitalocean.com (DPA)
          </li>
          <li>
            <strong className="text-slate-200">Cloudflare Inc.</strong> (US) —
            DNS + DDoS · cloudflare.com (DPA + SCCs)
          </li>
          <li>
            <strong className="text-slate-200">Resend Inc.</strong> (US) —
            envoi emails d&apos;alertes (si activé) · resend.com (DPA)
          </li>
          <li>
            <strong className="text-slate-200">aisstream.io</strong> — flux AIS
            public (pas de donnée personnelle utilisateur transmise)
          </li>
          <li>
            <strong className="text-slate-200">Copernicus Data Space (ESA)</strong>
            — imagerie satellite Sentinel-1 (publique)
          </li>
        </ul>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
          Transferts hors UE
        </h4>
        <p className="text-xs text-slate-400">
          Clerk, Stripe, Cloudflare et Resend opèrent depuis les US. Tous
          disposent de Standard Contractual Clauses (SCCs) UE-US. Les données
          AIS et de port (publiques par nature) ne constituent pas des données
          personnelles transférées.
        </p>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
          Vos droits
        </h4>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          <li>
            <strong className="text-slate-200">Accès, rectification</strong> —
            tout est visible dans /account, modifiable directement
          </li>
          <li>
            <strong className="text-slate-200">Effacement</strong> — supprime ton
            compte via Clerk (les clés API + watchlist + alertes en cascade)
          </li>
          <li>
            <strong className="text-slate-200">Portabilité</strong> — export CSV
            de ta watchlist/flotte disponible depuis /fleet (Starter+)
          </li>
          <li>
            <strong className="text-slate-200">Opposition, retrait du consentement</strong>{" "}
            — désactivation des alertes ou retrait des clés à tout moment dans
            /account et /sources
          </li>
          <li>
            <strong className="text-slate-200">Réclamation</strong> — auprès de
            la CNIL (France) ou de toute autorité de contrôle européenne
          </li>
        </ul>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
          Sécurité technique
        </h4>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          <li>
            HTTPS TLS 1.3 obligatoire (Let&apos;s Encrypt). HTTP redirigé.
          </li>
          <li>
            Chiffrement at-rest des secrets utilisateur (clés API tierces) :
            AES-256-GCM avec master key serveur
          </li>
          <li>
            Mots de passe gérés par Clerk (PBKDF2/Argon2id, jamais en clair)
          </li>
          <li>
            Logs auditables (table <code>audit_log</code>) sur changements
            d&apos;abonnement et accès API
          </li>
          <li>
            MMSI affichés = identifiants <em>de navire</em>, attribués par
            l&apos;UIT au pavillon — pas des identifiants de personnes
          </li>
          <li>
            Aucun cookie d&apos;analytics tiers. Le seul stockage local est
            le cache navigateur de résilience d&apos;onglet, purgeable.
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Data Processing Agreement (DPA) — résumé
        </h3>
        <p className="mb-2 text-sm text-slate-400">
          Pour tout client EU professionnel utilisant Port Flow pour traiter
          des données dans le cadre d&apos;une activité B2B, un DPA conforme à
          l&apos;article 28 RGPD est mis à disposition.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>
            Port Flow agit comme <strong>sous-traitant</strong> pour les
            données traitées dans le cadre du service (watchlist, alertes,
            clés API)
          </li>
          <li>
            Aucun traitement secondaire : pas de publicité, de revente, de
            profilage commercial
          </li>
          <li>
            Notification de toute violation de données dans les 72h
          </li>
          <li>
            Coopération aux audits annuels du client (sur préavis 30 jours)
          </li>
          <li>
            Suppression ou retour des données à la fin du contrat (export
            CSV + purge DB sur demande)
          </li>
          <li>
            Liste des sous-traitants ci-dessus, modifiable avec préavis 30 jours
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate-300">
          DPA signé sur demande à{" "}
          <a
            href="mailto:contact@portflow.uk?subject=Demande%20DPA"
            className="text-sky-400 hover:underline"
          >
            contact@portflow.uk
          </a>{" "}
          — délai indicatif 48h ouvrées.
        </p>
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
