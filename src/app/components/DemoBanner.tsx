"use client";

import { useEffect, useState } from "react";

interface MeResp {
  authenticated?: boolean;
  isDemo?: boolean;
  demoExpiresAt?: number | null;
}

/**
 * Sticky banner shown only when the current session is a demo. Counts
 * down to expiry and force-redirects to /demo?reason=demo_expired the
 * moment the clock hits zero — without this, the cookie silently
 * expires browser-side and the user finds a partially-locked dashboard
 * with no signal of what happened.
 *
 * Mounted in the root layout so every page (dashboard, /fleet,
 * /precision, /account, etc.) shows the same expiry context during a
 * demo session.
 */
export function DemoBanner() {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/me", { cache: "no-store" })
      .then(async (r) => (r.ok ? ((await r.json()) as MeResp) : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.isDemo && typeof data.demoExpiresAt === "number") {
          setExpiresAt(data.demoExpiresAt);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt) return;
    if (now < expiresAt) return;
    // Cookie has just expired (or is about to). Hard-redirect so the
    // server picks up the unauthenticated state cleanly and the demo
    // page shows the expired-reason banner.
    window.location.href = "/demo?reason=demo_expired";
  }, [expiresAt, now]);

  if (!expiresAt) return null;

  const remainingMs = Math.max(0, expiresAt - now);
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  const mmss = `${mins}:${secs.toString().padStart(2, "0")}`;
  const urgent = remainingMs < 60_000; // last minute → red

  const onEnd = async () => {
    try {
      await fetch("/api/auth/demo", { method: "DELETE" });
    } catch {
      // proceed anyway
    }
    window.location.href = "/";
  };

  return (
    <div
      className={`sticky top-0 z-50 flex items-center justify-center gap-3 border-b px-4 py-1.5 text-xs backdrop-blur ${
        urgent
          ? "border-rose-700/60 bg-rose-950/80 text-rose-100"
          : "border-sky-700/60 bg-sky-950/80 text-sky-100"
      }`}
    >
      <span className="font-semibold">Demo session</span>
      <span aria-hidden="true">·</span>
      <span>
        expires in{" "}
        <span className="font-mono tabular-nums">{mmss}</span>
      </span>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        onClick={onEnd}
        className="underline hover:opacity-80"
      >
        End now
      </button>
    </div>
  );
}
