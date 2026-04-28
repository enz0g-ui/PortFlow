import { getStripe, tierFromPriceId } from "@/lib/billing/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

async function syncUserTier(
  userId: string,
  tier: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
) {
  const now = Date.now();
  db()
    .raw.prepare(
      `INSERT INTO users (id, tier, stripe_customer_id, stripe_subscription_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         tier = excluded.tier,
         stripe_customer_id = COALESCE(excluded.stripe_customer_id, users.stripe_customer_id),
         stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, users.stripe_subscription_id),
         updated_at = excluded.updated_at`,
    )
    .run(userId, tier, stripeCustomerId ?? null, stripeSubscriptionId ?? null, now, now);

  if (process.env.CLERK_SECRET_KEY) {
    try {
      const { createClerkClient } = await import("@clerk/backend");
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { tier },
      });
    } catch (err) {
      console.error("[stripe webhook] clerk metadata sync failed", err);
    }
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return Response.json(
      { error: "stripe webhook not configured" },
      { status: 503 },
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return Response.json({ error: "missing signature" }, { status: 400 });

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return Response.json(
      { error: "invalid signature", detail: (err as Error).message },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId =
        (s.metadata?.userId as string | undefined) ??
        (s.client_reference_id as string | null) ??
        null;
      const tier = (s.metadata?.tier as string | undefined) ?? "starter";
      if (userId) {
        await syncUserTier(
          userId,
          tier,
          (s.customer as string) ?? undefined,
          (s.subscription as string) ?? undefined,
        );
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const tier = priceId ? tierFromPriceId(priceId) : null;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const userId = (sub.metadata?.userId as string | undefined) ?? null;
      if (userId) {
        const finalTier =
          event.type === "customer.subscription.deleted" ? "free" : (tier ?? "free");
        await syncUserTier(userId, finalTier, customerId, sub.id);
      }
      break;
    }
  }

  return Response.json({ received: true });
}
