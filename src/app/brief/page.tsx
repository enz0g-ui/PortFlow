import type { Metadata } from "next";
import Link from "next/link";
import {
  getBrief,
  SIGNAL_LABEL,
  type BriefWindow,
  type SignalKind,
} from "@/lib/brief";
import {
  cargoLabel,
  fmtAgo,
  fmtHours,
  fmtUtc,
  KindBadge,
  ListBadges,
  PlaceLink,
  VesselLink,
} from "./ui";
import { ScreenBox } from "./ScreenBox";
import { screenExamples } from "@/lib/screen";

export const metadata: Metadata = {
  title: "Briefing",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const WINDOWS: BriefWindow[] = ["24h", "7d", "30d"];
const KINDS: SignalKind[] = ["sts", "dark", "loiter", "transit"];

const TILE_HINT: Record<SignalKind, string> = {
  sts: "Side by side with another ship at sea",
  dark: "Transponder silent while underway",
  loiter: "Stopped for hours far from any port",
  transit: "Through a monitored strait",
};

function href(w: BriefWindow, k?: SignalKind, all?: boolean): string {
  const p = new URLSearchParams();
  if (w !== "7d") p.set("w", w);
  if (k) p.set("k", k);
  if (all) p.set("all", "1");
  const s = p.toString();
  return s ? `/brief?${s}` : "/brief";
}

export default async function BriefPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const w: BriefWindow = WINDOWS.includes(sp.w as BriefWindow)
    ? (sp.w as BriefWindow)
    : "7d";
  const k = KINDS.includes(sp.k as SignalKind) ? (sp.k as SignalKind) : undefined;
  const showAll = sp.all === "1";

  const brief = getBrief(w);
  const now = brief.generatedAt;
  const vessels = (k
    ? brief.vessels.filter((v) => v.counts[k] > 0)
    : brief.vessels
  ).slice(0, showAll ? 500 : 25);
  const vesselTotal = k
    ? brief.vessels.filter((v) => v.counts[k] > 0).length
    : brief.vessels.length;
  const events = (k ? brief.events.filter((e) => e.kind === k) : brief.events)
    .slice()
    .sort((a, b) => b.severity - a.severity || b.ts - a.ts)
    .slice(0, 60);
  const examples = screenExamples(
    getBrief("30d").events.filter((e) => e.kind === "sts"),
  );

  return (
    <main className="min-h-screen bg-[#070b12] px-4 pb-24 pt-6 text-slate-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        {/* Vérification : le point d'entrée */}
        <section className="rounded-lg border border-slate-700/80 bg-gradient-to-br from-slate-900 to-[#0a1220] p-5 sm:p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-400">
            Port Flow · Sanctions & contact screening
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
            Is your fleet exposed?
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Sanctions lists tell you who is listed. We also tell you who has been
            side by side with a listed ship at sea — in seconds, without an account.
          </p>
          <div className="mt-4 max-w-4xl">
            <ScreenBox examples={examples} compact />
          </div>
        </section>

        {/* En-tête du briefing */}
        <header className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Briefing
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">
              What changed, which ships, where
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Vessels on OFAC, UK and UN lists, and what they did at sea.
              Updated {fmtUtc(brief.generatedAt)} UTC.
            </p>
          </div>
          <nav className="flex items-center gap-1 rounded-md border border-slate-800 p-1 font-mono text-xs">
            {WINDOWS.map((x) => (
              <Link
                key={x}
                href={href(x, k)}
                className={`rounded px-3 py-1.5 ${
                  x === w
                    ? "bg-slate-200 font-semibold text-slate-900"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {x}
              </Link>
            ))}
          </nav>
        </header>

        {/* Chiffres clés : chacun filtre la page */}
        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Link
            href={href(w)}
            className={`rounded-md border p-3 transition ${
              !k
                ? "border-slate-300 bg-slate-800/70"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
            }`}
          >
            <div className="font-mono text-2xl font-semibold text-slate-50">
              {brief.totals.activeSanctioned}
            </div>
            <div className="mt-1 text-sm text-slate-200">Listed vessels active</div>
            <div className="text-xs text-slate-500">
              of {brief.totals.listedVessels.toLocaleString("en")} on the lists
            </div>
          </Link>
          {KINDS.map((kind) => (
            <Link
              key={kind}
              href={href(w, k === kind ? undefined : kind)}
              className={`rounded-md border p-3 transition ${
                k === kind
                  ? "border-slate-300 bg-slate-800/70"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
              }`}
            >
              <div
                className={`font-mono text-2xl font-semibold ${
                  kind === "sts" || kind === "dark"
                    ? brief.totals[kind] > 0
                      ? "text-red-300"
                      : "text-slate-500"
                    : kind === "loiter"
                      ? "text-amber-300"
                      : "text-sky-300"
                }`}
              >
                {brief.totals[kind]}
              </div>
              <div className="mt-1 text-sm text-slate-200">{SIGNAL_LABEL[kind]}</div>
              <div className="text-xs text-slate-500">{TILE_HINT[kind]}</div>
            </Link>
          ))}
        </section>

        {/* Navires à surveiller */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-50">
              Vessels to review
              {k ? (
                <span className="ml-2 text-sm font-normal text-slate-400">
                  with {SIGNAL_LABEL[k].toLowerCase()}
                </span>
              ) : null}
            </h2>
            <span className="text-xs text-slate-500">
              {vessels.length} of {vesselTotal} · highest risk first
            </span>
          </div>
          <div className="mt-3 overflow-x-auto rounded-md border border-slate-800">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Vessel</th>
                  <th className="px-3 py-2 font-medium">Lists</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium" title="Ship-to-ship meetings">STS</th>
                  <th className="px-3 py-2 text-right font-medium" title="AIS gaps">Gaps</th>
                  <th className="px-3 py-2 text-right font-medium" title="Loitering at sea">Loiter</th>
                  <th className="px-3 py-2 text-right font-medium" title="Chokepoint transits">Transits</th>
                  <th className="px-3 py-2 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {vessels.map((v) => (
                  <tr key={v.mmsi} className="hover:bg-slate-900/70">
                    <td className="px-3 py-2">
                      <VesselLink mmsi={v.mmsi} name={v.name} />
                      <div className="font-mono text-[11px] text-slate-500">
                        {v.imo ? `IMO ${v.imo}` : `MMSI ${v.mmsi}`}
                        {v.flag ? ` · ${v.flag}` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <ListBadges lists={v.lists} />
                    </td>
                    <td className="px-3 py-2 text-slate-400">{cargoLabel(v.cargoClass)}</td>
                    <Count n={v.counts.sts} hot />
                    <Count n={v.counts.dark} hot />
                    <Count n={v.counts.loiter} />
                    <Count n={v.counts.transit} />
                    <td className="px-3 py-2">
                      {v.lastSeen ? (
                        <>
                          <PlaceLink place={v.lastSeen.place} />
                          <div className="text-[11px] text-slate-500">
                            {fmtAgo(v.lastSeen.ts, now)}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {vessels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                      No listed vessel matches this filter in the last {w}.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {!showAll && vesselTotal > vessels.length ? (
            <Link
              href={href(w, k, true)}
              className="mt-2 inline-block text-sm text-sky-400 hover:text-sky-300"
            >
              Show all {vesselTotal} vessels →
            </Link>
          ) : null}
        </section>

        {/* Fil des signaux */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-50">Signals</h2>
            <span className="text-xs text-slate-500">
              most serious first · {events.length} shown
            </span>
          </div>
          <div className="mt-3 overflow-x-auto rounded-md border border-slate-800">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Signal</th>
                  <th className="px-3 py-2 font-medium">Vessel</th>
                  <th className="px-3 py-2 font-medium">With</th>
                  <th className="px-3 py-2 font-medium">Where</th>
                  <th className="px-3 py-2 font-medium">Started (UTC)</th>
                  <th className="px-3 py-2 text-right font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {events.map((e) => (
                  <tr key={e.key} className="hover:bg-slate-900/70">
                    <td className="px-3 py-2">
                      <KindBadge kind={e.kind} />
                    </td>
                    <td className="px-3 py-2">
                      <VesselLink mmsi={e.mmsi} name={e.name} sanctioned />
                    </td>
                    <td className="px-3 py-2">
                      {e.other ? (
                        <VesselLink
                          mmsi={e.other.mmsi}
                          name={e.other.name}
                          sanctioned={e.other.sanctioned}
                        />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <PlaceLink place={e.place} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">
                      {fmtUtc(e.ts)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-slate-300">
                      {fmtHours(e.durationH)}
                    </td>
                  </tr>
                ))}
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      No signal in the last {w}.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-slate-500">
          Signals are derived from AIS reception and public sanctions lists
          (OFAC SDN, UK Sanctions List, UN Security Council). Coverage depends
          on receiver density; the absence of a signal is not evidence of
          compliance. Click any vessel for its full record and connections.
        </p>
      </div>
    </main>
  );
}

function Count({ n, hot }: { n: number; hot?: boolean }) {
  return (
    <td
      className={`px-3 py-2 text-right font-mono ${
        n === 0
          ? "text-slate-700"
          : hot
            ? "font-semibold text-red-300"
            : "text-slate-200"
      }`}
    >
      {n}
    </td>
  );
}
