import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Attributions } from "../../components/Attributions";
import { DemoButton } from "../../components/DemoButton";
import { NewsletterForm } from "../../components/NewsletterForm";
import { getVoyageAccuracy } from "@/lib/voyages";
import { PORTS, PORTS_BY_ID } from "@/lib/ports";
import { meta } from "@/lib/store";

// One indexable page per covered port: live activity + the ETA accuracy
// benchmark measured on THIS port. Captures "<port> tanker congestion"-style
// queries and gives prospects a direct link to their own terminal.
export const dynamic = "force-dynamic";

const DAYS = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const port = PORTS_BY_ID[slug];
  if (!port) return {};
  return {
    title: `${port.name} tanker traffic, congestion & ETA accuracy`,
    description: `Live tanker activity at ${port.name} (${port.country}): vessels in the zone now, and Port Flow's predicted-ETA accuracy vs the crew's broadcast ETA, measured on closed voyages.`,
    alternates: { canonical: `https://portflow.uk/ports/${port.id}` },
    robots: { index: true, follow: true },
  };
}

function fmtH(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(digits)} h`;
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

export default async function PortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const port = PORTS_BY_ID[slug];
  if (!port) notFound();

  const since = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  const acc = getVoyageAccuracy(port.id, since);
  const vesselCount = meta.perPortStatus()[port.id]?.vesselCount ?? 0;

  const mae = acc.modelMaeOnBaselineHours ?? acc.maeHours;
  const baselineMae = acc.baselineMaeHours;
  const delta =
    mae !== null && baselineMae !== null && baselineMae > 0
      ? ((mae - baselineMae) / baselineMae) * 100
      : null;
  const beats = delta !== null && delta < 0;

  const neighbours = PORTS.filter(
    (p) => p.region === port.region && p.id !== port.id,
  ).slice(0, 8);

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/ports" className="text-xs text-slate-400 hover:text-slate-200">
          ← All ports
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <Link
            href={`/precision?port=${port.id}`}
            className="text-slate-400 hover:text-slate-200"
          >
            Full benchmark →
          </Link>
          <span className="[&>button]:!px-3 [&>button]:!py-1">
            <DemoButton />
          </span>
        </div>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {port.flag} {port.name}{" "}
          <span className="text-slate-400">· {port.country}</span>
        </h1>
        <p className="max-w-2xl text-base text-slate-300">{port.blurb}</p>
        {port.aisCoverage && port.aisCoverage !== "good" ? (
          <p className="max-w-2xl rounded border border-amber-700/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Community AIS coverage here is {port.aisCoverage}. Counts and
            closed-voyage volumes understate reality — a commercial feed (BYO
            Spire/Orbcomm key, supported natively) unlocks full visibility.
          </p>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="Vessels in zone now"
          value={String(vesselCount)}
          hint="live from public AIS"
        />
        <Stat
          label={`Our ETA error (MAE, ${DAYS}d)`}
          value={fmtH(mae)}
          tone={beats ? "good" : "default"}
          hint={`${acc.count} closed voyages`}
        />
        <Stat
          label="Broadcast ETA error (MAE)"
          value={baselineMae !== null ? fmtH(baselineMae) : "building…"}
          hint={
            delta !== null
              ? beats
                ? `we're ${Math.abs(delta).toFixed(0)}% closer on the same voyages`
                : `gap of ${Math.abs(delta).toFixed(0)}% on the same voyages`
              : `${acc.baselineCount} comparable voyages so far`
          }
        />
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
          What Port Flow tracks at {port.name}
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>
            Predicted ETA for every inbound tanker, refreshed on each AIS
            position — benchmarked publicly on{" "}
            <Link
              href={`/precision?port=${port.id}`}
              className="underline hover:text-slate-200"
            >
              /precision
            </Link>{" "}
            and settled voyage by voyage on{" "}
            <Link href="/receipts" className="underline hover:text-slate-200">
              /receipts
            </Link>
            .
          </li>
          <li>
            Congestion by zone ({port.zones.map((zn) => zn.name).join(", ")})
            with anchored / underway / moored counts.
          </li>
          <li>
            Cargo focus: {port.cargoStrength.join(", ")}. Sanctions screening
            and dark-fleet signals on paid tiers.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DemoButton />
          <Link
            href="/pricing"
            className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-sky-500"
          >
            See pricing
          </Link>
        </div>
      </section>

      {neighbours.length > 0 ? (
        <section className="text-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Nearby coverage
          </h2>
          <div className="flex flex-wrap gap-2">
            {neighbours.map((p) => (
              <Link
                key={p.id}
                href={`/ports/${p.id}`}
                className="rounded border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-600"
              >
                {p.flag} {p.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
          The weekly data brief
        </h2>
        <p className="mb-3 mt-1 max-w-xl text-sm text-slate-400">
          Congestion anomalies, chokepoint moves and precision updates across
          51 ports — one email a week, numbers first.
        </p>
        <NewsletterForm source={`port-${port.id}`} />
      </section>

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
