import { TIER_LIMITS, type Tier } from "./tier";
import { listPortWatchlist } from "../port-watchlist";

/**
 * Resolves the set of port IDs a user can actually access for the dashboard
 * data feeds (vessels, kpis, voyages, anomalies, etc.).
 *
 * Model:
 * - **Free** is strict: dashboard access is gated by the user's 3-port
 *   watchlist. They MUST pick which 3 ports they care about (forces /welcome
 *   engagement and demonstrates the limit). The watchlist IS the access list.
 * - **Paid tiers** (starter/professional/pro/enterprise) get unrestricted
 *   dashboard access to all 51 ports. The TIER_LIMITS.ports number for paid
 *   tiers is the maximum watchlist size (favorites for alerts / CSV / personal
 *   layers), not a dashboard view restriction. The pitch on /pricing is
 *   "your alerts/CSV scope is N ports", not "you can only browse N ports".
 * - Dev user (Clerk disabled): treated as enterprise upstream by
 *   getCurrentUser, so this function never blocks.
 */
export function userAccessiblePortIds(
  userId: string,
  tier: Tier,
): "all" | Set<string> {
  if (tier !== "free") return "all";
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
