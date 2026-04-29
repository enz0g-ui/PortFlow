import { db } from "./db";
import { TIER_LIMITS, type Tier } from "./auth/tier";

export function maxPortWatchlist(tier: Tier): number {
  const limit = TIER_LIMITS[tier].ports;
  return limit === "all" ? 100 : limit;
}

export function listPortWatchlist(userId: string): string[] {
  const rows = db()
    .raw.prepare(
      `SELECT port_id FROM user_port_watchlist WHERE user_id = ? ORDER BY created_at DESC`,
    )
    .all(userId) as Array<{ port_id: string }>;
  return rows.map((r) => r.port_id);
}

export function countPortWatchlist(userId: string): number {
  const row = db()
    .raw.prepare(
      `SELECT COUNT(*) as n FROM user_port_watchlist WHERE user_id = ?`,
    )
    .get(userId) as { n: number };
  return row.n;
}

export function addPortToWatchlist(userId: string, portId: string): void {
  db()
    .raw.prepare(
      `INSERT OR IGNORE INTO user_port_watchlist (user_id, port_id, created_at)
       VALUES (?, ?, ?)`,
    )
    .run(userId, portId, Date.now());
}

export function removePortFromWatchlist(userId: string, portId: string): void {
  db()
    .raw.prepare(
      `DELETE FROM user_port_watchlist WHERE user_id = ? AND port_id = ?`,
    )
    .run(userId, portId);
}
