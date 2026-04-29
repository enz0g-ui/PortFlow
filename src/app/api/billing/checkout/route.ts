import { getCurrentUser, isClerkEnabled } from "@/lib/auth/session";
import {
  STRIPE_PRICE_BY_TIER,
  getStripe,
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
  };
  const tier = body.tier;
  if (!tier || tier === "free" || !STRIPE_PRICE_BY_TIER[tier]) {
    return Response.json(
      { error: "invalid tier or missing STRIPE_PRICE_* env" },
      { status: 400 },
    );
  }

  const priceId = STRIPE_PRICE_BY_TIER[tier]!;
  const stripe = getStripe()!;
  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${origin}/billing?status=success&tier=${tier}`,
    cancel_url: `${origin}/billing?status=cancelled`,
    metadata: {
      userId: user.id,
      tier,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        tier,
      },
    },
  });

  return Response.json({ id: session.id, url: session.url });
}
