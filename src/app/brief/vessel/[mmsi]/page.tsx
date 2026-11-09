import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVesselSheet } from "@/lib/brief";
import {
  cargoLabel,
  fmtAgo,
  fmtDate,
  fmtHours,
  fmtUtc,
  KindBadge,
  ListBadges,
  PlaceLink,
  VesselLink,
} from "../../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vessel record",
  robots: { index: false, follow: false },
};

export default async function VesselRecordPage({
  params,
}: {
  params: Promise<{ mmsi: string }>;
}) {
  const { mmsi: raw } = await params;
  const mmsi = Number(raw);
  if (!Number.isInteger(mmsi) || mmsi < 100_000_000 || mmsi > 999_999_999) {
    notFound();
  }
  const v = getVesselSheet(mmsi);
  if (!v) notFound();
  const now = v.generatedAt;
  const listed = v.sanctions.length > 0;
  const lists = [...new Set(v.sanctions.map((s) => s.list))].sort();

  const facts: Array<[string, string]> = [
    ["IMO", v.imo ? String(v.imo) : "—"],
    ["MMSI", String(v.mmsi)],
    ["Flag (list)", v.flag ?? "—"],
    ["Type", cargoLabel(v.cargoClass)],
    ["Length", v.lengthM ? `${Math.round(v.lengthM)} m` : "—"],
    ["Draught", v.draught ? `${v.draught.toFixed(1)} m` : "—"],
    ["Call sign", v.callsign ?? "—"],
    ["AIS destination", v.destination ?? "—"],
  ];

  return (
    <main className="min-h-screen bg-[#070b12] px-4 pb-24 pt-6 text-slate-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <Link href="/brief" className="text-sm text-sky-400 hover:text-sky-300">
          ← Briefing
        </Link>

        {/* Identité + verdict */}
        <header className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              {v.name || `MMSI ${v.mmsi}`}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {v.imo ? `IMO ${v.imo} · ` : ""}MMSI {v.mmsi}
            </p>
          </div>
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              listed
                ? "border-red-500/50 bg-red-500/10 text-red-200"
                : "border-emerald-600/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {listed ? (
              <span className="flex items-center gap-2">
                <span className="font-semibold">Sanctioned</span>
                <ListBadges lists={lists} />
              </span>
            ) : (
              <span>Not on OFAC, UK or UN vessel lists</span>
            )}
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Colonne principale */}
          <div className="space-y-6">
            {/* Résumé chiffré */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Ship-to-ship" n={v.counts.sts} hot />
              <Stat label="AIS gaps" n={v.counts.dark} hot />
              <Stat label="Loitering" n={v.counts.loiter} />
              <Stat label="Transits" n={v.counts.transit} />
              <Stat label="Port calls" n={v.counts.port} />
            </section>
            <p className="-mt-3 text-xs text-slate-500">Last {v.windowDays} days</p>

            {/* Chronologie */}
            <section>
              <h2 className="text-lg font-semibold text-slate-50">Timeline</h2>
              <div className="mt-3 overflow-x-auto rounded-md border border-slate-800">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">When (UTC)</th>
                      <th className="px-3 py-2 font-medium">Event</th>
                      <th className="px-3 py-2 font-medium">Where</th>
                      <th className="px-3 py-2 font-medium">With</th>
                      <th className="px-3 py-2 text-right font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {v.timeline.slice(0, 150).map((t) => (
                      <tr key={t.key} className="hover:bg-slate-900/70">
                        <td className="px-3 py-2 font-mono text-xs text-slate-400">
                          {fmtUtc(t.ts)}
                        </td>
                        <td className="px-3 py-2">
                          <KindBadge kind={t.kind} />
                        </td>
                        <td className="px-3 py-2">
                          <PlaceLink place={t.place} />
                        </td>
                        <td className="px-3 py-2">
                          {t.other ? (
                            <VesselLink
                              mmsi={t.other.mmsi}
                              name={t.other.name}
                              sanctioned={t.other.sanctioned}
                            />
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-slate-300">
                          {fmtHours(t.durationH)}
                        </td>
                      </tr>
                    ))}
                    {v.timeline.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                          No recorded event in the last {v.windowDays} days.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              {v.timeline.length > 150 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Showing the 150 most recent of {v.timeline.length} events.
                </p>
              ) : null}
            </section>

            {/* Sanctions */}
            {listed ? (
              <section>
                <h2 className="text-lg font-semibold text-slate-50">Sanctions listings</h2>
                <div className="mt-3 divide-y divide-slate-800 rounded-md border border-slate-800">
                  {v.sanctions.map((s, i) => (
                    <div key={i} className="p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <ListBadges lists={[s.list]} />
                        {s.regime ? (
                          <span className="text-slate-200">{s.regime}</span>
                        ) : null}
                        {s.listedOn ? (
                          <span className="text-xs text-slate-500">
                            listed {fmtDate(s.listedOn)}
                          </span>
                        ) : null}
                        {s.name && s.name !== v.name ? (
                          <span className="text-xs text-slate-500">as “{s.name}”</span>
                        ) : null}
                      </div>
                      {s.reason ? (
                        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-400">
                          {s.reason}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Colonne latérale : identité + relations */}
          <aside className="space-y-5">
            <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Last known position
              </h2>
              {v.lastSeen ? (
                <div className="mt-2">
                  <div className="text-base text-slate-100">
                    <PlaceLink place={v.lastSeen.place} />
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtAgo(v.lastSeen.ts, now)} · {fmtUtc(v.lastSeen.ts)} UTC
                    {v.lastSeen.sog != null ? ` · ${v.lastSeen.sog.toFixed(1)} kn` : ""}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Not seen recently.</p>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {facts.map(([k, val]) => (
                  <div key={k}>
                    <dt className="text-[11px] text-slate-500">{k}</dt>
                    <dd className="truncate text-slate-200" title={val}>
                      {val}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Ships met at sea
              </h2>
              {v.counterparts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">None recorded.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-800/80">
                  {v.counterparts.slice(0, 20).map((c) => (
                    <li key={c.mmsi} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <VesselLink mmsi={c.mmsi} name={c.name} sanctioned={c.sanctioned} />
                      <span className="shrink-0 font-mono text-[11px] text-slate-500">
                        {c.meetings}× · {fmtHours(c.totalHours)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Port calls (tracked ports)
              </h2>
              {v.ports.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">None in the last {v.windowDays} days.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-800/80">
                  {v.ports.map((p) => (
                    <li key={p.portId} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <PlaceLink place={{ label: p.portName, portId: p.portId }} />
                      <span className="font-mono text-[11px] text-slate-500">
                        {p.calls}× · last {p.lastArrived ? fmtDate(p.lastArrived) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, n, hot }: { label: string; n: number; hot?: boolean }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
      <div
        className={`font-mono text-xl font-semibold ${
          n === 0 ? "text-slate-600" : hot ? "text-red-300" : "text-slate-100"
        }`}
      >
        {n}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
