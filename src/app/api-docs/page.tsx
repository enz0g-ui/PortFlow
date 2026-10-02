"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

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
  // Textes via i18n depuis le 02/10/2026 : la page était rédigée en français
  // (tutoiement compris) sur un site dont l'anglais est la langue primaire —
  // un prospect anglophone arrivé de LinkedIn l'a lue ainsi.
  const { tp } = useI18n();
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <Link href="/app" className="text-xs text-slate-400 hover:text-slate-200">
          {tp("apiDocs.back")}
        </Link>
        <Link
          href="/account"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("apiDocs.manageKeys")}
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{tp("apiDocs.title")}</h1>
        <p className="text-sm text-slate-300">
          {tp("apiDocs.intro1")}{" "}
          <Link href="/pricing" className="text-sky-400 hover:underline">
            Starter
          </Link>{" "}
          {tp("apiDocs.intro2")}{" "}
          <Link href="/pricing" className="text-sky-400 hover:underline">
            Pro+
          </Link>{" "}
          {tp("apiDocs.intro3")}
        </p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          {tp("apiDocs.auth.title")}
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          {tp("apiDocs.auth.p1")}{" "}
          <code className="rounded bg-slate-800 px-1">/api/v1/*</code>{" "}
          {tp("apiDocs.auth.p2")}{" "}
          <code className="rounded bg-slate-800 px-1">Authorization: Bearer pf_xxxxx</code>.{" "}
          {tp("apiDocs.auth.p3")}{" "}
          <Link href="/account" className="text-sky-400 hover:underline">
            /account
          </Link>{" "}
          {tp("apiDocs.auth.p4")}
        </p>
        <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
          {tp("apiDocs.auth.snippet")}
        </pre>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          {tp("apiDocs.rate.title")}
        </h2>
        <table className="w-full text-xs">
          <thead className="text-slate-500">
            <tr className="text-left">
              <th className="py-1 pr-3 font-normal">{tp("apiDocs.rate.plan")}</th>
              <th className="py-1 pr-3 font-normal">{tp("apiDocs.rate.perMin")}</th>
              <th className="py-1 font-normal">{tp("apiDocs.rate.perDay")}</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {[
              ["Free", "—", tp("apiDocs.rate.free")],
              ["Starter", "120", tp("apiDocs.rate.starter")],
              ["Professional", "300", tp("apiDocs.rate.pro")],
              ["Pro+", "600", tp("apiDocs.rate.proPlus")],
              ["Enterprise", "6 000", tp("apiDocs.rate.enterprise")],
            ].map(([plan, perMin, perDay]) => (
              <tr key={plan} className="border-t border-slate-800">
                <td className="py-1.5 pr-3">{plan}</td>
                <td className="py-1.5 pr-3">{perMin}</td>
                <td className="py-1.5">{perDay}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-slate-500">
          {tp("apiDocs.rate.note1")} <code>X-RateLimit-Limit</code>,
          <code> X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>{" "}
          {tp("apiDocs.rate.note2")}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-slate-200">
          {tp("apiDocs.endpoints")}
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
                      <span className="text-rose-400"> {tp("apiDocs.required")}</span>
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
                  {tp("apiDocs.exampleResponse")}
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
          {tp("apiDocs.webhooks.title")}
        </h2>
        <p className="text-xs text-slate-400">
          {tp("apiDocs.webhooks.p1")}{" "}
          <Link href="/account" className="text-sky-400 hover:underline">
            /account
          </Link>{" "}
          {tp("apiDocs.webhooks.p2")}{" "}
          <code>vessel.arrived</code>, <code>vessel.departed</code>,
          <code> vessel.anomaly</code>. {tp("apiDocs.webhooks.p3")}
        </p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          {tp("apiDocs.stability.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>
            {tp("apiDocs.stability.s1a")} <code>/api/v1/</code>.{" "}
            {tp("apiDocs.stability.s1b")}
          </li>
          <li>{tp("apiDocs.stability.s2")}</li>
          <li>
            {tp("apiDocs.stability.s3a")} <code>/api/*</code>{" "}
            {tp("apiDocs.stability.s3b")}
          </li>
          <li>
            {tp("apiDocs.stability.s4")}{" "}
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
