import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVesselSheet, summarize, TIER_LABEL, WINDOW_DAYS, type Exposure } from "@/lib/brief";
import { identityChecks, linkedCompanies } from "@/lib/identity";
import { getNetwork } from "@/lib/screen";
import { PrintButton } from "../../../PrintButton";
import { getCurrentUser } from "@/lib/auth/session";
import { briefAccess } from "@/lib/brief-access";
import { cargoLabel, fmtDate, fmtHours, fmtUtc } from "../../../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vessel screening report",
  robots: { index: false, follow: false },
};

const VERDICT: Record<Exposure, string> = {
  listed: "SANCTIONED",
  exposed: "EXPOSED",
  clear: "NO ALERT",
  service: "SERVICE CRAFT — NOT SCORED",
  unassessed: "NOT ASSESSED",
};

const KIND: Record<string, string> = {
  sts: "Contact at sea",
  dark: "AIS gap",
  loiter: "Loitering",
  transit: "Strait transit",
  port: "Port call",
};

// Version claire et imprimable de la fiche navire (Imprimer → PDF).
export default async function VesselReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ mmsi: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { mmsi: raw } = await params;
  const sp = await searchParams;
  const mmsi = Number(raw);
  if (!Number.isInteger(mmsi) || mmsi < 100_000_000 || mmsi > 999_999_999) notFound();
  const days = (WINDOW_DAYS as readonly number[]).includes(Number(sp.d)) ? Number(sp.d) : 90;

  // Rapport PDF daté : formules payantes seulement (décision 25/11/2026).
  const user = await getCurrentUser();
  if (!briefAccess(user?.tier).report) {
    const back = `/brief/vessel/${mmsi}`;
    return (
      <main className="min-h-screen bg-[#070b12] px-4 pt-16 text-slate-200">
        <div className="mx-auto max-w-lg rounded-md border border-slate-700 bg-slate-900/70 p-6">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">🔒 Paid plans</div>
          <h1 className="mt-1 text-xl font-semibold text-slate-50">Dated PDF screening report</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Verdict, sanctions listings, evidence of contacts at sea, identity checks and a 180-day timeline in
            one dated document, ready for a compliance or KYC file. Included from the Starter plan.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              See plans →
            </Link>
            {user ? null : (
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(`${back}/report`)}`}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-400"
              >
                I already have a plan
              </Link>
            )}
            <Link href={back} className="px-2 py-2 text-sm text-slate-400 hover:text-slate-200">
              ← Back to the record
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const v = getVesselSheet(mmsi, days);
  if (!v) notFound();
  const net = getNetwork(mmsi, days);
  const summary = summarize(v, net.twoStepListed);
  const idChecks = identityChecks({ mmsi, imo: v.imo, aisName: v.name });
  const companies = linkedCompanies(mmsi, v.imo);
  const isRoutine = (t: (typeof v.timeline)[number]) =>
    t.kind === "loiter" || t.kind === "transit" || t.kind === "port" || t.tier === "port";
  const timeline = v.timeline.filter((t) => !isRoutine(t)).slice(0, 60);
  const routine = v.timeline.filter(isRoutine);
  const routineCount = (k: string) => routine.filter((t) => t.kind === k).length;
  const routineLine = [
    ["loiter", "loitering events"],
    ["transit", "strait transits"],
    ["port", "port calls"],
    ["sts", "same-port contacts"],
  ]
    .map(([k, l]) => [routineCount(k), l] as const)
    .filter(([n]) => n > 0)
    .map(([n, l]) => `${n} ${l}`)
    .join(", ");

  const facts: Array<[string, string]> = [
    ["Name", v.name ?? "Unidentified vessel"],
    ["IMO", v.imo ? String(v.imo) : "—"],
    ["MMSI", String(v.mmsi)],
    ["Flag", v.flag ? v.flag : v.midFlag ? `${v.midFlag.country} (from MMSI)` : "—"],
    ["Type", cargoLabel(v.cargoClass)],
    ["Length", v.lengthM ? `${Math.round(v.lengthM)} m` : "—"],
    ["Last seen", v.lastSeen ? `${v.lastSeen.place.label}, ${fmtUtc(v.lastSeen.ts)} UTC` : "—"],
    ["Period", `last ${days} days, to ${fmtDate(v.generatedAt)}`],
  ];

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-slate-900 print:p-0">
      <div className="mx-auto max-w-[820px]">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Link href={`/brief/vessel/${mmsi}${days !== 90 ? `?d=${days}` : ""}`} className="text-sm text-sky-700 hover:underline">
            ← Back to the record
          </Link>
          <PrintButton />
        </div>

        <header className="flex items-end justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Port Flow · vessel screening</div>
            <h1 className="mt-1 text-2xl font-bold">{v.name ?? "Unidentified vessel"}</h1>
          </div>
          <div className="text-right text-xs text-slate-500">
            Generated {fmtUtc(v.generatedAt)} UTC
            <br />
            {new Date(v.generatedAt).getUTCFullYear()}
          </div>
        </header>

        <section className="mt-5 rounded border border-slate-300 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Result</div>
          <div className={`mt-1 text-lg font-bold ${v.exposure === "listed" ? "text-red-700" : v.exposure === "exposed" ? "text-amber-700" : "text-slate-900"}`}>
            {VERDICT[v.exposure]}
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">{summary}</p>
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-bold uppercase tracking-wider">Identity</h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {facts.map(([k, val]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-24 shrink-0 text-slate-500">{k}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </section>

        {v.sanctions.length > 0 ? (
          <section className="mt-5">
            <h2 className="text-sm font-bold uppercase tracking-wider">Sanctions listings</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {v.sanctions.map((s, i) => (
                <li key={i}>
                  <b>{s.list}</b>
                  {s.regime ? ` · ${s.regime}` : ""}
                  {s.listedOn ? ` · listed ${fmtDate(s.listedOn)}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {idChecks.length > 0 || companies.length > 0 ? (
          <section className="mt-5 break-inside-avoid">
            <h2 className="text-sm font-bold uppercase tracking-wider">Identity &amp; links</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {idChecks.map((c, i) => (
                <li key={i}>
                  <b className={c.warn ? "text-amber-700" : "text-slate-500"}>{c.warn ? "Check" : "Info"}</b> · {c.text}
                  {c.mmsis ? ` (${c.mmsis.map((o) => `${o.name ?? "—"} / MMSI ${o.mmsi}`).join(", ")})` : ""}
                </li>
              ))}
              {companies.map((co) => (
                <li key={co.name}>
                  <b>Company</b> · {co.name}
                  {co.eu ? <b className="text-red-700"> · EU-sanctioned company{co.eu.euRef ? ` (${co.eu.euRef})` : ""}</b> : null}{" "}
                  <span className="text-slate-500">
                    ({co.via === "owner" ? "owner" : co.via === "operator" ? "operator" : `linked by ${co.via}`}
                    {co.siblingCount > 0 ? `; ${co.siblingCount} other listed ship${co.siblingCount > 1 ? "s" : ""}` : ""})
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {v.counterparts.length > 0 ? (
          <section className="mt-5 break-inside-avoid">
            <h2 className="text-sm font-bold uppercase tracking-wider">Ships met at sea</h2>
            <table className="mt-2 w-full text-sm">
              <thead className="border-b border-slate-300 text-left text-xs text-slate-500">
                <tr>
                  <th className="py-1 font-medium">Vessel</th>
                  <th className="py-1 font-medium">Lists</th>
                  <th className="py-1 font-medium">Strongest signal</th>
                  <th className="py-1 text-right font-medium">Meetings</th>
                  <th className="py-1 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {v.counterparts.slice(0, 30).map((c) => (
                  <tr key={c.mmsi}>
                    <td className="py-1">
                      {c.name ?? "Unidentified vessel"} <span className="text-xs text-slate-500">({c.mmsi})</span>
                    </td>
                    <td className="py-1 font-semibold text-red-700">{c.lists.join(", ")}</td>
                    <td className="py-1">{TIER_LABEL[c.best]}</td>
                    <td className="py-1 text-right">{c.meetings}</td>
                    <td className="py-1 text-right">{fmtHours(c.totalHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {v.portContacts + v.serviceContacts > 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                Not counted: {v.portContacts} same-port contacts, {v.serviceContacts} with tugs / pilots / service craft.
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-5">
          <h2 className="text-sm font-bold uppercase tracking-wider">Notable events</h2>
          {routineLine ? (
            <p className="mt-1 text-xs text-slate-500">Routine activity in the period, not listed: {routineLine}.</p>
          ) : null}
          {timeline.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No contact at sea or AIS gap recorded in the period.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <tbody className="divide-y divide-slate-200">
                {timeline.map((t) => (
                  <tr key={t.key} className="break-inside-avoid">
                    <td className="w-28 py-1 font-mono text-xs">{fmtUtc(t.ts)}</td>
                    <td className="w-36 py-1">{t.kind === "sts" && t.tier ? TIER_LABEL[t.tier] : KIND[t.kind]}</td>
                    <td className="py-1">
                      {t.place.label}
                      {t.other ? ` · with ${t.other.name ?? `MMSI ${t.other.mmsi}`}${t.other.sanctioned ? " (listed)" : ""}` : ""}
                    </td>
                    <td className="w-20 py-1 text-right">{fmtHours(t.durationH)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-8 border-t border-slate-300 pt-3 text-[11px] leading-relaxed text-slate-500">
          Sources: OFAC SDN, UK Sanctions List, UN Security Council list, EU designated-vessels list; contacts, AIS gaps and port calls from AIS
          positions received by the Port Flow network. Detection depends on AIS reception in monitored areas; the
          absence of a signal is not evidence of compliance. This report supports, and does not replace, your own
          due diligence. portflow.uk
        </footer>
      </div>
    </main>
  );
}
