"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Attributions } from "../components/Attributions";

export default function MethodologyPage() {
  const { tp } = useI18n();
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("methodology.backLink")}
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {tp("methodology.title")}
        </h1>
        <p className="text-sm text-slate-300">{tp("methodology.lead")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.sources.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            <strong>AIS positions</strong> —{" "}
            <a
              className="text-sky-400 underline"
              href="https://aisstream.io"
              target="_blank"
              rel="noreferrer"
            >
              aisstream.io
            </a>
            . {tp("methodology.sources.aisLive")}
          </li>
          <li>
            <strong>AIS static</strong> — {tp("methodology.sources.aisStatic")}
          </li>
          <li>
            <strong>Geo</strong> — {tp("methodology.sources.geo")}
          </li>
          <li>
            <strong>Premium</strong> — {tp("methodology.sources.proprietary")}
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.cargoClass.title")}
        </h2>
        <p className="text-sm text-slate-300">
          {tp("methodology.cargoClass.body")}
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.voyages.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.voyages.open")}</li>
          <li>{tp("methodology.voyages.arrival")}</li>
          <li>{tp("methodology.voyages.departure")}</li>
          <li>{tp("methodology.voyages.falsePositives")}</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("methodology.eta.title")}</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.eta.naive")}</li>
          <li>{tp("methodology.eta.seasonal")}</li>
          <li>{tp("methodology.eta.broadcast")}</li>
          <li>{tp("methodology.eta.metrics")}</li>
          <li>{tp("methodology.eta.roadmap")}</li>
        </ol>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.anomalies.title")}
        </h2>
        <p className="text-sm text-slate-300">
          {tp("methodology.anomalies.intro")}
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.anomalies.tanker")}</li>
          <li>{tp("methodology.anomalies.container")}</li>
          <li>{tp("methodology.anomalies.other")}</li>
        </ul>
        <p className="text-sm text-slate-300">
          {tp("methodology.anomalies.roadmap")}
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.persistence.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.persistence.storage")}</li>
          <li>{tp("methodology.persistence.timestamps")}</li>
          <li>{tp("methodology.persistence.snapshot")}</li>
          <li>{tp("methodology.persistence.export")}</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">{tp("methodology.sla.title")}</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.uptime")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.uptimeValue")}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.latencyLive")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.latencyLiveValue")}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.latencyKpi")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.latencyKpiValue")}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.webhook")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.webhookValue")}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.retention")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.retentionValue")}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-slate-400">
                {tp("methodology.sla.backfill")}
              </td>
              <td className="py-2 text-slate-200">
                {tp("methodology.sla.backfillValue")}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">
          {tp("methodology.compliance.title")}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>{tp("methodology.compliance.solas")}</li>
          <li>{tp("methodology.compliance.gdpr")}</li>
          <li>{tp("methodology.compliance.sanctions")}</li>
          <li>
            {tp("methodology.compliance.legalIntro")}{" "}
            <Link href="/legal" className="text-sky-400 hover:underline">
              {tp("methodology.compliance.legalLabel")}
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
