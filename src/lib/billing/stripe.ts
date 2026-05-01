import Stripe from "stripe";
import type { Tier } from "../auth/tier";

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return cached;
}

export function isStripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export type BillingCycle = "monthly" | "yearly";

export interface TierPrices {
  monthly?: string;
  yearly?: string;
}

export const STRIPE_PRICES: Record<Exclude<Tier, "free">, TierPrices> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL,
    yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE,
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
  },
};

/** Backwards-compat: monthly-only map (used by older code). */
export const STRIPE_PRICE_BY_TIER: Record<
  Exclude<Tier, "free">,
  string | undefined
> = {
  starter: STRIPE_PRICES.starter.monthly,
  professional: STRIPE_PRICES.professional.monthly,
  pro: STRIPE_PRICES.pro.monthly,
  enterprise: STRIPE_PRICES.enterprise.monthly,
};

export function getStripePriceId(
  tier: Exclude<Tier, "free">,
  cycle: BillingCycle,
): string | undefined {
  return STRIPE_PRICES[tier]?.[cycle];
}

export function tierFromPriceId(priceId: string): Tier | null {
  for (const [tier, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return tier as Tier;
    }
  }
  return null;
}

export function cycleFromPriceId(priceId: string): BillingCycle | null {
  for (const prices of Object.values(STRIPE_PRICES)) {
    if (prices.monthly === priceId) return "monthly";
    if (prices.yearly === priceId) return "yearly";
  }
  return null;
}
