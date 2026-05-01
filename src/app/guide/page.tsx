"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Attributions } from "../components/Attributions";

export default function GuidePage() {
  const { tp } = useI18n();
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("guide.backLink")}
        </Link>
        <Link
          href="/methodology"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("guide.methodologyLink")}
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {tp("guide.title")}
        </h1>
        <p className="text-sm text-slate-300">{tp("guide.lead")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("guide.audience.title")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("guide.audience.traders")}</li>
          <li>{tp("guide.audience.forwarders")}</li>
          <li>{tp("guide.audience.insurers")}</li>
          <li>{tp("guide.audience.quants")}</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("guide.dashboard.title")}</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>{tp("guide.dashboard.portSelector")}</li>
          <li>{tp("guide.dashboard.langSelector")}</li>
          <li>{tp("guide.dashboard.toggle")}</li>
          <li>{tp("guide.dashboard.kpis")}</li>
          <li>{tp("guide.dashboard.map")}</li>
          <li>{tp("guide.dashboard.voyages")}</li>
          <li>{tp("guide.dashboard.precision")}</li>
          <li>{tp("guide.dashboard.anomalies")}</li>
          <li>{tp("guide.dashboard.flow")}</li>
        </ol>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("guide.precision.title")}</h2>
        <p className="text-sm text-slate-300">{tp("guide.precision.body")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("guide.api.title")}</h2>
        <p className="text-sm text-slate-300">
          {tp("guide.api.intro")}{" "}
          <Link href="/api/v1/openapi.json" className="text-sky-400 underline">
            /api/v1/openapi.json
          </Link>
          .
        </p>
        <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
{`# Configure
echo "PORT_API_TOKENS=your-secret-token" >> .env.local

# List ports
curl -H "Authorization: Bearer your-secret-token" \\
  https://portflow.uk/api/v1/ports

# Rotterdam snapshot
curl -H "Authorization: Bearer your-secret-token" \\
  https://portflow.uk/api/v1/ports/rotterdam/snapshot

# Active tanker voyages
curl -H "Authorization: Bearer your-secret-token" \\
  "https://portflow.uk/api/v1/ports/rotterdam/voyages/active?tankersOnly=1"`}
        </pre>
        <p className="text-sm text-slate-300">{tp("guide.api.endpoints")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("guide.webhooks.title")}</h2>
        <p className="text-sm text-slate-300">{tp("guide.webhooks.intro")}</p>
        <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
{`# Subscribe to congestion > 30 stationary vessels at Rotterdam
curl -X POST -H "Authorization: Bearer your-secret-token" \\
  -H "content-type: application/json" \\
  -d '{
    "url": "https://your-app.example/hooks/port-flow",
    "port": "rotterdam",
    "event": "congestion.threshold",
    "threshold": 30
  }' \\
  https://portflow.uk/api/v1/webhooks

# Response — keep the secret to verify the signature
{ "id": "sub_…", "secret": "…", "url": "…", … }`}
        </pre>
        <p className="text-sm text-slate-300">{tp("guide.webhooks.headers")}</p>
        <p className="text-sm text-slate-300">{tp("guide.webhooks.events")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("guide.limits.title")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("guide.limits.coverage")}</li>
          <li>{tp("guide.limits.classification")}</li>
          <li>{tp("guide.limits.grace")}</li>
          <li>{tp("guide.limits.eta")}</li>
          <li>{tp("guide.limits.sanctions")}</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("guide.checklist.title")}</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
          <li>
            {tp("guide.checklist.s1")}{" "}
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
          <li>{tp("guide.checklist.s2")}</li>
          <li>{tp("guide.checklist.s3")}</li>
          <li>{tp("guide.checklist.s4")}</li>
          <li>{tp("guide.checklist.s5")}</li>
          <li>{tp("guide.checklist.s6")}</li>
        </ol>
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
