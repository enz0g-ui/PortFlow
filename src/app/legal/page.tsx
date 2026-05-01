"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Attributions } from "../components/Attributions";

export default function LegalPage() {
  const { tp } = useI18n();
  const rows = [1, 2, 3, 4, 5, 6] as const;
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("legal.backLink")}
        </Link>
        <Link
          href="/methodology"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          {tp("legal.methodologyLink")}
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {tp("legal.title")}
        </h1>
        <p className="text-sm text-slate-300">{tp("legal.lead")}</p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <Attributions />
      </section>

      <section className="rounded-lg border border-amber-800 bg-amber-950/20 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-300">
          {tp("legal.maritime.title")}
        </h3>
        <p className="text-sm text-slate-300">
          <strong className="text-amber-300">
            {tp("legal.maritime.notForNav")}
          </strong>{" "}
          {tp("legal.maritime.body")}
        </p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          {tp("legal.tos.title")}
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>{tp("legal.tos.b1")}</li>
          <li>
            {tp("legal.tos.b2.intro")}{" "}
            <Link href="/methodology" className="text-sky-400 hover:underline">
              {tp("legal.tos.b2.linkLabel")}
            </Link>
            {tp("legal.tos.b2.outro")}
          </li>
          <li>{tp("legal.tos.b3")}</li>
          <li>{tp("legal.tos.b4")}</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          {tp("legal.privacy.title")}
        </h3>
        <p className="mb-2 text-sm text-slate-400">
          <strong className="text-slate-200">
            {tp("legal.privacy.controller")}
          </strong>{" "}
          {tp("legal.privacy.contactPrefix")}{" "}
          <a
            href="mailto:privacy@portflow.uk"
            className="text-sky-400 hover:underline"
          >
            privacy@portflow.uk
          </a>
        </p>
        <p className="mb-3 text-sm text-slate-400">
          {tp("legal.privacy.intro")}
        </p>

        <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
          {tp("legal.privacy.dataTitle")}
        </h4>
        <table className="mt-2 w-full text-xs">
          <thead className="text-slate-500">
            <tr className="text-left">
              <th className="py-1 pr-3 font-normal">
                {tp("legal.privacy.col.data")}
              </th>
              <th className="py-1 pr-3 font-normal">
                {tp("legal.privacy.col.purpose")}
              </th>
              <th className="py-1 pr-3 font-normal">
                {tp("legal.privacy.col.basis")}
              </th>
              <th className="py-1 font-normal">
                {tp("legal.privacy.col.retention")}
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            {rows.map((n) => (
              <tr key={n} className="border-t border-slate-800">
                <td className="py-1.5 pr-3">
                  {tp(`legal.privacy.row${n}.data`)}
                </td>
                <td className="py-1.5 pr-3">
                  {tp(`legal.privacy.row${n}.purpose`)}
                </td>
                <td className="py-1.5 pr-3">
                  {tp(`legal.privacy.row${n}.basis`)}
                </td>
                <td className="py-1.5">
                  {tp(`legal.privacy.row${n}.retention`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
          {tp("legal.privacy.subTitle")}
        </h4>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          <li>{tp("legal.privacy.sub.clerk")}</li>
          <li>{tp("legal.privacy.sub.stripe")}</li>
          <li>{tp("legal.privacy.sub.do")}</li>
          <li>{tp("legal.privacy.sub.cloudflare")}</li>
          <li>{tp("legal.privacy.sub.resend")}</li>
          <li>{tp("legal.privacy.sub.aisstream")}</li>
          <li>{tp("legal.privacy.sub.copernicus")}</li>
        </ul>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
          {tp("legal.privacy.transfersTitle")}
        </h4>
        <p className="text-xs text-slate-400">
          {tp("legal.privacy.transfersBody")}
        </p>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
          {tp("legal.privacy.rightsTitle")}
        </h4>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          <li>{tp("legal.privacy.rights.access")}</li>
          <li>{tp("legal.privacy.rights.delete")}</li>
          <li>{tp("legal.privacy.rights.portability")}</li>
          <li>{tp("legal.privacy.rights.opt")}</li>
          <li>{tp("legal.privacy.rights.complaint")}</li>
        </ul>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
          {tp("legal.privacy.securityTitle")}
        </h4>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
          <li>{tp("legal.privacy.security.tls")}</li>
          <li>{tp("legal.privacy.security.encryption")}</li>
          <li>{tp("legal.privacy.security.passwords")}</li>
          <li>{tp("legal.privacy.security.audit")}</li>
          <li>{tp("legal.privacy.security.mmsi")}</li>
          <li>{tp("legal.privacy.security.cookies")}</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          {tp("legal.dpa.title")}
        </h3>
        <p className="mb-2 text-sm text-slate-400">{tp("legal.dpa.intro")}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>{tp("legal.dpa.role")}</li>
          <li>{tp("legal.dpa.noSecondary")}</li>
          <li>{tp("legal.dpa.breach")}</li>
          <li>{tp("legal.dpa.audits")}</li>
          <li>{tp("legal.dpa.endOfContract")}</li>
          <li>{tp("legal.dpa.subList")}</li>
        </ul>
        <p className="mt-3 text-sm text-slate-300">
          {tp("legal.dpa.outro")}{" "}
          <a
            href="mailto:contact@portflow.uk?subject=Demande%20DPA"
            className="text-sky-400 hover:underline"
          >
            contact@portflow.uk
          </a>
          {tp("legal.dpa.outroSuffix")}
        </p>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          {tp("legal.sanctions.title")}
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>{tp("legal.sanctions.b1")}</li>
          <li>{tp("legal.sanctions.b2")}</li>
          <li>{tp("legal.sanctions.b3")}</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          {tp("legal.citation.title")}
        </h3>
        <p className="text-sm text-slate-400">{tp("legal.citation.body")}</p>
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
