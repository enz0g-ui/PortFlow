"use client";

import Link from "next/link";

interface Endpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  desc: string;
  params?: Array<{ name: string; type: string; req?: boolean; note?: string }>;
  example: string;
  response?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/ports",
    desc: "List all 51 tracked ports with bbox, region, country, vessel count.",
    example: `curl -H "Authorization: Bearer pf_xxxxxxxxxxxxxxx" \\
  https://portflow.uk/api/v1/ports`,
    response: `{
  "ports": [
    { "id": "rotterdam", "name": "Rotterdam", "country": "Netherlands",
      "flag": "🇳🇱", "region": "northern-europe", "strategic": true,
      "center": [51.95, 4.10], "bbox": [...], "vesselCount": 935 },
    ...
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/ports/{id}/snapshot",
    desc: "Live KPI snapshot for a port (anchored / underway / moored / inbound).",
    params: [{ name: "id", type: "string", req: true, note: "port id, e.g. rotterdam" }],
    example: `curl -H "Authorization: Bearer pf_xxxxxxxxxxxxxxx" \\
  https://portflow.uk/api/v1/ports/rotterdam/snapshot`,
    response: `{
  "port": "rotterdam", "ts": 1777465634000,
  "snapshot": { "totalVessels": 935, "anchored": 17, "underway": 150,
                "moored": 736, "inboundLastHour": 588, ... }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/ports/{id}/vessels",
    desc: "Live vessels at a port (last position, SOG, COG, state, cargo class).",
    example: `curl -H "Authorization: Bearer pf_xxxxxxxxxxxxxxx" \\
  https://portflow.uk/api/v1/ports/rotterdam/vessels`,
    response: `{
  "port": "rotterdam", "count": 935,
  "vessels": [
    { "mmsi": 244690099, "name": "ELJA", "lat": 51.95, "lon": 4.10,
      "sog": 0.0, "cog": 130, "state": "anchored",
      "cargoClass": "container", "destination": "ROTTERDAM" },
    ...
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/ports/{id}/voyages/active",
    desc: "Open voyages with predicted ETA (model v2) and broadcast ETA.",
    params: [
      { name: "tankersOnly", type: "0|1", note: "filter to tanker cargo classes" },
    ],
    example: `curl -H "Authorization: Bearer pf_xxxxxxxxxxxxxxx" \\
  "https://portflow.uk/api/v1/ports/rotterdam/voyages/active?tankersOnly=1"`,
    response: `{
  "port": "rotterdam", "count": 211,
  "voyages": [
    { "voyageId": "rotterdam_244690099_...", "mmsi": 244690099,
      "name": "ELJA", "cargoClass": "container", "currentSog": 0.0,
      "currentDistanceNm": 6.7, "predictedEta": 1777445400000,
      "broadcastEta": null }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/ports/{id}/voyages/closed",
    desc: "Recent closed voyages with arrival timestamp + RMSE benchmark.",
    params: [{ name: "days", type: "int", note: "lookback window, default 30" }],
    example: `curl -H "Authorization: Bearer pf_xxxxxxxxxxxxxxx" \\
  "https://portflow.uk/api/v1/ports/rotterdam/voyages/closed?days=30"`,
    response: `{
  "port": "rotterdam", "windowDays": 30,
  "voyages": [...], "rmseHours": 4.01, "baselineRmseHours": null
}`,
  },
  {
    method: "GET",
    path: "/api/v1/ports/{id}/anomalies",
    desc: "Active anomalies detected (AIS gap, sudden zone change, drift, etc.).",
    example: `curl -H "Authorization: Bearer pf_xxxxxxxxxxxxxxx" \\
  https://portflow.uk/api/v1/ports/rotterdam/anomalies`,
  },
  {
    method: "GET",
    path: "/api/sanctions",
    desc: "OFAC SDN + UK OFSI screening for a vessel by MMSI or IMO.",
    params: [
      { name: "mmsi", type: "int", note: "9-digit MMSI" },
      { name: "imo", type: "int", note: "7-digit IMO number" },
    ],
    example: `curl "https://portflow.uk/api/sanctions?mmsi=123456789"`,
    response: `{
  "mmsi": 123456789, "flagged": false, "matches": [],
  "status": { "fetchedAt": ..., "count": 1987, "errors": [...] }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    desc: "Register a webhook for vessel events (subscribe to your watchlist).",
    example: `curl -X POST -H "Authorization: Bearer pf_xxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://your-server/hook", "event": "vessel.arrived",
       "port": "rotterdam"}' \\
  https://portflow.uk/api/v1/webhooks`,
  },
];

const COLOR: Record<Endpoint["method"], string> = {
  GET: "bg-emerald-500/15 text-emerald-300 border-emerald-700",
  POST: "bg-sky-500/15 text-sky-300 border-sky-700",
  DELETE: "bg-rose-500/15 text-rose-300 border-rose-700",
};

export default function ApiDocsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← retour
        </Link>
        <Link
          href="/account"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Gérer mes clés API →
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          API publique Port Flow
        </h1>
        <p className="text-sm text-slate-300">
          API REST simple, JSON, authentification Bearer. Disponible à partir
          du plan{" "}
          <Link href="/pricing" className="text-sky-400 hover:underline">
            Starter
          </Link>{" "}
          (5 k req/jour) jusqu&apos;à{" "}
          <Link href="/pricing" className="text-sky-400 hover:underline">
            Pro+
          </Link>{" "}
          (600 req/min).
        </p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          Authentification
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          Toutes les routes sous <code className="rounded bg-slate-800 px-1">/api/v1/*</code>{" "}
          requièrent un header{" "}
          <code className="rounded bg-slate-800 px-1">Authorization: Bearer pf_xxxxx</code>.
          Crée ta clé sur la page{" "}
          <Link href="/account" className="text-sky-400 hover:underline">
            /account
          </Link>{" "}
          (section &quot;Clés API&quot;). Affichée une seule fois — copie-la dans ton
          gestionnaire de secrets immédiatement.
        </p>
        <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
{`# Test rapide
curl -H "Authorization: Bearer pf_xxxxxxxxxxxxxxx" \\
  https://portflow.uk/api/v1/ports

# 401 → token invalide ou révoqué
# 429 → rate limit dépassé (header X-RateLimit-Reset indique la prochaine fenêtre)`}
        </pre>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          Rate limits
        </h2>
        <table className="w-full text-xs">
          <thead className="text-slate-500">
            <tr className="text-left">
              <th className="py-1 pr-3 font-normal">Plan</th>
              <th className="py-1 pr-3 font-normal">Req / min</th>
              <th className="py-1 font-normal">Req / jour estimé</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Free</td>
              <td className="py-1.5 pr-3">—</td>
              <td className="py-1.5">API non disponible</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Starter</td>
              <td className="py-1.5 pr-3">120</td>
              <td className="py-1.5">~5 000 / jour</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Professional</td>
              <td className="py-1.5 pr-3">300</td>
              <td className="py-1.5">~18 000 / heure</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Pro+</td>
              <td className="py-1.5 pr-3">600</td>
              <td className="py-1.5">~36 000 / heure</td>
            </tr>
            <tr className="border-t border-slate-800">
              <td className="py-1.5 pr-3">Enterprise</td>
              <td className="py-1.5 pr-3">6 000</td>
              <td className="py-1.5">illimité dans la pratique</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-slate-500">
          Limites appliquées par token. Headers <code>X-RateLimit-Limit</code>,
          <code> X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>{" "}
          présents sur chaque réponse.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-slate-200">
          Endpoints
        </h2>
        {ENDPOINTS.map((e) => (
          <article
            key={`${e.method} ${e.path}`}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
          >
            <header className="mb-2 flex items-center gap-2 text-sm">
              <span
                className={`rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase ${COLOR[e.method]}`}
              >
                {e.method}
              </span>
              <code className="font-mono text-slate-200">{e.path}</code>
            </header>
            <p className="mb-3 text-xs text-slate-400">{e.desc}</p>
            {e.params && e.params.length > 0 ? (
              <ul className="mb-2 space-y-1 text-[11px] text-slate-400">
                {e.params.map((p) => (
                  <li key={p.name}>
                    <code className="rounded bg-slate-800 px-1 font-mono">
                      {p.name}
                    </code>{" "}
                    <span className="text-slate-500">({p.type})</span>
                    {p.req ? (
                      <span className="text-rose-400"> required</span>
                    ) : null}
                    {p.note ? (
                      <span className="text-slate-500"> — {p.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-[11px] text-slate-300">
              {e.example}
            </pre>
            {e.response ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-[10px] text-slate-500">
                  Exemple de réponse
                </summary>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-950 p-3 text-[11px] text-slate-400">
                  {e.response}
                </pre>
              </details>
            ) : null}
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Webhooks
        </h2>
        <p className="text-xs text-slate-400">
          Au-delà des appels REST pull, configure un webhook (Slack, Discord,
          Telegram, email, ou endpoint custom) directement sur{" "}
          <Link href="/account" className="text-sky-400 hover:underline">
            /account
          </Link>{" "}
          → section Alertes. Les événements supportés :{" "}
          <code>vessel.arrived</code>, <code>vessel.departed</code>,
          <code> vessel.anomaly</code>. Filtres par watchlist + port disponibles.
        </p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Stabilité de l&apos;API
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>
            Versionnée par préfixe <code>/api/v1/</code>. Pas de breaking change
            sur v1 sans pré-annonce 60 jours.
          </li>
          <li>
            Nouveaux champs additifs sans incrément de version
          </li>
          <li>
            Ancienne API <code>/api/*</code> (sans <code>v1</code>) reste pour
            le dashboard interne — pas garantie pour usage tiers.
          </li>
          <li>
            Rapport de bug ou demande de feature :{" "}
            <a
              href="mailto:contact@portflow.uk?subject=API"
              className="text-sky-400 hover:underline"
            >
              contact@portflow.uk
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
