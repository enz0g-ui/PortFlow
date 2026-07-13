import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs uppercase tracking-wider text-slate-500">404</p>
      <h1 className="text-2xl font-bold text-slate-100">Page not found</h1>
      <p className="text-sm text-slate-400">
        This URL doesn&apos;t match a Port Flow page. It may have been moved,
        renamed, or never existed.
      </p>
      <div className="flex gap-2">
        <Link
          href="/"
          className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-[#06121d] hover:bg-sky-400"
        >
          Back to dashboard
        </Link>
        <Link
          href="/precision"
          className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-sky-500"
        >
          ETA precision →
        </Link>
      </div>
    </main>
  );
}
