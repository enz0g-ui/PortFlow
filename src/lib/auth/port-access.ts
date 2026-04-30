import { TIER_LIMITS, type Tier } from "./tier";
import { listPortWatchlist } from "../port-watchlist";

/**
 * Resolves the set of port IDs a user can actually access for the dashboard
 * data feeds (vessels, kpis, voyages, anomalies, etc.).
 *
 * Model:
 * - **Tier with numeric `ports` cap** (free 3, starter 15, professional 30):
 *   dashboard access = the user's watchlist, capped to the tier limit.
 *   Most recent N picks survive a downgrade (older lose access).
 * - **Tier with `ports: "all"`** (pro+ / enterprise): unrestricted, "all".
 *
 * Auto-fill on tier upgrade (in webhook) ensures the watchlist is pre-loaded
 * with strategic ports up to the tier's limit, so a fresh paid signup
 * doesn't see an empty dashboard.
 *
 * Dev user (Clerk disabled): treated as enterprise upstream, never blocks.
 */
export function userAccessiblePortIds(
  userId: string,
  tier: Tier,
): "all" | Set<string> {
  const limit = TIER_LIMITS[tier].ports;
  if (limit === "all") return "all";
  // listPortWatchlist returns ORDER BY created_at DESC — keeps the most
  // recent picks accessible if a downgrade leaves leftover entries.
  const watchlist = listPortWatchlist(userId);
  return new Set(watchlist.slice(0, limit));
}

export function userCanAccessPort(
  userId: string,
  tier: Tier,
  portId: string,
): boolean {
  const accessible = userAccessiblePortIds(userId, tier);
  if (accessible === "all") return true;
  return accessible.has(portId);
}
