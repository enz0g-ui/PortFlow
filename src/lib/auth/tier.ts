export const TIERS = [
  "free",
  "starter",
  "professional",
  "pro",
  "enterprise",
] as const;
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

// Pricing model decision (2026-05-23): all tiers see all 51 ports
// (Modèle B). Tanker trader use case requires 15-20 ports minimum
// (chokepoints + ARA + Middle East + bunkering hubs), so port-count
// gating just adds friction without strategic value. Differentiation
// is on workflow features: watchlist size, API/webhooks, SAR fusion,
// sanctions screening, history depth.
export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    ports: "all",
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
    ports: "all",
    rateLimitPerMinute: 120,
    historyDays: 30,
    webhooks: true,
    apiAccess: true,
    watchlistMax: 25,
    csvExport: true,
    sarFusion: false,
    sanctionsScreening: false,
  },
  professional: {
    ports: "all",
    rateLimitPerMinute: 300,
    historyDays: 60,
    webhooks: true,
    apiAccess: true,
    watchlistMax: 100,
    csvExport: true,
    sarFusion: false,
    sanctionsScreening: true,
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
