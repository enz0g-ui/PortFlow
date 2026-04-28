export const TIERS = ["free", "starter", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

export interface TierLimits {
  ports: number | "all";
  rateLimitPerMinute: number;
  historyDays: number;
  webhooks: boolean;
  apiAccess: boolean;
  watchlistMax: number;
  csvExport: boolean;
  sarFusion: boolean;
  sanctionsScreening: boolean;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    ports: 3,
    rateLimitPerMinute: 30,
    historyDays: 7,
    webhooks: false,
    apiAccess: false,
    watchlistMax: 0,
    csvExport: false,
    sarFusion: false,
    sanctionsScreening: false,
  },
  starter: {
    ports: 15,
    rateLimitPerMinute: 120,
    historyDays: 30,
    webhooks: true,
    apiAccess: true,
    watchlistMax: 25,
    csvExport: true,
    sarFusion: false,
    sanctionsScreening: false,
  },
  pro: {
    ports: "all",
    rateLimitPerMinute: 600,
    historyDays: 90,
    webhooks: true,
    apiAccess: true,
    watchlistMax: 250,
    csvExport: true,
    sarFusion: true,
    sanctionsScreening: true,
  },
  enterprise: {
    ports: "all",
    rateLimitPerMinute: 6000,
    historyDays: 365,
    webhooks: true,
    apiAccess: true,
    watchlistMax: 10000,
    csvExport: true,
    sarFusion: true,
    sanctionsScreening: true,
  },
};

export function tierAllowsPort(tier: Tier, portIndex: number): boolean {
  const limit = TIER_LIMITS[tier].ports;
  if (limit === "all") return true;
  return portIndex < limit;
}
