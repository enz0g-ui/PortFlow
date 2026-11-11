import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TIER_LABEL } from "@/lib/brief";
import { getPairEvidence, type PairEvidence } from "@/lib/screen";
import { BriefBar } from "../../../BriefBar";
import { TrackMap, type TrackLine, type TrackMarker } from "../../../TrackMap";
import { cargoLabel, fmtDate, fmtHours, fmtUtc, KindBadge, ListBadges, PlaceLink } from "../../../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact evidence",
  robots: { index: false, follow: false },
};

const okMmsi = (n: number) => Number.isInteger(n) && n >= 100_000_000 && n <= 999_999_999;

const COLOR_A = "#6cc4f7";
const COLOR_B = "#f5b942";

function Side({ s, color }: { s: PairEvidence["a"]; color: string }) {
  return (
    <Link
      href={`/brief/vessel/${s.mmsi}`}
      className="block min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-600"
    >
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <span className={`truncate font-semibold ${s.name ? "text-slate-50" : "italic text-slate-300"}`}>
          {s.name ?? "Unidentified vessel"}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-mono">MMSI {s.mmsi}</span>
        <span>{cargoLabel(s.cargoClass)}</span>
        {s.flag ? <span>{s.flag}</span> : null}
        {s.lists.length ? <ListBadges lists={s.lists} /> : <span>not listed</span>}
      </div>
    </Link>
  );
}

export default async function ContactEvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ a: string; b: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const a = Number(p.a);
  const b = Number(p.b);
  if (!okMmsi(a) || !okMmsi(b) || a === b) notFound();
  const e = typeof sp.e === "string" && /^\d+$/.test(sp.e) ? Number(sp.e) : undefined;

  const ev = getPairEvidence(a, b, e);
  if (ev.encounters.length === 0) notFound();
  const sel = ev.selected ?? ev.encounters[0];

  const nameA = ev.a.name ?? `MMSI ${a}`;
  const nameB = ev.b.name ?? `MMSI ${b}`;
  const trackA = ev.tracks.find((t) => t.mmsi === a);
  const trackB = ev.tracks.find((t) => t.mmsi === b);
  const lines: TrackLine[] = [
    trackA ? { label: nameA, color: COLOR_A, points: trackA.points.map(([lon, lat]) => [lon, lat] as [number, number]) } : null,
    trackB ? { label: nameB, color: COLOR_B, points: trackB.points.map(([lon, lat]) => [lon, lat] as [number, number]) } : null,
  ].filter((x): x is TrackLine => x !== null && x.points.length >= 2);
  const markers: TrackMarker[] = [{ lon: sel.lon, lat: sel.lat, color: "#ef6a75", label: "Meeting point" }];
  const noTracks = lines.length === 0;

  const facts: Array<[string, string]> = [
    ["Start (UTC)", fmtUtc(sel.startTs) + " " + new Date(sel.startTs).getUTCFullYear()],
    ["End (UTC)", sel.endTs ? fmtUtc(sel.endTs) : "ongoing"],
    ["Duration", fmtHours(sel.durationH)],
    ["Typical distance", sel.medianDistanceM != null ? `${Math.round(sel.medianDistanceM)} m` : "—"],
    ["Where", sel.place.label],
    ["Position", `${sel.lat.toFixed(3)}, ${sel.lon.toFixed(3)}`],
  ];

  return (
    <main className="min-h-screen bg-[#070b12] px-4 pb-24 pt-5 text-slate-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <BriefBar
          crumbs={[
            { label: nameA, href: `/brief/vessel/${a}` },
            { label: `Contact with ${nameB}`, href: "#" },
          ]}
        />

        <h1 className="mt-4 flex flex-wrap items-center gap-3 text-2xl font-semibold text-slate-50">
          Contact at sea
          <KindBadge kind="sts" tier={sel.tier} />
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {sel.tier === "transfer" ? "Long, very close contact — consistent with a transfer" : sel.tier === "contact" ? "Close contact — to check" : TIER_LABEL[sel.tier]} · {ev.encounters.length} recorded meeting{ev.encounters.length > 1 ? "s" : ""} between
          these two ships
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Side s={ev.a} color={COLOR_A} />
          <Side s={ev.b} color={COLOR_B} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <TrackMap lines={lines} markers={markers} height={420} zoom={11} />
            <p className="mt-2 text-[11px] text-slate-500">
              AIS tracks from shortly before to shortly after the meeting.{" "}
              {noTracks ? "No detailed track kept for this period — meeting point only." : ""}
            </p>
          </section>

          <aside className="space-y-5">
            <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">This meeting</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {facts.map(([k, v]) => (
                  <div key={k} className={k === "Where" ? "col-span-2" : ""}>
                    <dt className="text-[11px] text-slate-500">{k}</dt>
                    <dd className="text-slate-200">{k === "Where" ? <PlaceLink place={sel.place} /> : v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">All meetings</h2>
              <ul className="mt-2 max-h-[340px] divide-y divide-slate-800/80 overflow-y-auto">
                {ev.encounters.map((x) => (
                  <li key={x.id}>
                    <Link
                      href={`/brief/contact/${a}/${b}?e=${x.id}`}
                      className={`flex items-center gap-2 rounded px-1 py-1.5 text-sm ${
                        x.id === sel.id ? "bg-slate-800/80" : "hover:bg-slate-900/80"
                      }`}
                    >
                      <span className="w-[78px] font-mono text-[11px] text-slate-400">{fmtDate(x.startTs)}</span>
                      <KindBadge kind="sts" tier={x.tier} />
                      <span className="ml-auto font-mono text-[11px] text-slate-400">{fmtHours(x.durationH)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-[11px] leading-relaxed text-slate-500">
              Detected from AIS positions received by our network. A close, long contact is consistent with a
              ship-to-ship transfer but does not prove one; use it as a lead for your own checks.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
