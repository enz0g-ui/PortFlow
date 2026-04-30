import { db } from "./db";
import { TIER_LIMITS, type Tier } from "./auth/tier";
import { PORTS } from "./ports";

export function maxPortWatchlist(tier: Tier): number {
  const limit = TIER_LIMITS[tier].ports;
  return limit === "all" ? PORTS.length : limit;
}

/**
 * Bring the user's watchlist up to their tier's port limit by auto-adding
 * strategic ports they don't already have. Used after a tier upgrade so the
 * dashboard isn't empty for a fresh paid signup.
 *
 * - Sorts candidates: strategic-flagged first, then alphabetical (stable).
 * - Inserts with timestamps in the past so the user's *manual* picks stay
 *   at the top of /api/user/watchlist/ports (which orders DESC by created_at).
 * - No-op if watchlist is already at or above the cap.
 *
 * Returns the number of ports added.
 */
export function autoFillToTierLimit(userId: string, tier: Tier): number {
  const limit = TIER_LIMITS[tier].ports;
  const effective = limit === "all" ? PORTS.length : limit;
  const current = listPortWatchlist(userId);
  if (current.length >= effective) return 0;

  const have = new Set(current);
  const candidates = PORTS.filter((p) => !have.has(p.id))
    .slice() // don't mutate the global PORTS array
    .sort((a, b) => {
      const aStrat = a.strategic ? 0 : 1;
      const bStrat = b.strategic ? 0 : 1;
      if (aStrat !== bStrat) return aStrat - bStrat;
      return a.name.localeCompare(b.name);
    })
    .slice(0, effective - current.length);

  // Use timestamps far in the past so user's manual picks stay newest.
  const baseTs = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const stmt = db()
    .raw.prepare(
      `INSERT OR IGNORE INTO user_port_watchlist (user_id, port_id, created_at)
       VALUES (?, ?, ?)`,
    );
  for (let i = 0; i < candidates.length; i++) {
    stmt.run(userId, candidates[i].id, baseTs - i * 1000);
  }
  return candidates.length;
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
