import type { Metadata } from "next";
import Link from "next/link";
import { Attributions } from "../components/Attributions";
import { DemoButton } from "../components/DemoButton";
import { recentClosedVoyagesAllPorts } from "@/lib/db";
import { BROADCAST_SENTINEL_CUTOFF_H } from "@/lib/voyages";
import { PORTS_BY_ID } from "@/lib/ports";

// Prediction receipts: every row is a prediction that was logged BEFORE the
// vessel arrived (predicted_at < arrived_ts, enforced in SQL), then scored
// against the actual arrival. A public, timestamped track record — the whole
// point is that it can't be cherry-picked after the fact.
export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;
const LIMIT = 100;

export const metadata: Metadata = {
  title: "Prediction receipts — ETA calls logged before arrival",
  description:
    "Every Port Flow ETA prediction is timestamped before the vessel arrives, then scored against the actual arrival. The full track record, updated live — wins and misses.",
  alternates: { canonical: "https://portflow.uk/receipts" },
  robots: { index: true, follow: true },
};

function fmtH(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(digits)} h`;
}

function fmtTs(ts?: number | null): string {
  if (!ts) return "—";
  return (
    new Date(ts).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
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

export default async function ReceiptsPage() {
  const since = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const rows = recentClosedVoyagesAllPorts(since, LIMIT);

  // Receipts with a usable broadcast ETA on the same voyage → head-to-head.
  let beats = 0;
  let comparable = 0;
  let leadSumH = 0;
  for (const v of rows) {
    leadSumH += ((v.arrived_ts ?? 0) - (v.predicted_at ?? 0)) / 3_600_000;
    if (v.broadcast_eta == null) continue;
    const broadErr =
      Math.abs((v.broadcast_eta - (v.arrived_ts ?? 0)) / 3_600_000);
    if (broadErr > BROADCAST_SENTINEL_CUTOFF_H) continue;
    const ourErr = Math.abs(
      ((v.predicted_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000,
    );
    comparable++;
    if (ourErr < broadErr) beats++;
  }
  const avgLeadH = rows.length > 0 ? leadSumH / rows.length : 0;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Port Flow
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/precision" className="text-slate-400 hover:text-slate-200">
            Full accuracy benchmark →
          </Link>
          <span className="[&>button]:!px-3 [&>button]:!py-1">
            <DemoButton />
          </span>
        </div>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Prediction receipts
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Every ETA we publish is timestamped <em>before</em> the vessel
          arrives, then scored against the actual arrival. No retro-fitting, no
          cherry-picking — the losses stay on the board with the wins. Last{" "}
          {WINDOW_DAYS} days, most recent first.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Receipts settled
          </div>
          <div className="text-3xl font-semibold tabular-nums text-slate-100">
            {rows.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            closed voyages with a pre-arrival prediction
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Head-to-head vs broadcast
          </div>
          <div className="text-3xl font-semibold tabular-nums text-emerald-400">
            {comparable > 0
              ? `${Math.round((beats / comparable) * 100)} %`
              : "—"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {comparable > 0
              ? `closer than the crew's own ETA on ${beats}/${comparable} comparable voyages`
              : "builds as voyages close"}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Average lead time
          </div>
          <div className="text-3xl font-semibold tabular-nums text-slate-100">
            {fmtH(avgLeadH, 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            between the last locked prediction and arrival
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            The ledger
          </h2>
          <span className="text-xs text-slate-500">
            error = ETA minus actual arrival (hours)
          </span>
        </div>
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr className="text-left">
                  <th className="py-1 pr-3 font-normal">Port</th>
                  <th className="py-1 pr-3 font-normal">MMSI</th>
                  <th className="py-1 pr-3 font-normal">Prediction locked</th>
                  <th className="py-1 pr-3 font-normal">Arrived</th>
                  <th className="py-1 pr-3 text-right font-normal">Our error</th>
                  <th className="py-1 pr-3 text-right font-normal">
                    Broadcast error
                  </th>
                  <th className="py-1 pr-0 text-right font-normal">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  const port = PORTS_BY_ID[v.port];
                  const ourErr =
                    ((v.predicted_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
                  const rawBroadErr =
                    v.broadcast_eta != null
                      ? (v.broadcast_eta - (v.arrived_ts ?? 0)) / 3_600_000
                      : null;
                  const broadErr =
                    rawBroadErr !== null &&
                    Math.abs(rawBroadErr) <= BROADCAST_SENTINEL_CUTOFF_H
                      ? rawBroadErr
                      : null;
                  const win =
                    broadErr !== null
                      ? Math.abs(ourErr) < Math.abs(broadErr)
                      : null;
                  return (
                    <tr key={v.voyage_id} className="border-t border-slate-800">
                      <td className="py-1.5 pr-3 text-slate-300">
                        <Link
                          href={`/ports/${v.port}`}
                          className="hover:text-sky-300"
                        >
                          {port?.flag ? `${port.flag} ` : ""}
                          {port?.name ?? v.port}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums text-slate-400">
                        {v.mmsi}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums text-slate-400">
                        {fmtTs(v.predicted_at)}
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
                        {broadErr !== null
                          ? fmtH(broadErr)
                          : rawBroadErr !== null
                            ? "sentinel"
                            : "—"}
                      </td>
                      <td className="py-1.5 pr-0 text-right">
                        {win === null ? (
                          <span className="text-slate-600">n/a</span>
                        ) : win ? (
                          <span className="text-emerald-400">✓ beat</span>
                        ) : (
                          <span className="text-rose-400">✗ missed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No settled receipts in this window yet — the ledger fills as
            voyages close.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          Why this page exists
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>
            A receipt only enters the ledger if its prediction timestamp
            (`predicted_at`) precedes the actual arrival — enforced in the
            query, not by editorial choice.
          </li>
          <li>
            Broadcast ETAs more than {BROADCAST_SENTINEL_CUTOFF_H} h from the
            actual arrival are marked as AIS sentinel values and excluded from
            the head-to-head, as documented on{" "}
            <Link href="/methodology" className="underline hover:text-slate-200">
              /methodology
            </Link>
            .
          </li>
          <li>
            Aggregated accuracy (RMSE/MAE per port and window) lives on{" "}
            <Link href="/precision" className="underline hover:text-slate-200">
              /precision
            </Link>
            .
          </li>
        </ul>
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
