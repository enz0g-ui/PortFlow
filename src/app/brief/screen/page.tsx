import type { Metadata } from "next";
import Link from "next/link";
import { parseQuery, screenVessels, EXPOSURE_DAYS, type Verdict } from "@/lib/screen";
import { ScreenBox } from "../ScreenBox";
import { cargoLabel, fmtAgo, ListBadges, PlaceLink, VesselLink } from "../ui";

export const metadata: Metadata = {
  title: "Fleet screening",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const VERDICT: Record<
  Verdict,
  { label: string; dot: string; row: string; text: string; help: string }
> = {
  sanctioned: {
    label: "Sanctioned",
    dot: "bg-red-500",
    row: "bg-red-500/[0.06]",
    text: "text-red-300",
    help: "On an official sanctions list",
  },
  exposed: {
    label: "Exposed",
    dot: "bg-amber-400",
    row: "bg-amber-400/[0.05]",
    text: "text-amber-300",
    help: `Not listed — but met a listed ship at sea (last ${EXPOSURE_DAYS} days)`,
  },
  clear: {
    label: "No alert",
    dot: "bg-emerald-400",
    row: "",
    text: "text-emerald-300",
    help: "Not listed, no contact with a listed ship",
  },
  unseen: {
    label: "Out of coverage",
    dot: "bg-slate-500",
    row: "",
    text: "text-slate-400",
    help: "Not listed; not seen by our receivers recently",
  },
  unknown: {
    label: "Not found",
    dot: "bg-slate-700",
    row: "",
    text: "text-slate-500",
    help: "Identifier not recognised",
  },
};

const ORDER: Verdict[] = ["sanctioned", "exposed", "clear", "unseen", "unknown"];

export default async function ScreenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const inputs = parseQuery(q);
  const { rows, at: now } = screenVessels(inputs);
  const sorted = rows
    .slice()
    .sort((a, b) => ORDER.indexOf(a.verdict) - ORDER.indexOf(b.verdict));
  const counts = Object.fromEntries(
    ORDER.map((v) => [v, rows.filter((r) => r.verdict === v).length]),
  ) as Record<Verdict, number>;

  return (
    <main className="min-h-screen bg-[#070b12] px-4 pb-24 pt-6 text-slate-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <Link href="/brief" className="text-sm text-sky-400 hover:text-sky-300">
          ← Briefing
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-50">Fleet screening</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sanctions lists (OFAC, UK, UN) plus what the lists don&apos;t tell you:
          ship-to-ship contact with listed vessels, from our own AIS detections.
        </p>

        <div className="mt-4 max-w-3xl">
          <ScreenBox initial={inputs.join("\n")} compact />
        </div>

        {rows.length === 0 ? (
          <p className="mt-8 text-slate-500">Enter at least one name, IMO or MMSI.</p>
        ) : (
          <>
            {/* Bilan */}
            <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {ORDER.map((v) => (
                <div
                  key={v}
                  className={`rounded-md border p-3 ${
                    counts[v] > 0 && (v === "sanctioned" || v === "exposed")
                      ? v === "sanctioned"
                        ? "border-red-500/50 bg-red-500/10"
                        : "border-amber-400/50 bg-amber-400/10"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <div className={`font-mono text-2xl font-semibold ${counts[v] > 0 ? VERDICT[v].text : "text-slate-600"}`}>
                    {counts[v]}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-200">
                    <span className={`inline-block h-2 w-2 rounded-full ${VERDICT[v].dot}`} />
                    {VERDICT[v].label}
                  </div>
                  <div className="text-[11px] leading-snug text-slate-500">{VERDICT[v].help}</div>
                </div>
              ))}
            </section>

            {/* Détail */}
            <div className="mt-6 overflow-x-auto rounded-md border border-slate-800">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Verdict</th>
                    <th className="px-3 py-2 font-medium">Vessel</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Why</th>
                    <th className="px-3 py-2 font-medium">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {sorted.map((r, i) => {
                    const v = VERDICT[r.verdict];
                    return (
                      <tr key={`${r.input}-${i}`} className={`${v.row} hover:bg-slate-900/70`}>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className={`flex items-center gap-2 font-medium ${v.text}`}>
                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${v.dot}`} />
                            {v.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {r.mmsi ? (
                            <VesselLink mmsi={r.mmsi} name={r.name} />
                          ) : (
                            <span className="text-slate-300">{r.name ?? r.input}</span>
                          )}
                          <div className="font-mono text-[11px] text-slate-500">
                            {r.imo ? `IMO ${r.imo}` : r.mmsi ? `MMSI ${r.mmsi}` : `“${r.input}”`}
                            {r.homonyms > 0 ? ` · ${r.homonyms} other ship(s) use this name` : ""}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">{cargoLabel(r.cargoClass)}</td>
                        <td className="px-3 py-2.5">
                          {r.verdict === "sanctioned" ? (
                            <span className="flex flex-wrap items-center gap-2">
                              <ListBadges lists={r.lists} />
                              {r.contacts.length > 0 ? (
                                <span className="text-xs text-slate-400">
                                  + met {r.contacts.length} listed ship{r.contacts.length > 1 ? "s" : ""}
                                </span>
                              ) : null}
                            </span>
                          ) : r.verdict === "exposed" ? (
                            <span className="text-xs text-amber-200">
                              Met{" "}
                              {r.contacts.slice(0, 3).map((c, j) => (
                                <span key={c.mmsi}>
                                  {j > 0 ? ", " : ""}
                                  <VesselLink mmsi={c.mmsi} name={c.name} sanctioned />
                                  <span className="text-slate-500"> ({c.lists.join("/")})</span>
                                </span>
                              ))}
                              {r.contacts.length > 3 ? ` +${r.contacts.length - 3}` : ""}
                              <span className="text-slate-500"> · last {fmtAgo(r.contacts[0].lastTs, now)}</span>
                            </span>
                          ) : r.verdict === "clear" && r.service ? (
                            <span className="text-xs text-slate-500">
                              Not listed · harbour / service craft, routine contacts not scored
                            </span>
                          ) : r.verdict === "clear" ? (
                            <span className="text-xs text-slate-500">
                              No listing · no contact with listed ships in {EXPOSURE_DAYS} days
                            </span>
                          ) : r.verdict === "unseen" ? (
                            <span className="text-xs text-slate-500">
                              Not listed · outside our receiver coverage, no history available
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Check spelling, or use the 7-digit IMO number
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {r.lastSeen ? (
                            <>
                              <PlaceLink place={r.lastSeen.place} />
                              <div className="text-[11px] text-slate-500">{fmtAgo(r.lastSeen.ts, now)}</div>
                            </>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-md border border-sky-800/60 bg-sky-950/40 px-4 py-3 text-sm">
              <span className="text-slate-200">
                Want to know the moment one of these ships meets a listed vessel or goes dark?
              </span>
              <Link
                href="/sign-up?from=screen"
                className="rounded-md bg-sky-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-sky-400"
              >
                Watch this fleet — free
              </Link>
            </div>

            <p className="mt-6 max-w-3xl text-xs leading-relaxed text-slate-500">
              Matching uses IMO first, then MMSI, then exact name. Contact
              detection relies on AIS reception and covers the areas we monitor;
              the absence of a signal is not evidence of compliance.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
