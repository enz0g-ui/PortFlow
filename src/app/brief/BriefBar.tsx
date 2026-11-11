import Link from "next/link";

// Barre du haut des pages de détail : retour au Briefing + recherche
// toujours à portée (formulaire GET, sans JS).

export function BriefBar({
  crumbs = [],
}: {
  crumbs?: Array<{ label: string; href: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 print:hidden">
      <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link href="/brief" className="text-sky-400 hover:text-sky-300">
          Briefing
        </Link>
        {crumbs.map((c, i) => (
          <span key={`${c.href}-${i}`} className="flex items-center gap-1.5">
            <span className="text-slate-600">›</span>
            {i === crumbs.length - 1 ? (
              <span className="max-w-[220px] truncate text-slate-300">{c.label}</span>
            ) : (
              <Link href={c.href} className="max-w-[160px] truncate text-sky-400 hover:text-sky-300">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <form action="/brief/screen" method="get" className="flex w-full max-w-sm gap-2 sm:w-auto">
        <input
          name="q"
          type="search"
          placeholder="Check a vessel: name, IMO, MMSI"
          aria-label="Check a vessel"
          className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950/80 px-3 py-1.5 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none sm:w-64"
        />
        <button
          type="submit"
          className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
        >
          Check
        </button>
      </form>
    </div>
  );
}
