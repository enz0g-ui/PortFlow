import Link from "next/link";

// Champ de vérification : simple formulaire GET (pas de JS requis), le
// résultat a une URL partageable.

export function ScreenBox({
  initial = "",
  examples,
  compact = false,
}: {
  initial?: string;
  examples?: Array<{ label: string; q: string }>;
  compact?: boolean;
}) {
  return (
    <form action="/brief/screen" method="get" className="w-full">
      <label htmlFor="pf-screen" className={compact ? "sr-only" : "block text-sm font-medium text-slate-200"}>
        Check any vessel — or paste your whole fleet
      </label>
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-stretch ${compact ? "" : "mt-2"}`}>
        <textarea
          id="pf-screen"
          name="q"
          defaultValue={initial}
          rows={compact ? 2 : 3}
          spellCheck={false}
          placeholder={"Name, IMO or MMSI — one per line, or comma-separated\ne.g. 9319703, VALERA, 273125140"}
          className="min-h-[64px] flex-1 resize-y rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="rounded-md bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Screen
        </button>
      </div>
      {examples && examples.length > 0 ? (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          Try:
          {examples.map((e) => (
            <Link
              key={e.label}
              href={`/brief/screen?q=${encodeURIComponent(e.q)}`}
              className="rounded border border-slate-700 px-2 py-0.5 font-mono text-slate-300 hover:border-sky-500 hover:text-sky-300"
            >
              {e.label}
            </Link>
          ))}
          <span className="text-slate-600">· up to 50 vessels · no account needed</span>
        </p>
      ) : null}
    </form>
  );
}
