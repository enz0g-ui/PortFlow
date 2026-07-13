"use client";

import { useEffect, useState } from "react";

interface PortRow {
  id: string;
  name: string;
  vesselCount: number;
}

/**
 * Live marquee under the landing nav — real vessel counts from /api/ports,
 * not decorative numbers. Duplicated content + CSS translate loop.
 */
export function TickerBar() {
  const [ports, setPorts] = useState<PortRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ports", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { ports?: PortRow[] } | null) => {
        if (cancelled || !j?.ports) return;
        const top = [...j.ports]
          .sort((a, b) => b.vesselCount - a.vesselCount)
          .slice(0, 10);
        setPorts(top);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (ports.length === 0) return null;

  const items = ports.map((p) => (
    <span key={p.id} className="whitespace-nowrap">
      {p.name.toUpperCase()}{" "}
      <b className="text-slate-100">{p.vesselCount}</b>{" "}
      <span className="text-slate-600">vessels</span>
    </span>
  ));

  return (
    <div className="overflow-hidden border-b border-slate-800 bg-slate-900/60">
      <div className="flex w-[200%] animate-[pf-tick_50s_linear_infinite] gap-0">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex gap-10 whitespace-nowrap px-10 py-2 font-mono text-[11px] font-medium text-slate-500"
            aria-hidden={i === 1}
          >
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}
