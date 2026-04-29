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

export const STRIPE_PRICE_BY_TIER: Record<
  Exclude<Tier, "free">,
  string | undefined
> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

export function tierFromPriceId(priceId: string): Tier | null {
  for (const [tier, id] of Object.entries(STRIPE_PRICE_BY_TIER)) {
    if (id === priceId) return tier as Tier;
  }
  return null;
}
