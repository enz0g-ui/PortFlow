import type { Metadata } from "next";
import Link from "next/link";
import { Attributions } from "../components/Attributions";
import { DemoButton } from "../components/DemoButton";
import { getVoyageAccuracy } from "@/lib/voyages";
import { getPort, DEFAULT_PORT_ID } from "@/lib/ports";

// Server-rendered so the published benchmark is in the HTML — indexable by
// Google and visible in link previews. Previously a client component, which
// meant crawlers saw only the word "RMSE". This is our strongest sales proof;
// it now ships in the server response.
export const dynamic = "force-dynamic";

const MIN_BASELINE_N = 20;
const WINDOWS = [7, 30, 90] as const;

export const metadata: Metadata = {
  title: "ETA accuracy benchmark — predicted vs broadcast",
  description:
    "Port Flow publishes the accuracy of its predicted vessel ETAs against the ship's own broadcast ETA, measured on closed voyages (RMSE + MAE). The number, good or bad — not a marketing claim.",
  alternates: { canonical: "https://portflow.uk/precision" },
  robots: { index: true, follow: true },
};

function fmtH(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(digits)} h`;
}

function fmtTs(ts?: number | null): string {
  if (!ts) return "—";
  return (
    new Date(ts).toLocaleString([], {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

function errTone(err: number | null | undefined): string {
  if (err === null || err === undefined) return "text-slate-500";
  const a = Math.abs(err);
  if (a < 1) return "text-emerald-300";
  if (a < 3) return "text-amber-300";
  return "text-rose-300";
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-slate-100";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-5 py-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-3xl font-semibold tabular-nums ${color}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default async function PrecisionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const portParam = typeof sp.port === "string" ? sp.port : "";
  const portId = getPort(portParam) ? portParam : DEFAULT_PORT_ID;
  const daysParam = typeof sp.days === "string" ? Number(sp.days) : 30;
  const days = (WINDOWS as readonly number[]).includes(daysParam) ? daysParam : 30;

  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const data = getVoyageAccuracy(portId, since);
  const port = getPort(portId);
  const portLabel = port?.name ?? portId.charAt(0).toUpperCase() + portId.slice(1);

  const rmse = data.rmseHours;
  const baseline = data.baselineRmseHours;
  const baselineN = data.baselineCount ?? 0;
  const excluded = data.baselineExcluded ?? 0;
  const baselineMeaningful = baselineN >= MIN_BASELINE_N;
  const ourOnSet = baselineMeaningful
    ? (data.modelRmseOnBaselineHours ?? rmse)
    : rmse;
  const delta =
    ourOnSet !== null && baseline !== null && baselineMeaningful
      ? ((ourOnSet - baseline) / baseline) * 100
      : null;
  const beats = delta !== null && delta < 0;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/app" className="text-xs text-slate-400 hover:text-slate-200">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            Window:
            {WINDOWS.map((d) => (
              <Link
                key={d}
                href={`/precision?port=${portId}&days=${d}`}
                className={`ml-2 rounded px-2 py-0.5 ${
                  days === d
                    ? "bg-sky-500/20 text-sky-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {d}d
              </Link>
            ))}
          </span>
          <span className="[&>button]:!px-3 [&>button]:!py-1">
            <DemoButton />
          </span>
        </div>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          ETA accuracy benchmark ·{" "}
          <span className="text-sky-400">
            {port?.flag ? `${port.flag} ` : ""}
            {portLabel}
          </span>
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          How Port Flow&apos;s predicted ETA compares to each vessel&apos;s own
          broadcast ETA at {portLabel}, measured on closed voyages over the last{" "}
          {days} days. We publish the number — good or bad. Lower error is better.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="Port Flow predicted ETA (RMSE)"
          value={fmtH(baselineMeaningful ? ourOnSet : rmse)}
          tone={beats ? "good" : "warn"}
          hint={`MAE ${fmtH(data.maeHours)} · ${data.count} voyages`}
        />
        <Stat
          label="Broadcast ETA (RMSE)"
          value={baselineMeaningful ? fmtH(baseline) : "Building…"}
          hint={
            baselineMeaningful
              ? `crew-declared, ${baselineN} voyages (same set)`
              : `only ${baselineN} comparable voyages so far (need ${MIN_BASELINE_N})`
          }
        />
        <Stat
          label={beats ? "Our advantage" : "Gap"}
          value={delta !== null ? `${Math.abs(delta).toFixed(1)} %` : "—"}
          tone={delta === null ? "default" : beats ? "good" : "warn"}
          hint={
            delta === null
              ? "benchmark builds as more voyages close"
              : beats
                ? "lower error than the broadcast ETA"
                : "higher error than the broadcast ETA"
          }
        />
      </section>

      {baselineMeaningful ? (
        <p className="-mt-4 text-xs text-slate-500">
          Broadcast ETAs more than 7 days from the actual arrival are excluded as
          AIS sentinel / placeholder values ({excluded} excluded). Both figures
          are computed on the same remaining voyage set — apples to apples.
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Closed voyages
          </h2>
          <span className="text-xs text-slate-500">
            error = predicted/broadcast minus actual arrival (hours)
          </span>
        </div>
        {data.voyages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr className="text-left">
                  <th className="py-1 pr-3 font-normal">MMSI</th>
                  <th className="py-1 pr-3 font-normal">Cargo</th>
                  <th className="py-1 pr-3 font-normal">Arrival</th>
                  <th className="py-1 pr-3 text-right font-normal">Our error</th>
                  <th className="py-1 pr-3 text-right font-normal">Broadcast error</th>
                </tr>
              </thead>
              <tbody>
                {data.voyages.slice(0, 50).map((v) => {
                  const ourErr = v.predicted_eta
                    ? (v.predicted_eta - (v.arrived_ts ?? 0)) / 3_600_000
                    : null;
                  const broadErr = v.broadcast_eta
                    ? (v.broadcast_eta - (v.arrived_ts ?? 0)) / 3_600_000
                    : null;
                  return (
                    <tr key={v.voyage_id} className="border-t border-slate-800">
                      <td className="py-1.5 pr-3 tabular-nums text-slate-300">
                        {v.mmsi}
                      </td>
                      <td className="py-1.5 pr-3 text-slate-300">
                        {v.cargo_class ?? "—"}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums text-slate-400">
                        {fmtTs(v.arrived_ts)}
                      </td>
                      <td
                        className={`py-1.5 pr-3 text-right tabular-nums ${errTone(ourErr)}`}
                      >
                        {fmtH(ourErr)}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-slate-400">
                        {fmtH(broadErr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No closed voyages in this window yet — the benchmark fills as vessels
            complete their voyages to {portLabel}.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-sky-700/40 bg-gradient-to-br from-sky-500/10 to-slate-900/40 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              See it on a live desk
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Predicted ETAs, congestion and sanctions screening across 51 ports —
              try it in one click, no signup.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-sky-500"
            >
              Open dashboard
            </Link>
            <Link
              href="/pricing"
              className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-[#06121d] hover:bg-sky-400"
            >
              See pricing →
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          How it&apos;s measured
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>
            Predicted ETA: distance-to-berth over speed-made-good, refreshed on
            every AIS position, with a seasonal correction from rolling medians.
          </li>
          <li>
            Broadcast ETA: the crew-entered ETA in the vessel&apos;s AIS message —
            the de-facto industry default.
          </li>
          <li>
            Both are compared to the actual arrival timestamp on the same closed
            voyages. We report RMSE (penalises large misses) and MAE (typical
            error).
          </li>
          <li>
            Broadcast ETAs more than 7 days off are dropped as AIS sentinel /
            placeholder values, and our model is scored on that same set — so the
            comparison is honest, not cherry-picked.
          </li>
          <li>
            Coverage is public AIS only; ports with weak coverage show fewer
            closed voyages. We&apos;d rather show a small honest sample than a big
            misleading one.
          </li>
        </ul>
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
