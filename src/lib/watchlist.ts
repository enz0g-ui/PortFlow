import { db } from "./db";

export interface WatchlistEntry {
  id: number;
  owner: string;
  mmsi: number | null;
  imo: number | null;
  label: string | null;
  notes: string | null;
  created_at: number;
}

export function listWatchlist(owner = "default"): WatchlistEntry[] {
  return db()
    .raw.prepare(
      `SELECT * FROM watchlist WHERE owner = ? ORDER BY created_at DESC`,
    )
    .all(owner) as unknown as WatchlistEntry[];
}

export function addWatchlist(input: {
  owner?: string;
  mmsi?: number;
  imo?: number;
  label?: string;
  notes?: string;
}): WatchlistEntry {
  if (!input.mmsi && !input.imo) {
    throw new Error("at least one of mmsi or imo is required");
  }
  const r = db()
    .raw.prepare(
      `INSERT INTO watchlist (owner, mmsi, imo, label, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.owner ?? "default",
      input.mmsi ?? null,
      input.imo ?? null,
      input.label ?? null,
      input.notes ?? null,
      Date.now(),
    );
  return {
    id: Number(r.lastInsertRowid),
    owner: input.owner ?? "default",
    mmsi: input.mmsi ?? null,
    imo: input.imo ?? null,
    label: input.label ?? null,
    notes: input.notes ?? null,
    created_at: Date.now(),
  };
}

export function removeWatchlist(id: number, owner = "default"): boolean {
  const r = db()
    .raw.prepare(`DELETE FROM watchlist WHERE id = ? AND owner = ?`)
    .run(id, owner);
  return r.changes > 0;
}

export function watchlistMmsiSet(owner = "default"): Set<number> {
  return new Set(
    listWatchlist(owner)
      .map((w) => w.mmsi)
      .filter((m): m is number => typeof m === "number"),
  );
}
