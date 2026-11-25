import Link from "next/link";
import type { VesselOutlook } from "@/lib/vessel-outlook";
import { fmtAgo, fmtHours, fmtUtc } from "./ui";
import { OutlookWatch } from "./OutlookWatch";

// Bandeau « Next » de la fiche navire : où va le navire et quand il arrive
// selon notre modèle, face à l'heure qu'il annonce lui-même, avec l'erreur
// typique mesurée du modèle sur ce port.

function dayName(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
}

export function Outlook({
  mmsi,
  o,
  typicalStayH,
  stayCalls,
}: {
  mmsi: number;
  o: VesselOutlook;
  typicalStayH: number | null;
  stayCalls: number;
}) {
  const portLink = (
    <Link href={`/ports/${o.portId}`} className="text-sky-300 hover:text-sky-200">
      {o.portName}
    </Link>
  );
  const diffH =
    o.predictedEta != null && o.broadcastEta != null ? (o.predictedEta - o.broadcastEta) / 3_600_000 : null;
  const likelyDeparture =
    o.state === "inPort" && o.arrivedTs != null && typicalStayH != null ? o.arrivedTs + typicalStayH * 3_600_000 : null;

  return (
    <section
      className="mt-4 rounded-md border border-sky-500/40 bg-gradient-to-r from-sky-500/[0.09] to-transparent p-4 print:hidden"
      aria-label="Next"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-sky-300">
            Next · live prediction
          </div>
          <div className="mt-1 text-[15px] font-semibold text-slate-50">
            {o.state === "inbound" ? (
              <>
                Heading to {portLink}
                {o.distanceNm != null ? (
                  <span className="font-normal text-slate-400">
                    {" "}
                    · {Math.round(o.distanceNm)} nm out{o.sog ? ` · ${o.sog.toFixed(1)} kn` : ""}
                  </span>
                ) : null}
              </>
            ) : o.state === "waiting" ? (
              <>
                Waiting off {portLink}
                <span className="font-normal text-slate-400"> · since {fmtUtc(o.startTs)} UTC</span>
              </>
            ) : (
              <>
                In port at {portLink}
                {o.arrivedTs ? (
                  <span className="font-normal text-slate-400"> · since {fmtUtc(o.arrivedTs)} UTC</span>
                ) : null}
              </>
            )}
          </div>

          {o.state !== "inPort" ? (
            <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-500">Our predicted arrival</dt>
                <dd className="font-mono text-lg font-semibold text-slate-50">
                  {o.predictedEta ? `${dayName(o.predictedEta)} ${fmtUtc(o.predictedEta)} UTC` : "—"}
                </dd>
                {o.predictedAt ? (
                  <dd className="text-[11px] text-slate-500">updated {fmtAgo(o.predictedAt)}</dd>
                ) : null}
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-500">Ship&apos;s own ETA</dt>
                <dd className="font-mono text-lg text-slate-300">
                  {o.broadcastEta ? `${dayName(o.broadcastEta)} ${fmtUtc(o.broadcastEta)} UTC` : "not broadcast"}
                </dd>
                {diffH != null && Math.abs(diffH) >= 1 ? (
                  <dd className="text-[11px] text-amber-300">
                    we expect it {fmtHours(Math.abs(diffH))} {diffH > 0 ? "later" : "earlier"}
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-500">Typical error here</dt>
                <dd className="font-mono text-lg text-slate-300">
                  {o.maeHours != null && o.maeCount >= 20 ? `± ${fmtHours(o.maeHours)}` : "—"}
                </dd>
                {o.maeHours != null && o.maeCount >= 20 ? (
                  <dd className="text-[11px] text-slate-500">
                    {o.maeCount} arrivals, last 30 days ·{" "}
                    <Link href="/precision" className="text-sky-400 hover:text-sky-300">
                      how we measure
                    </Link>
                  </dd>
                ) : null}
              </div>
            </dl>
          ) : likelyDeparture ? (
            <p className="mt-2 text-sm text-slate-300">
              Its last {stayCalls} calls here lasted about {fmtHours(typicalStayH)}: likely to sail around{" "}
              <span className="font-mono font-semibold text-slate-50">
                {dayName(likelyDeparture)} {fmtUtc(likelyDeparture)} UTC
              </span>
              .
            </p>
          ) : null}
        </div>
        <OutlookWatch mmsi={mmsi} inPort={o.state === "inPort"} />
      </div>
    </section>
  );
}
