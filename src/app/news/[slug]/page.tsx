import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrief, listBriefs } from "@/lib/news/briefs";
import { CopyButton } from "../../components/CopyButton";

export function generateStaticParams() {
  return listBriefs().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = getBrief(slug);
  if (!b) return { title: "Brief not found" };
  return {
    title: b.title,
    description: b.dek,
    alternates: { canonical: `https://portflow.uk/news/${b.slug}` },
    openGraph: {
      type: "article",
      title: b.title,
      description: b.dek,
      url: `https://portflow.uk/news/${b.slug}`,
      publishedTime: b.publishedAt,
    },
    robots: { index: true, follow: true },
  };
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function BriefPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = getBrief(slug);
  if (!b) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: b.title,
    description: b.dek,
    datePublished: b.publishedAt,
    url: `https://portflow.uk/news/${b.slug}`,
    publisher: { "@id": "https://portflow.uk/#organization" },
    isAccessibleForFree: true,
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="flex items-center justify-between">
        <Link href="/news" className="text-xs text-slate-400 hover:text-slate-200">
          ← All briefs
        </Link>
        <Link
          href="/app"
          className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-sky-500"
        >
          Open dashboard
        </Link>
      </header>

      <article className="space-y-7">
        <div>
          <div className="text-xs text-slate-500">{fmtDate(b.publishedAt)}</div>
          <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">
            {b.title}
          </h1>
          <p className="mt-3 text-lg text-slate-300">{b.dek}</p>
        </div>

        {b.event && b.event.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              The news
            </h2>
            {b.event.map((p, i) => (
              <p key={i} className="text-slate-300">{p}</p>
            ))}
            {b.eventSource ? (
              <p className="text-sm">
                <a
                  href={b.eventSource.url}
                  target="_blank"
                  rel="noopener"
                  className="text-sky-400 hover:text-sky-300"
                >
                  Source: {b.eventSource.label} →
                </a>
              </p>
            ) : null}
          </section>
        ) : null}

        {b.stats && b.stats.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              {b.dataIntro ?? "What the data shows"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {b.stats.map((st) => (
                <div
                  key={st.label}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {st.label}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-100">
                    {st.value}
                  </div>
                  {st.sub ? (
                    <div className="mt-0.5 text-xs text-slate-500">{st.sub}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {b.implication && b.implication.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              What it implies
            </h2>
            {b.implication.map((p, i) => (
              <p key={i} className="text-slate-300">{p}</p>
            ))}
          </section>
        ) : null}

        {/* Punchline — copy-paste for LinkedIn */}
        <section className="rounded-2xl border border-sky-700/40 bg-gradient-to-br from-sky-500/10 to-slate-900/40 p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-sky-300">
              The line
            </h2>
            <CopyButton text={b.punchline} label="Copy for LinkedIn" />
          </div>
          <p className="text-slate-100">{b.punchline}</p>
        </section>

        {b.disclaimer ? (
          <p className="border-t border-slate-800 pt-4 text-xs text-slate-500">
            {b.disclaimer}
          </p>
        ) : null}

        {/* CTA */}
        <section className="flex flex-col items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">
            Check any of these numbers yourself — live, no signup.
          </p>
          <Link
            href="/app"
            className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
          >
            Open the live dashboard →
          </Link>
        </section>
      </article>

      <footer className="border-t border-slate-800 pt-6 text-xs text-slate-500">
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/news" className="hover:text-slate-200">All briefs</Link>
          <Link href="/precision" className="hover:text-slate-200">Benchmark</Link>
          <Link href="/methodology" className="hover:text-slate-200">Methodology</Link>
          <Link href="/pricing" className="hover:text-slate-200">Pricing</Link>
        </nav>
      </footer>
    </main>
  );
}
