"use client";

import Link from "next/link";
import { useState } from "react";

// Ajoute le navire à la watchlist de l'utilisateur. Sans compte : renvoie
// vers l'inscription puis ramène ici ; formule sans watchlist : vers les prix.

type State = "idle" | "busy" | "done" | "signin" | "upgrade" | "full" | "error";

export function WatchButton({
  mmsi,
  mmsis,
  label = "◉ Watch: alert me on new contacts or AIS gaps",
  back,
  className,
}: {
  mmsi?: number;
  mmsis?: number[];
  label?: string;
  back?: string;
  className?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const list = mmsis ?? (mmsi ? [mmsi] : []);

  const add = async () => {
    setState("busy");
    try {
      for (const m of list) {
        const r = await fetch("/api/user/watchlist/vessels", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mmsi: m }),
        });
        if (r.ok) continue;
        if (r.status === 401) return setState("signin");
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        if (r.status === 403 && j.error?.includes("limit")) return setState("full");
        if (r.status === 403) return setState("upgrade");
        return setState("error");
      }
      setState("done");
    } catch {
      setState("error");
    }
  };

  const cls =
    className ??
    "rounded-md border border-sky-600/60 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-500/20";

  if (state === "done") {
    return (
      <Link href="/account#alerts" className={cls}>
        ✓ Watching · set where alerts go →
      </Link>
    );
  }
  if (state === "signin") {
    const to = encodeURIComponent(back ?? (mmsi ? `/brief/vessel/${mmsi}` : "/brief"));
    return (
      <Link href={`/sign-up?redirect_url=${to}`} className={cls}>
        Create a free account to watch {list.length > 1 ? "these ships" : "this ship"} →
      </Link>
    );
  }
  if (state === "upgrade" || state === "full") {
    return (
      <Link href="/pricing" className={cls}>
        {state === "full" ? "Watchlist full — see plans →" : "Watchlists start with Starter — see plans →"}
      </Link>
    );
  }
  return (
    <button type="button" onClick={add} disabled={state === "busy"} className={cls}>
      {state === "busy" ? "Adding…" : state === "error" ? "Retry" : label}
    </button>
  );
}
