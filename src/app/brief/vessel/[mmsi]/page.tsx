import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  getVesselSheet,
  staticFor,
  summarize,
  WINDOW_DAYS,
  type Exposure,
  type TimelineItem,
  type VesselSheet,
} from "@/lib/brief";
import { getNetwork } from "@/lib/screen";
import { CopyButton } from "../../../components/CopyButton";
import { BriefBar } from "../../BriefBar";
import { Network } from "../../Network";
import { TrackMap } from "../../TrackMap";
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

type Filter = "all" | "sts" | "dark" | "loiter" | "transit" | "port";
const FILTERS: Filter[] = ["all", "sts", "dark", "loiter", "transit", "port"];
const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  sts: "Contacts",
  dark: "AIS gaps",
  loiter: "Loitering",
  transit: "Transits",
  port: "Port calls",
};

const VERDICT: Record<Exposure, { title: string; cls: string }> = {
  listed: { title: "Sanctioned", cls: "border-red-500/50 bg-red-500/10 text-red-100" },
  exposed: { title: "Exposed", cls: "border-amber-400/50 bg-amber-400/10 text-amber-100" },
  clear: { title: "No alert", cls: "border-emerald-600/40 bg-emerald-500/10 text-emerald-100" },
  service: { title: "Service craft", cls: "border-slate-600 bg-slate-800/60 text-slate-200" },
  unassessed: { title: "Not assessed", cls: "border-slate-600 bg-slate-800/60 text-slate-200" },
};

function verdictDetail(v: VesselSheet): React.ReactNode {
  switch (v.exposure) {
    case "listed":
      return <ListBadges lists={[...new Set(v.sanctions.map((s) => s.list))].sort()} />;
    case "exposed": {
      const n = v.listedContacts.length;
      const transfer = v.listedContacts.some((c) => c.best === "transfer");
      return (
        <span>
          not listed, but {transfer ? "probable transfer with" : "met at sea"} {n} listed ship
          {n > 1 ? "s" : ""}
        </span>
      );
    }
    case "clear":
      return <span>not listed · no contact at sea with a listed ship</span>;
    case "service":
      return <span>harbour / service craft · contacts not scored</span>;
    case "unassessed":
      return <span>identity incomplete · exposure not scored</span>;
  }
}

interface Group {
  key: string;
  items: TimelineItem[];
}

// Regroupe les répétitions consécutives (même type, même lieu). Les contacts
// en mer et les coupures AIS restent toujours visibles un par un.
function groupTimeline(items: TimelineItem[]): Group[] {
  const out: Group[] = [];
  for (const it of items) {
    const last = out[out.length - 1];
    const groupable =
      it.kind === "loiter" || it.kind === "transit" || it.kind === "port" || it.tier === "port";
    const placeKey = it.place.label.split(" · ")[0];
    if (
      groupable &&
      last &&
      last.items[0].kind === it.kind &&
      last.items[0].tier === it.tier &&
      last.items[0].place.label.split(" · ")[0] === placeKey
    ) {
      last.items.push(it);
    } else {
      out.push({ key: it.key, items: [it] });
    }
  }
  return out;
}

export default async function VesselRecordPage({
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
  const filter: Filter = FILTERS.includes(sp.k as Filter) ? (sp.k as Filter) : "all";
  const trail = (typeof sp.t === "string" ? sp.t.split(",") : [])
    .map(Number)
    .filter((m) => Number.isInteger(m) && m >= 100_000_000 && m <= 999_999_999 && m !== mmsi)
    .slice(-5);

  const v = getVesselSheet(mmsi, days);
  if (!v) notFound();
  const net = getNetwork(mmsi, days);
  const summary = summarize(v, net.twoStepListed);
  const now = v.generatedAt;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "portflow.uk";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("192.") || host.startsWith("localhost") ? "http" : "https");
  const shareUrl = `${proto}://${host}/brief/vessel/${mmsi}${days !== 90 ? `?d=${days}` : ""}`;

  const trailStat = staticFor(trail);
  const crumbs = [
    ...trail.map((m, i) => ({
      label: trailStat.get(m)?.name?.trim() || `MMSI ${m}`,
      href: `/brief/vessel/${m}${i > 0 ? `?t=${trail.slice(0, i).join(",")}` : ""}`,
    })),
    { label: v.name ?? `MMSI ${mmsi}`, href: "#" },
  ];

  const qs = (over: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    if (trail.length) p.set("t", trail.join(","));
    if (days !== 90) p.set("d", String(days));
    if (filter !== "all") p.set("k", filter);
    for (const [k, val] of Object.entries(over)) {
      if (val === null) p.delete(k);
      else p.set(k, String(val));
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const allTiles: Array<{ k: Filter; label: string; n: number; sub?: string; hot?: boolean }> = [
    {
      k: "sts",
      label: "Contacts at sea",
      n: v.counts.contacts,
      sub: v.counts.contacts
        ? `with ${v.counts.contactShips} ship${v.counts.contactShips > 1 ? "s" : ""}${
            v.counts.transfers
              ? ` · ${v.counts.transfers} probable transfer${v.counts.transfers > 1 ? "s" : ""}`
              : ""
          }`
        : undefined,
      hot: v.listedContacts.length > 0 || v.counts.transfers > 0,
    },
    { k: "dark", label: "AIS gaps", n: v.counts.dark, hot: true },
    { k: "loiter", label: "Loitering", n: v.counts.loiter },
    { k: "transit", label: "Strait transits", n: v.counts.transit },
    { k: "port", label: "Port calls", n: v.counts.port },
  ];
  const tiles = allTiles.filter((t) => t.n > 0);

  const filtered = v.timeline.filter((t) => (filter === "all" ? true : t.kind === filter));
  const groups = groupTimeline(filtered);
  const keyEvents = v.timeline
    .filter(
      (t) =>
        (t.kind === "sts" && t.tier !== "port" && (t.other?.sanctioned || t.tier === "transfer")) ||
        t.kind === "dark",
    )
    .slice(0, 8);

  const facts: Array<[string, string]> = [
    ["IMO", v.imo ? String(v.imo) : "—"],
    ["MMSI", String(v.mmsi)],
    ["Flag", v.flag ? `${v.flag} (list)` : v.midFlag ? `${v.midFlag.country} (from MMSI)` : "—"],
    ["Type", cargoLabel(v.cargoClass)],
    ["Length", v.lengthM ? `${Math.round(v.lengthM)} m` : "—"],
    ["Draught", v.draught ? `${v.draught.toFixed(1)} m` : "—"],
    ["Call sign", v.callsign ?? "—"],
    ["AIS destination", v.destination ?? "—"],
  ];
  const verdict = VERDICT[v.exposure];
  const ls = v.lastSeen;

  return (
    <main className="min-h-screen bg-[#070b12] px-4 pb-24 pt-5 text-slate-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <BriefBar crumbs={crumbs} />

        {/* Identité + verdict + actions */}
        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1
              className={`text-2xl font-semibold ${v.identified ? "text-slate-50" : "italic text-slate-300"}`}
            >
              {v.name ?? "Unidentified vessel"}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {v.imo ? `IMO ${v.imo} · ` : ""}MMSI {v.mmsi}
              {v.midFlag ? ` · ${v.midFlag.country} flag (from MMSI)` : ""}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className={`rounded-md border px-4 py-2 text-sm ${verdict.cls}`}>
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{verdict.title}</span>
                {verdictDetail(v)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Link
                href={`/sign-up?from=watch&mmsi=${v.mmsi}`}
                className="rounded-md border border-sky-600/60 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-500/20"
              >
                ◉ Alert me on new contacts or AIS gaps
              </Link>
              <Link
                href={`/brief/vessel/${v.mmsi}/report${days !== 90 ? `?d=${days}` : ""}`}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
              >
                Report (PDF)
              </Link>
              <CopyButton
                text={shareUrl}
                label="Copy link"
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
              />
            </div>
          </div>
        </header>

        {/* Conclusion en une phrase + période */}
        <section className="mt-4 flex flex-col gap-3 rounded-md border border-slate-700/80 bg-slate-900/70 p-4 sm:flex-row sm:items-start">
          <p className="flex-1 text-[15px] leading-relaxed text-slate-100">{summary}</p>
          <div className="flex shrink-0 items-center gap-2">
            <nav className="flex rounded-md border border-slate-700 p-0.5 font-mono text-[11px]" aria-label="Period">
              {WINDOW_DAYS.map((d) => (
                <Link
                  key={d}
                  href={`/brief/vessel/${mmsi}${qs({ d: d === 90 ? null : d })}`}
                  className={`rounded px-2 py-1 ${
                    d === days ? "bg-slate-200 font-semibold text-slate-900" : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {d}d
                </Link>
              ))}
            </nav>
            <CopyButton text={summary} label="Copy" />
          </div>
        </section>

        <div className="pfg mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            {/* Chiffres : seulement ce qui existe ; chacun filtre la chronologie */}
            {tiles.length > 0 ? (
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {tiles.map((t) => (
                  <Link
                    key={t.k}
                    href={`/brief/vessel/${mmsi}${qs({ k: filter === t.k ? null : t.k })}#timeline`}
                    className={`rounded-md border p-3 transition ${
                      filter === t.k
                        ? "border-slate-300 bg-slate-800/70"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                    }`}
                  >
                    <div className={`font-mono text-xl font-semibold ${t.hot ? "text-red-300" : "text-slate-100"}`}>
                      {t.n}
                    </div>
                    <div className="text-xs text-slate-300">{t.label}</div>
                    {t.sub ? <div className="text-[11px] text-slate-500">{t.sub}</div> : null}
                  </Link>
                ))}
              </section>
            ) : (
              <p className="text-sm text-slate-500">No recorded activity in the last {days} days.</p>
            )}

            {/* Toile */}
            <section>
              <h2 className="text-lg font-semibold text-slate-50">Connections</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Ships met side by side at sea, and ports called, last {days} days. Hover a ship to find it in the
                list; click to open its record.
              </p>
              <div className="mt-3">
                {net.nodes.length > 1 ? (
                  <Network net={net} trail={trail} query={days !== 90 ? `d=${days}` : ""} />
                ) : (
                  <p className="rounded-md border border-slate-800 p-4 text-sm text-slate-500">
                    No contact at sea or port call recorded in our coverage.
                    {net.portHidden > 0 ? ` (${net.portHidden} same-port contacts left out.)` : ""}
                  </p>
                )}
              </div>
            </section>

            {/* Événements clés */}
            {keyEvents.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-slate-50">Key events</h2>
                <div className="mt-3 divide-y divide-slate-800/80 rounded-md border border-red-500/30 bg-red-500/[0.03]">
                  {keyEvents.map((t) => (
                    <TimelineRow key={t.key} t={t} self={mmsi} />
                  ))}
                </div>
              </section>
            ) : null}

            {/* Chronologie */}
            <section id="timeline">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-50">Timeline</h2>
                <nav className="flex flex-wrap gap-1 text-[11px]" aria-label="Filter timeline">
                  {FILTERS.map((f) => (
                    <Link
                      key={f}
                      href={`/brief/vessel/${mmsi}${qs({ k: f === "all" ? null : f })}#timeline`}
                      className={`rounded border px-2 py-0.5 ${
                        f === filter
                          ? "border-slate-300 bg-slate-200 text-slate-900"
                          : "border-slate-700 text-slate-400 hover:text-slate-100"
                      }`}
                    >
                      {FILTER_LABEL[f]}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="mt-3 divide-y divide-slate-800/80 rounded-md border border-slate-800">
                {groups.slice(0, 120).map((g) =>
                  g.items.length === 1 ? (
                    <TimelineRow key={g.key} t={g.items[0]} self={mmsi} />
                  ) : (
                    <details key={g.key} className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm hover:bg-slate-900/70">
                        <span className="w-[92px] font-mono text-xs text-slate-400">
                          {fmtUtc(g.items[g.items.length - 1].ts).slice(0, 5)}–{fmtUtc(g.items[0].ts).slice(0, 5)}
                        </span>
                        <KindBadge kind={g.items[0].kind} tier={g.items[0].tier} />
                        <span className="font-mono text-xs text-slate-300">×{g.items.length}</span>
                        <PlaceLink place={g.items[0].place} />
                        <span className="ml-auto font-mono text-xs text-slate-500">
                          total {fmtHours(g.items.reduce((s, x) => s + (x.durationH ?? 0), 0))}
                          <span className="ml-2 text-sky-400 group-open:hidden">show ▾</span>
                          <span className="ml-2 hidden text-sky-400 group-open:inline">hide ▴</span>
                        </span>
                      </summary>
                      <div className="divide-y divide-slate-800/60 bg-slate-950/50">
                        {g.items.map((t) => (
                          <TimelineRow key={t.key} t={t} self={mmsi} />
                        ))}
                      </div>
                    </details>
                  ),
                )}
                {groups.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">Nothing recorded for this filter.</p>
                ) : null}
              </div>
            </section>

            {/* Sanctions */}
            {v.sanctions.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-slate-50">Sanctions listings</h2>
                <div className="mt-3 divide-y divide-slate-800 rounded-md border border-slate-800">
                  {v.sanctions.map((s, i) => (
                    <div key={i} className="p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <ListBadges lists={[s.list]} />
                        {s.regime ? <span className="text-slate-200">{s.regime}</span> : null}
                        {s.listedOn ? (
                          <span className="text-xs text-slate-500">listed {fmtDate(s.listedOn)}</span>
                        ) : null}
                        {s.name && s.name !== v.name ? (
                          <span className="text-xs text-slate-500">as “{s.name}”</span>
                        ) : null}
                      </div>
                      {s.reason ? (
                        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-400">{s.reason}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Colonne latérale */}
          <aside className="space-y-5">
            <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Last known position</h2>
              {ls ? (
                <div className="mt-2">
                  <div className="text-base text-slate-100">
                    <PlaceLink place={ls.place} />
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtAgo(ls.ts, now)} · {fmtUtc(ls.ts)} UTC
                    {ls.sog != null ? ` · ${ls.sog.toFixed(1)} kn` : ""}
                  </div>
                  {ls.place.lat != null && ls.place.lon != null ? (
                    <div className="mt-3">
                      <TrackMap
                        height={180}
                        zoom={7}
                        markers={[
                          {
                            lon: ls.place.lon,
                            lat: ls.place.lat,
                            color: v.exposure === "listed" ? "#ef6a75" : "#6cc4f7",
                            label: v.name ?? `MMSI ${v.mmsi}`,
                          },
                        ]}
                      />
                    </div>
                  ) : null}
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
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Ships met at sea</h2>
              {v.counterparts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">None recorded.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-800/80">
                  {v.counterparts.slice(0, 25).map((c) => (
                    <li
                      key={c.mmsi}
                      data-m={c.mmsi}
                      className="flex items-center justify-between gap-2 rounded px-1 py-1.5 text-sm transition-colors"
                    >
                      <span className={`min-w-0 truncate ${c.identified ? "" : "italic opacity-70"}`}>
                        <VesselLink
                          mmsi={c.mmsi}
                          name={c.name ?? "Unidentified vessel"}
                          sanctioned={c.sanctioned}
                        />
                      </span>
                      <Link
                        href={`/brief/contact/${mmsi}/${c.mmsi}?e=${c.lastEncounterId}`}
                        title="Open the evidence"
                        className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-slate-500 hover:text-sky-300"
                      >
                        <KindBadge kind="sts" tier={c.best} />
                        {c.meetings}× · {fmtHours(c.totalHours)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {v.portContacts > 0 || v.serviceContacts > 0 ? (
                <p className="mt-2 text-[11px] leading-snug text-slate-500">
                  Left out:{" "}
                  {[
                    v.portContacts > 0 ? `${v.portContacts} same-port contacts` : null,
                    v.serviceContacts > 0 ? `${v.serviceContacts} tugs / pilots / service craft` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </section>

            {v.ports.length > 0 ? (
              <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
                <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Port calls (tracked ports)
                </h2>
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
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function TimelineRow({ t, self }: { t: TimelineItem; self: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm hover:bg-slate-900/70">
      <span className="w-[92px] font-mono text-xs text-slate-400">{fmtUtc(t.ts)}</span>
      <KindBadge kind={t.kind} tier={t.tier} />
      <span className="min-w-0">
        <PlaceLink place={t.place} />
      </span>
      {t.other ? (
        <span className="min-w-0 text-slate-400">
          with{" "}
          <VesselLink
            mmsi={t.other.mmsi}
            name={t.other.name ?? "Unidentified vessel"}
            sanctioned={t.other.sanctioned}
          />
        </span>
      ) : null}
      <span className="ml-auto flex items-center gap-3 font-mono text-xs text-slate-300">
        {fmtHours(t.durationH)}
        {t.kind === "sts" && t.other && t.encounterId ? (
          <Link
            href={`/brief/contact/${self}/${t.other.mmsi}?e=${t.encounterId}`}
            className="text-sky-400 hover:text-sky-300"
          >
            evidence →
          </Link>
        ) : null}
      </span>
    </div>
  );
}
