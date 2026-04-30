import { TIER_LIMITS, type Tier } from "./tier";
import { listPortWatchlist } from "../port-watchlist";

/**
 * Resolves the set of port IDs a user can actually access for the dashboard
 * data feeds (vessels, kpis, voyages, anomalies, etc.).
 *
 * - Tier "all" (pro/professional/enterprise): unrestricted, returns "all".
 * - Free / starter (numeric limit): the user's bookmarked port watchlist
 *   becomes their accessible set. They pick which ports they care about.
 *   Ports beyond the limit silently ignored (cap respected by the watchlist
 *   POST endpoint already).
 * - Dev user (Clerk disabled): treated as enterprise upstream by
 *   getCurrentUser, so this function never blocks.
 */
export function userAccessiblePortIds(
  userId: string,
  tier: Tier,
): "all" | Set<string> {
  const limit = TIER_LIMITS[tier].ports;
  if (limit === "all") return "all";
  return new Set(listPortWatchlist(userId));
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
