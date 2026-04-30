import { getCurrentUser } from "@/lib/auth/session";
import { userAccessiblePortIds } from "@/lib/auth/port-access";
import { TIER_LIMITS } from "@/lib/auth/tier";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { authenticated: false, tier: "free" },
      { status: 200 },
    );
  }
  const accessible = userAccessiblePortIds(user.id, user.tier);
  const limits = TIER_LIMITS[user.tier];
  return Response.json({
    authenticated: true,
    id: user.id,
    email: user.email ?? null,
    tier: user.tier,
    portsLimit: limits.ports,
    portsAccessible:
      accessible === "all" ? "all" : Array.from(accessible),
    limits: {
      ports: limits.ports,
      rateLimitPerMinute: limits.rateLimitPerMinute,
      historyDays: limits.historyDays,
      webhooks: limits.webhooks,
      apiAccess: limits.apiAccess,
      watchlistMax: limits.watchlistMax,
      csvExport: limits.csvExport,
      sarFusion: limits.sarFusion,
      sanctionsScreening: limits.sanctionsScreening,
    },
  });
}
