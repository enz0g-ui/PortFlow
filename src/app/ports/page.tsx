import type { Metadata } from "next";
import Link from "next/link";
import { Attributions } from "../components/Attributions";
import { DemoButton } from "../components/DemoButton";
import { PORTS } from "@/lib/ports";
import { meta } from "@/lib/store";

// Index of all covered ports with live counts — the hub for the per-port
// SEO pages.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Covered ports — live tanker activity & per-port ETA accuracy",
  description:
    "All ports tracked by Port Flow with live vessel counts, congestion by zone and a public per-port ETA accuracy benchmark.",
  alternates: { canonical: "https://portflow.uk/ports" },
  robots: { index: true, follow: true },
};

const REGION_LABELS: Record<string, string> = {
  "northern-europe": "Northern Europe",
  mediterranean: "Mediterranean",
  americas: "Americas",
  "middle-east": "Middle East",
  asia: "Asia",
  africa: "Africa",
  oceania: "Oceania",
};

export default async function PortsIndexPage() {
  const perPort = meta.perPortStatus();
  const regions = [...new Set(PORTS.map((p) => p.region))];

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Port Flow
        </Link>
        <span className="[&>button]:!px-3 [&>button]:!py-1">
          <DemoButton />
        </span>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Covered ports</h1>
        <p className="max-w-2xl text-base text-slate-300">
          Live tanker activity, congestion by zone, and a public per-port ETA
          accuracy benchmark — {PORTS.length} ports and counting.
        </p>
      </section>

      {regions.map((region) => (
        <section key={region}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {REGION_LABELS[region] ?? region}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PORTS.filter((p) => p.region === region).map((p) => (
              <Link
                key={p.id}
                href={`/ports/${p.id}`}
                className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 hover:border-sky-600"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-slate-100">
                    {p.flag} {p.name}
                  </span>
                  <span className="text-xs tabular-nums text-slate-400">
                    {perPort[p.id]?.vesselCount ?? 0} vessels
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {p.country} · {p.cargoStrength.join(", ")}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <footer className="border-t border-slate-800 pt-3">
        <Attributions compact />
      </footer>
    </main>
  );
}
