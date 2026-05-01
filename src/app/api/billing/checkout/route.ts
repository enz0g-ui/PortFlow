import { getCurrentUser, isClerkEnabled } from "@/lib/auth/session";
import {
  type BillingCycle,
  getStripe,
  getStripePriceId,
  isStripeEnabled,
} from "@/lib/billing/stripe";
import type { Tier } from "@/lib/auth/tier";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isStripeEnabled()) {
    return Response.json(
      { error: "stripe disabled — set STRIPE_SECRET_KEY" },
      { status: 503 },
    );
  }
  if (!isClerkEnabled()) {
    return Response.json(
      { error: "auth disabled — set CLERK_SECRET_KEY first" },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user || user.id === "dev") {
    return Response.json(
      { error: "must be signed in" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    tier?: Tier;
    cycle?: BillingCycle;
  };
  const tier = body.tier;
  const cycle: BillingCycle = body.cycle === "yearly" ? "yearly" : "monthly";
  if (!tier || tier === "free") {
    return Response.json({ error: "invalid tier" }, { status: 400 });
  }
  const priceId = getStripePriceId(tier, cycle);
  if (!priceId) {
    return Response.json(
      {
        error: `Stripe price missing for ${tier} ${cycle} — set STRIPE_PRICE_${tier.toUpperCase()}${
          cycle === "yearly" ? "_YEARLY" : ""
        }`,
      },
      { status: 400 },
    );
  }

  const stripe = getStripe()!;
  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${origin}/account?status=success&tier=${tier}&cycle=${cycle}`,
    cancel_url: `${origin}/pricing?status=cancelled`,
    metadata: {
      userId: user.id,
      tier,
      cycle,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        tier,
        cycle,
      },
    },
    allow_promotion_codes: true,
  });

  return Response.json({ id: session.id, url: session.url });
}
