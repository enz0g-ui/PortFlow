"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Show } from "@clerk/nextjs";

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function DemoButtonInner() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ anonymous: true }),
      });
      if (!res.ok) {
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title="10-minute Free-tier preview, no signup required"
      className="rounded border border-emerald-700/60 bg-emerald-950/40 px-2 py-1 text-xs font-medium text-emerald-200 hover:border-emerald-500 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Starting…" : "Try demo (10 min)"}
    </button>
  );
}

/**
 * Anonymous 10-minute demo trigger. Shown to signed-out visitors only,
 * so we don't confuse authenticated users (who already have their tier)
 * with a redundant "try demo" affordance. If Clerk isn't enabled (local
 * dev), the button is always shown.
 */
export function DemoButton() {
  if (!clerkEnabled) return <DemoButtonInner />;
  return (
    <Show when="signed-out">
      <DemoButtonInner />
    </Show>
  );
}
