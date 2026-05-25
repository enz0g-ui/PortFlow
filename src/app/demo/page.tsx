"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

function DemoForm() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const expiredReason = reason === "demo_expired";
  const rateLimitedReason = reason === "rate_limited";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [anonPending, setAnonPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeem = async (
    payload: { code: string } | { anonymous: true },
  ): Promise<boolean> => {
    setError(null);
    const res = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
      };
      let message: string;
      if (data.error === "invalid_code") {
        message =
          "This code isn't recognized. Check the email you received for the exact code.";
      } else if (data.error === "rate_limited") {
        const hours =
          data.retryAfter !== undefined
            ? Math.ceil(data.retryAfter / 3600)
            : 24;
        message = `Free preview already used from this network in the last 24 hours. Come back in ${hours} h, or use the code from your invitation email.`;
      } else {
        message = "Something went wrong. Try again in a moment.";
      }
      setError(message);
      return false;
    }
    return true;
  };

  const onSubmitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    const ok = await redeem({ code: code.trim() });
    if (ok) {
      // Full reload so the dashboard client components re-mount with the
      // demo cookie present — otherwise vesselBookmarksEnabled never
      // flips to true (the useEffect that fetches watchlist runs at
      // mount time, before the cookie was set on this browser).
      window.location.href = "/";
      return;
    }
    setSubmitting(false);
  };

  const onAnonymous = async () => {
    setAnonPending(true);
    const ok = await redeem({ anonymous: true });
    if (ok) {
      window.location.href = "/";
      return;
    }
    setAnonPending(false);
  };

  return (
    <>
      {expiredReason ? (
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 p-4 text-sm text-amber-200">
          Your demo session has ended. Enter your code again to restart, or
          sign up at{" "}
          <Link
            href="/sign-up"
            className="text-amber-300 underline hover:text-amber-100"
          >
            /sign-up
          </Link>{" "}
          for a permanent free account.
        </div>
      ) : null}

      {rateLimitedReason ? (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-4 text-sm text-rose-200">
          The free 10-minute preview has already been used from this network
          in the last 24 hours. You can still enter a personal code below for
          a 30-minute session, or{" "}
          <Link
            href="/sign-up"
            className="text-rose-300 underline hover:text-rose-100"
          >
            sign up
          </Link>{" "}
          for a permanent free account.
        </div>
      ) : null}

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold">Your personal code</h2>
        <p className="text-sm text-slate-400">
          Grants 30 minutes of Pro+ access — full sanctions screening,
          dark-fleet detection, watchlist, and chokepoint dashboards.
        </p>
        <form onSubmit={onSubmitCode} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. JASON-26"
            spellCheck={false}
            autoComplete="off"
            autoFocus
            disabled={submitting || anonPending}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          {error ? (
            <p className="text-xs text-rose-400">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting || anonPending || !code.trim()}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Activating…" : "Start 30-min session"}
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold">No code? Quick preview</h2>
        <p className="text-sm text-slate-400">
          10 minutes on the Free tier — read-only access to all 51 ports,
          live ETA, public RMSE benchmark, and sanctions visualization.
        </p>
        <button
          type="button"
          onClick={onAnonymous}
          disabled={submitting || anonPending}
          className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {anonPending ? "Starting…" : "Start 10-min anonymous preview"}
        </button>
      </section>
    </>
  );
}

function DemoFormFallback() {
  return (
    <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-800" />
      <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
      <div className="h-10 w-full animate-pulse rounded bg-slate-800" />
    </section>
  );
}

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Back to portflow.uk
        </Link>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Try Port Flow — no signup
        </h1>
        <p className="text-sm text-slate-300">
          Two ways to explore the live platform. Either enter the personal
          code from your email for a 30-minute Pro+ session, or start an
          instant 10-minute anonymous preview on the Free tier.
        </p>
      </section>

      <Suspense fallback={<DemoFormFallback />}>
        <DemoForm />
      </Suspense>

      <footer className="border-t border-slate-800 pt-3 text-xs text-slate-500">
        Permanent account?{" "}
        <Link
          href="/sign-up"
          className="text-slate-300 hover:text-slate-100"
        >
          Sign up free
        </Link>
        {" · "}
        <Link
          href="/pricing"
          className="text-slate-300 hover:text-slate-100"
        >
          Plans &amp; pricing
        </Link>
        {" · "}
        <Link
          href="/methodology"
          className="text-slate-300 hover:text-slate-100"
        >
          Methodology
        </Link>
      </footer>
    </main>
  );
}
