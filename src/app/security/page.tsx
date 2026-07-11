import type { Metadata } from "next";
import Link from "next/link";

// Static trust page: the questions a procurement or compliance reviewer asks
// before an Enterprise conversation. Honest about what we are (solo-operated,
// no SOC 2 yet) — same editorial line as /precision.
export const metadata: Metadata = {
  title: "Security & data handling",
  description:
    "How Port Flow handles data: encryption in transit and at rest, GDPR posture, data sources, retention, and the list of subprocessors.",
  alternates: { canonical: "https://portflow.uk/security" },
  robots: { index: true, follow: true },
};

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
        {title}
      </h2>
      <div className="space-y-2 text-sm text-slate-400">{children}</div>
    </section>
  );
}

export default function SecurityPage() {
  return (
    <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 p-6">
      <header>
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Port Flow
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Security &amp; data handling
        </h1>
        <p className="mt-2 max-w-2xl text-base text-slate-300">
          What we store, where it lives, and who processes it. Written for the
          reviewer who has to sign off on a subscription — plainly, without
          badge inflation.
        </p>
      </header>

      <Block title="What data Port Flow processes">
        <p>
          The product runs on <strong>public AIS data</strong> (vessel
          positions, static voyage data) and derived analytics. None of that is
          personal data.
        </p>
        <p>
          Personal data we do process: account email and name (authentication),
          billing details (handled by Stripe — card numbers never touch our
          servers), alert configurations, and standard web logs.
        </p>
      </Block>

      <Block title="Encryption">
        <p>
          All traffic is TLS 1.2+ end to end (Cloudflare edge + Let&apos;s
          Encrypt at origin). Data at rest lives on encrypted volumes
          (LUKS-encrypted block storage on our EU host). Secrets are stored in
          environment configuration, never in the repository.
        </p>
      </Block>

      <Block title="GDPR posture">
        <p>
          Port Flow is operated from France by OCTOPODUS (Laurent Guglielmetti
          EI, SIREN 491 489 654) and hosted in the EU. Account and billing data
          are processed under Art. 6(1)(b) (contract performance).
        </p>
        <p>
          Deletion: close your account and every associated record (alerts,
          integrations, subscription state) is removed; Stripe retains invoices
          for statutory accounting periods. Export or deletion requests:{" "}
          <a
            href="mailto:contact@portflow.uk"
            className="underline hover:text-slate-200"
          >
            contact@portflow.uk
          </a>
          . A signed DPA is available on request for paid plans.
        </p>
      </Block>

      <Block title="Subprocessors">
        <ul className="list-disc space-y-1 pl-5">
          <li>DigitalOcean (EU) — application hosting and database</li>
          <li>Cloudflare — CDN, TLS, DDoS protection, web analytics</li>
          <li>Clerk — authentication</li>
          <li>Stripe — payments and invoicing</li>
          <li>Sentry — error monitoring (scrubbed of personal data)</li>
          <li>Resend (EU sending region) — transactional email and briefs</li>
          <li>Zoho Mail (EU) — support mailbox</li>
        </ul>
      </Block>

      <Block title="What we don't claim">
        <p>
          No SOC 2 or ISO 27001 certification yet — Port Flow is a
          deliberately small operation, and we&apos;d rather state that plainly
          than imply otherwise. What you get instead: a documented{" "}
          <Link href="/methodology" className="underline hover:text-slate-200">
            methodology
          </Link>
          , a public{" "}
          <Link href="/precision" className="underline hover:text-slate-200">
            accuracy benchmark
          </Link>
          , a public{" "}
          <Link href="/status" className="underline hover:text-slate-200">
            status page
          </Link>
          , and a founder you can reach directly.
        </p>
      </Block>
    </main>
  );
}
