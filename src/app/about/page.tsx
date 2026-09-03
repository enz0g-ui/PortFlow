import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — the people behind Port Flow",
  description:
    "Port Flow is built by OCTOPODUS, an independent software studio. Honest, transparent tanker intelligence — published accuracy, documented limits, no enterprise lock-in.",
  alternates: { canonical: "https://portflow.uk/about" },
  robots: { index: true, follow: true },
};

const LINKEDIN = "https://www.linkedin.com/in/laurent-guglielmetti-994182120/";

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 p-6 py-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Port Flow
        </Link>
        <Link
          href="/app"
          className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-sky-500"
        >
          Open dashboard
        </Link>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built by people who think the maritime-data market is broken
        </h1>
        <p className="text-lg text-slate-300">
          Vessel intelligence today means an enterprise contract worth tens of
          thousands a year — priced for the majors, out of reach for the desks
          that still need to know where the cargo is. Port Flow is the opposite
          bet: honest tanker intelligence, transparently priced, that a single
          trader, charterer or underwriter can switch on in one click.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-7">
        <div className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          The studio
        </div>
        <h2 className="mt-2 text-xl font-semibold text-slate-100">OCTOPODUS</h2>
        <p className="mt-3 text-sm text-slate-400">
          Port Flow is a product of OCTOPODUS, an independent software studio
          (Laurent Guglielmetti, entreprise individuelle, France — SIREN
          491&nbsp;489&nbsp;654). Small, focused tools that do one job and do it
          honestly. We&apos;d rather ship a real accuracy benchmark — good or bad —
          than a marketing claim.
        </p>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          The person behind it
        </div>
        <p className="text-sm text-slate-300">
          I&apos;m Laurent Guglielmetti. I&apos;ve run a business for twenty years —
          long enough to know the difference between a tool that looks impressive
          in a demo and one that actually earns its place on a working desk. Port
          Flow is built to the second standard: every number is measured, every
          limit is written down, and the methodology is public so you can judge it
          yourself.
        </p>
        <p className="text-sm text-slate-300">
          If you work in tankers — trading, chartering, P&amp;I, compliance — I&apos;d
          genuinely like to hear what would make this useful to you.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener"
            className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-sky-500 hover:text-white"
          >
            Connect on LinkedIn →
          </a>
          <a
            href="mailto:contact@portflow.uk"
            className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-sky-500 hover:text-white"
          >
            contact@portflow.uk
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-7">
        <h2 className="text-lg font-semibold text-slate-100">What we stand by</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-400">
          <li>
            <span className="font-medium text-slate-200">Published accuracy.</span>{" "}
            Our predicted-ETA error is on the{" "}
            <Link href="/precision" className="text-sky-400 hover:text-sky-300">
              benchmark page
            </Link>
            , measured against the broadcast ETA on the same closed voyages —
            not hidden, and recomputed as voyages close.
          </li>
          <li>
            <span className="font-medium text-slate-200">Auditable screening.</span>{" "}
            Every sanctions list we ingest is versioned: fetch timestamp,
            SHA-256 of the source file, entry count. A vessel that leaves a list
            is dated as delisted rather than silently deleted, so a past
            screening can be reproduced.
          </li>
          <li>
            <span className="font-medium text-slate-200">Stated provenance.</span>{" "}
            Every stored position carries its source. Open data is used under
            its licence with visible attribution — see{" "}
            <Link href="/sources" className="text-sky-400 hover:text-sky-300">
              sources
            </Link>
            .
          </li>
          <li>
            <span className="font-medium text-slate-200">No lock-in.</span> Monthly
            plans cancel anytime. A 10-minute demo needs no signup and no card.
          </li>
        </ul>
      </section>

      {/* Section « limites » — l'audit externe du site (09/2026) a montre que
          l'absence de limites ecrites nourrit le soupcon. Chaque ligne ici est
          verifiable en production ; ne jamais y ecrire une capacite qui ne
          produit pas de resultat mesurable. */}
      <section className="rounded-2xl border border-amber-800/40 bg-amber-500/[0.04] p-7">
        <h2 className="text-lg font-semibold text-slate-100">
          What Port Flow does <em>not</em> do
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          The limits below cost us sales. We publish them anyway — a benchmark
          means nothing if the boundaries around it are hidden.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-400">
          <li>
            <span className="font-medium text-slate-200">
              Terrestrial AIS only — no satellite AIS.
            </span>{" "}
            Coverage is strong near coasts and in the straits we track, and
            thins out in the open ocean. Mid-ocean STS transfers can be missed
            entirely. We do not resell satellite AIS today.
          </li>
          <li>
            <span className="font-medium text-slate-200">
              Radar (SAR) is experimental, not a product feature.
            </span>{" "}
            A free Sentinel-1 pipeline runs on a handful of areas, but its
            detector is not calibrated and it has produced{" "}
            <strong className="text-slate-200">no confirmed detections</strong>{" "}
            to date. Nothing in the paid plans depends on it. Dark-vessel
            findings you see come from AIS gap analysis, not from radar.
          </li>
          <li>
            <span className="font-medium text-slate-200">
              A dark-fleet signal is an observation, not a verdict.
            </span>{" "}
            We report what the transponder did — a gap, a jump, a rendezvous.
            Intent, ownership and legality are for your compliance team to
            establish.
          </li>
          <li>
            <span className="font-medium text-slate-200">
              Upstream feeds can fail, and we say when they do.
            </span>{" "}
            Our primary AIS provider went dark for three days in August 2026.
            The site kept serving last-known positions with a visible staleness
            banner rather than an empty map, and a second open-data feed now
            runs alongside it. Current state is always on the{" "}
            <Link href="/status" className="text-sky-400 hover:text-sky-300">
              status page
            </Link>
            .
          </li>
          <li>
            <span className="font-medium text-slate-200">
              Not a navigation or safety system.
            </span>{" "}
            Port Flow is decision support for commercial and compliance work.
            It must never be used for piloting, collision avoidance or any
            safety-critical decision.
          </li>
        </ul>
      </section>

      <footer className="border-t border-slate-800 pt-6 text-xs text-slate-500">
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-slate-200">Home</Link>
          <Link href="/app" className="hover:text-slate-200">Dashboard</Link>
          <Link href="/methodology" className="hover:text-slate-200">Methodology</Link>
          <Link href="/precision" className="hover:text-slate-200">Benchmark</Link>
          <Link href="/pricing" className="hover:text-slate-200">Pricing</Link>
          <Link href="/legal" className="hover:text-slate-200">Legal</Link>
        </nav>
      </footer>
    </main>
  );
}
