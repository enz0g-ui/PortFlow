"use client";

import { useMemo, useState } from "react";

export interface ClosedVoyageRow {
  voyageId: string | number;
  mmsi: number;
  cargo: string | null;
  arrivedTs: number | null;
  ourErr: number | null;
  broadErr: number | null;
}

type SortKey = "mmsi" | "cargo" | "arrivedTs" | "ourErr" | "broadErr";
type SortDir = "asc" | "desc";

const COLUMNS: Array<{
  key: SortKey;
  label: string;
  align: "left" | "right";
  defaultDir: SortDir;
}> = [
  { key: "mmsi", label: "MMSI", align: "left", defaultDir: "asc" },
  { key: "cargo", label: "Cargo", align: "left", defaultDir: "asc" },
  { key: "arrivedTs", label: "Arrival", align: "left", defaultDir: "desc" },
  { key: "ourErr", label: "Our error", align: "right", defaultDir: "asc" },
  { key: "broadErr", label: "Broadcast error", align: "right", defaultDir: "asc" },
];

function fmtH(v: number | null, digits = 2): string {
  if (v === null) return "—";
  return `${v.toFixed(digits)} h`;
}

function fmtTs(ts: number | null): string {
  if (!ts) return "—";
  return (
    new Date(ts).toLocaleString([], {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

function errTone(err: number | null): string {
  if (err === null) return "text-slate-500";
  const a = Math.abs(err);
  if (a < 1) return "text-emerald-300";
  if (a < 3) return "text-amber-300";
  return "text-rose-300";
}

/* Error columns sort by |error| — "best prediction first" is the reading
   users want, and a -1.46 h miss is worse than a +0.25 h one. */
function sortValue(row: ClosedVoyageRow, key: SortKey): number | string | null {
  const v = row[key];
  if (v === null || v === undefined) return null;
  if (key === "ourErr" || key === "broadErr") return Math.abs(v as number);
  return v;
}

export function ClosedVoyagesTable({ rows }: { rows: ClosedVoyageRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("arrivedTs");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (va === null && vb === null) return 0;
      if (va === null) return 1; // nulls last, whatever the direction
      if (vb === null) return -1;
      if (typeof va === "string" || typeof vb === "string") {
        return String(va).localeCompare(String(vb)) * dir;
      }
      return (va - vb) * dir;
    });
  }, [rows, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(COLUMNS.find((c) => c.key === key)?.defaultDir ?? "asc");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-slate-500">
          <tr>
            {COLUMNS.map((c) => {
              const active = sortKey === c.key;
              return (
                <th
                  key={c.key}
                  className={`py-1 pr-3 font-normal ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    aria-sort={
                      active
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={`inline-flex items-center gap-1 transition-colors hover:text-slate-200 ${
                      active ? "text-sky-300" : ""
                    }`}
                  >
                    <span>{c.label}</span>
                    <span
                      className={`text-[9px] ${active ? "" : "opacity-30"}`}
                      aria-hidden
                    >
                      {active ? (sortDir === "asc" ? "▲" : "▼") : "▲▼"}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((v) => (
            <tr key={v.voyageId} className="border-t border-slate-800">
              <td className="py-1.5 pr-3 tabular-nums text-slate-300">{v.mmsi}</td>
              <td className="py-1.5 pr-3 text-slate-300">{v.cargo ?? "—"}</td>
              <td className="py-1.5 pr-3 tabular-nums text-slate-400">
                {fmtTs(v.arrivedTs)}
              </td>
              <td
                className={`py-1.5 pr-3 text-right tabular-nums ${errTone(v.ourErr)}`}
              >
                {fmtH(v.ourErr)}
              </td>
              <td className="py-1.5 pr-3 text-right tabular-nums text-slate-400">
                {fmtH(v.broadErr)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
