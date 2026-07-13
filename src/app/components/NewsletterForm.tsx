"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Weekly data-brief signup. Posts to /api/newsletter which stores the
 * contact in a Resend audience (or logs locally when Resend isn't
 * configured). `source` is kept as metadata so we can see which page
 * converts.
 */
export function NewsletterForm({ source = "unknown" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Unknown error");
      setStatus("success");
      setMessage("Subscribed — first brief lands next week.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          disabled={status === "loading" || status === "success"}
          aria-label="Your email address"
          className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success" || !email}
          className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-[#06121d] hover:bg-sky-400 disabled:opacity-60"
        >
          {status === "loading"
            ? "Sending…"
            : status === "success"
              ? "✓ Subscribed"
              : "Get the brief"}
        </button>
      </form>
      {status === "success" && (
        <p className="mt-2 text-xs text-emerald-400">{message}</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs text-rose-400">⚠ {message}</p>
      )}
      <p className="mt-2 text-xs text-slate-600">
        One email a week. Unsubscribe in one click. No sharing with third
        parties.
      </p>
    </div>
  );
}
