"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-100">Page error</h1>
      <p className="text-sm text-slate-400">
        Something went wrong rendering this page. The error has been logged.
      </p>
      {error.digest ? (
        <p className="font-mono text-[10px] text-slate-600">
          digest: {error.digest}
        </p>
      ) : null}
      <p className="font-mono text-xs text-rose-300">{error.message}</p>
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-sky-500"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
