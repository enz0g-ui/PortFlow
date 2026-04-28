"use client";

import Link from "next/link";
import { Attributions } from "../components/Attributions";

export default function GuidePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          ← retour au dashboard
        </Link>
        <Link
          href="/methodology"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Méthodologie →
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Guide d&apos;utilisation</h1>
        <p className="text-sm text-slate-300">
          Port Flow donne une vue temps réel des flux maritimes sur 10 ports
          stratégiques (ARA, soutage, LNG export). Cette page explique comment
          lire le dashboard, qui en tire de la valeur, et comment intégrer
          les données dans tes pipelines.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">À qui ça sert ?</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            <strong>Traders matières premières</strong> (pétrole, LNG,
            chimie) — ETA précise et indices de congestion alimentent les
            modèles de prix. Cible primaire de la plateforme.
          </li>
          <li>
            <strong>Freight forwarders</strong> — anticipation des
            dépassements de séjour (demurrage), choix de routing.
          </li>
          <li>
            <strong>Assureurs maritimes</strong> — détection d&apos;anomalies
            (loitering, dwell anormal), risk pricing.
          </li>
          <li>
            <strong>Data scientists / quants</strong> — feed historique pour
            backtesting de stratégies macro (activité portuaire = proxy
            économique).
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          Lire le dashboard en 30 secondes
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>
            <strong>Sélecteur de port</strong> en haut à droite — change le
            port observé. Le nom natif s&apos;affiche entre parenthèses si
            la langue active diffère (ex : Anvers <em>(Antwerpen)</em>,
            Hamburg, الفجيرة).
          </li>
          <li>
            <strong>Sélecteur de langue</strong> à côté — 6 langues métier :
            FR, EN, NL, DE, ES, AR (avec RTL automatique).
          </li>
          <li>
            <strong>Toggle Tous / Tankers</strong> — filtre instantanément la
            carte et les compteurs aux 5 sous-classes tanker (crude, product,
            chemical, LNG, LPG).
          </li>
          <li>
            <strong>KPI ligne</strong> — total navires, stationnaires (proxy
            congestion), en route, à quai, entrants/h, voyages actifs trackés.
          </li>
          <li>
            <strong>Carte</strong> — couleur = catégorie AIS, taille = état.
            Les rectangles pointillés sont les zones nommées (anchorage,
            berth, channel).
          </li>
          <li>
            <strong>Voyages actifs</strong> — table triée par ETA prédite.
            La colonne &quot;ETA broadcast&quot; est l&apos;heure que
            l&apos;équipage a saisie ; comparer aux écarts du modèle.
          </li>
          <li>
            <strong>ETA precision</strong> — RMSE de notre modèle vs RMSE de
            l&apos;ETA broadcast. C&apos;est l&apos;indicateur principal de
            qualité.
          </li>
          <li>
            <strong>Anomalies</strong> — navires au mouillage anormalement
            long pour leur classe. Critique à surveiller pour congestion ou
            bizarreries opérationnelles.
          </li>
          <li>
            <strong>Flux 6h</strong> — entrants / sortants / stationnaires sur les 6
            dernières heures. Tendance courte.
          </li>
        </ol>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Page ETA precision</h2>
        <p className="text-sm text-slate-300">
          Accessible via le bouton <code>ETA precision</code> ou{" "}
          <code>/precision</code>. Vue publique destinée à démontrer aux
          prospects la qualité du modèle. Trois indicateurs clés : RMSE
          modèle, RMSE broadcast, écart en %. Liste des 50 derniers voyages
          clos avec erreur en heures (vert &lt; 1h, ambre &lt; 3h, rouge
          au-delà). Méthodologie en bas de page. Filtre fenêtre 7/30/90 jours.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Intégration API</h2>
        <p className="text-sm text-slate-300">
          API publique sous <code>/api/v1</code>, authentifiée par bearer
          token. Spécification OpenAPI à{" "}
          <Link
            href="/api/v1/openapi.json"
            className="text-sky-400 underline"
          >
            /api/v1/openapi.json
          </Link>
          .
        </p>
        <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
{`# Configurer
echo "PORT_API_TOKENS=your-secret-token" >> .env.local

# Liste des ports
curl -H "Authorization: Bearer your-secret-token" \\
  http://localhost:3000/api/v1/ports

# Snapshot Rotterdam
curl -H "Authorization: Bearer your-secret-token" \\
  http://localhost:3000/api/v1/ports/rotterdam/snapshot

# Voyages tankers actifs
curl -H "Authorization: Bearer your-secret-token" \\
  "http://localhost:3000/api/v1/ports/rotterdam/voyages/active?tankersOnly=1"`}
        </pre>
        <p className="text-sm text-slate-300">
          Endpoints disponibles : <code>/ports</code>,{" "}
          <code>/ports/&#123;id&#125;/snapshot</code>,{" "}
          <code>/ports/&#123;id&#125;/vessels</code>,{" "}
          <code>/ports/&#123;id&#125;/voyages/active</code>,{" "}
          <code>/ports/&#123;id&#125;/voyages/closed</code>,{" "}
          <code>/ports/&#123;id&#125;/anomalies</code>,{" "}
          <code>/webhooks</code>.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Webhooks (alertes)</h2>
        <p className="text-sm text-slate-300">
          Souscris à un événement pour recevoir un POST signé HMAC-SHA256
          quand un seuil est franchi.
        </p>
        <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
{`# Souscrire à congestion > 30 navires stationnaires à Rotterdam
curl -X POST -H "Authorization: Bearer your-secret-token" \\
  -H "content-type: application/json" \\
  -d '{
    "url": "https://your-app.example/hooks/port-flow",
    "port": "rotterdam",
    "event": "congestion.threshold",
    "threshold": 30
  }' \\
  http://localhost:3000/api/v1/webhooks

# Réponse — secret à conserver pour vérifier la signature
{ "id": "sub_…", "secret": "…", "url": "…", … }`}
        </pre>
        <p className="text-sm text-slate-300">
          Headers fournis sur chaque livraison : <code>X-Port-Flow-Event</code>{" "}
          et <code>X-Port-Flow-Signature: t=&lt;ts&gt;,v1=&lt;hex&gt;</code>{" "}
          (HMAC-SHA256 du payload préfixé par le timestamp). Vérification
          côté receveur :{" "}
          <code>
            hmac_sha256(secret, &quot;&#123;ts&#125;.&#123;body&#125;&quot;)
          </code>
          .
        </p>
        <p className="text-sm text-slate-300">
          Événements supportés : <code>congestion.threshold</code> /{" "}
          <code>congestion.cleared</code>, <code>anomaly.detected</code>,{" "}
          <code>voyage.arrived</code>.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Limites connues</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            Couverture AIS faible Méditerranée et Golfe Persique avec
            aisstream.io (réseau communautaire). Algeciras, Fujairah, Ras
            Laffan affichent souvent peu ou aucun navire en v1. Solution :
            passer à un fournisseur commercial (Spire, Orbcomm) — sur la
            roadmap.
          </li>
          <li>
            Classification cargaison à ~85 % (tankers) / ~95 % (containers).
            Faux positifs sur les navires non nommés.
          </li>
          <li>
            Au démarrage du worker, une grace period de 60 s évite de compter
            les navires déjà présents comme &quot;entrants&quot;. Les KPIs
            entrants/h se calibrent ensuite naturellement.
          </li>
          <li>
            Modèle ETA v1 simple (distance/SOG + correction médiane). Bat
            l&apos;ETA broadcast quand les voyages sont &gt; 6h ; moins
            d&apos;avance sur les voyages courts.
          </li>
          <li>
            Pas de filtrage sanctions intégré. Le client doit appliquer ses
            propres listes (OFAC, OFSI, EU).
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Checklist de déploiement</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
          <li>
            Créer une clé{" "}
            <a
              className="text-sky-400 underline"
              href="https://aisstream.io"
              target="_blank"
              rel="noreferrer"
            >
              aisstream.io
            </a>
            .
          </li>
          <li>
            <code>cp .env.example .env.local</code>, renseigner{" "}
            <code>AISSTREAM_API_KEY</code> et <code>PORT_API_TOKENS</code>.
          </li>
          <li>
            <code>npm install &amp;&amp; npm run dev</code>.
          </li>
          <li>
            Vérifier le bandeau AIS Live en haut à droite (vert = flux
            entrant).
          </li>
          <li>
            Attendre 60 s + quelques minutes pour voir les voyages s&apos;ouvrir
            (selon le trafic).
          </li>
          <li>
            La page <code>/precision</code> affichera des chiffres après les
            premiers voyages clos (ETA prédite + arrivée constatée).
          </li>
        </ol>
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
