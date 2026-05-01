import { getStripe } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

/**
 * GET /api/founder/slots
 *
 * Returns founder-pricing availability based on a Stripe promotion code.
 *
 *   {
 *     enabled: true,
 *     code: "FOUNDER",          // human-readable promo code (Stripe `promotion_code.code`)
 *     remaining: 73,            // max_redemptions - times_redeemed
 *     max: 100,
 *     percentOff: 30,           // discount on the underlying coupon
 *     duration: "forever"       // coupon duration ("forever", "once", "repeating")
 *   }
 *
 * Response when the env var is missing or no promo code is found:
 *   { enabled: false, reason: "STRIPE_FOUNDER_PROMO_CODE_ID not set" }
 *
 * Cached in-process for 60 seconds to avoid hammering the Stripe API on
 * every pricing-page load.
 */

interface SlotsCache {
  fetchedAt: number;
  payload: unknown;
}
let cache: SlotsCache | null = null;
const TTL_MS = 60_000;

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return Response.json(cache.payload);
  }

  const stripe = getStripe();
  const promoId = process.env.STRIPE_FOUNDER_PROMO_CODE_ID;
  if (!stripe || !promoId) {
    const payload = {
      enabled: false,
      reason: !stripe
        ? "stripe not configured"
        : "STRIPE_FOUNDER_PROMO_CODE_ID not set",
    };
    cache = { fetchedAt: Date.now(), payload };
    return Response.json(payload);
  }

  try {
    // The newer Stripe Promotion Code API shape is:
    //   { id, code, active, max_redemptions, times_redeemed,
    //     promotion: { type: "coupon", coupon: "<coupon_id>" } }
    // Older SDKs expose `coupon` at the top level. We accept both.
    const promo = (await stripe.promotionCodes.retrieve(promoId)) as unknown as {
      active: boolean;
      code: string;
      max_redemptions: number | null;
      times_redeemed: number;
      coupon?: string | { id: string };
      promotion?: { type?: string; coupon?: string | { id: string } };
    };
    if (!promo.active) {
      const payload = { enabled: false, reason: "promo inactive" };
      cache = { fetchedAt: Date.now(), payload };
      return Response.json(payload);
    }
    const couponField = promo.promotion?.coupon ?? promo.coupon;
    const couponId =
      typeof couponField === "string" ? couponField : couponField?.id;
    if (!couponId) {
      const payload = {
        enabled: false,
        reason: "promotion code has no coupon attached",
      };
      cache = { fetchedAt: Date.now(), payload };
      return Response.json(payload);
    }
    const coupon = (await stripe.coupons.retrieve(couponId)) as unknown as {
      max_redemptions: number | null;
      times_redeemed: number;
      percent_off: number | null;
      amount_off: number | null;
      duration: string;
    };
    const max = coupon.max_redemptions ?? promo.max_redemptions ?? null;
    const used = coupon.times_redeemed ?? promo.times_redeemed ?? 0;
    const remaining = max != null ? Math.max(0, max - used) : null;
    const payload = {
      enabled: remaining == null || remaining > 0,
      code: promo.code,
      remaining,
      max,
      percentOff: coupon.percent_off ?? null,
      amountOff: coupon.amount_off ?? null,
      duration: coupon.duration,
    };
    cache = { fetchedAt: Date.now(), payload };
    return Response.json(payload);
  } catch (err) {
    const payload = {
      enabled: false,
      reason: "stripe call failed",
      detail: (err as Error).message,
    };
    return Response.json(payload, { status: 502 });
  }
}
