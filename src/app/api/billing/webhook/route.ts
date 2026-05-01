import {
  cycleFromPriceId,
  getStripe,
  tierFromPriceId,
  type BillingCycle,
} from "@/lib/billing/stripe";
import { db } from "@/lib/db";
import { autoFillToTierLimit } from "@/lib/port-watchlist";
import type { Tier } from "@/lib/auth/tier";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

interface SyncUserTierOpts {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  email?: string | null;
  billingCycle?: BillingCycle | null;
}

async function syncUserTier(
  userId: string,
  tier: string,
  opts: SyncUserTierOpts = {},
) {
  const { stripeCustomerId, stripeSubscriptionId, email, billingCycle } = opts;
  const now = Date.now();
  db()
    .raw.prepare(
      `INSERT INTO users (id, email, tier, stripe_customer_id, stripe_subscription_id, billing_cycle, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = COALESCE(excluded.email, users.email),
         tier = excluded.tier,
         stripe_customer_id = COALESCE(excluded.stripe_customer_id, users.stripe_customer_id),
         stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, users.stripe_subscription_id),
         billing_cycle = COALESCE(excluded.billing_cycle, users.billing_cycle),
         updated_at = excluded.updated_at`,
    )
    .run(
      userId,
      email ?? null,
      tier,
      stripeCustomerId ?? null,
      stripeSubscriptionId ?? null,
      billingCycle ?? null,
      now,
      now,
    );

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
      // Cycle: prefer metadata (set by /api/billing/checkout), fallback to
      // deriving from the line-item price id if metadata is missing.
      const metaCycle = s.metadata?.cycle as string | undefined;
      let cycle: BillingCycle | null =
        metaCycle === "yearly" ? "yearly" : metaCycle === "monthly" ? "monthly" : null;
      if (!cycle && s.subscription) {
        try {
          const subId =
            typeof s.subscription === "string" ? s.subscription : s.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price.id;
          if (priceId) cycle = cycleFromPriceId(priceId);
        } catch (err) {
          console.error("[stripe webhook] subscription retrieve for cycle failed", err);
        }
      }
      if (userId) {
        await syncUserTier(userId, tier, {
          stripeCustomerId: (s.customer as string) ?? undefined,
          stripeSubscriptionId: (s.subscription as string) ?? undefined,
          email: s.customer_details?.email ?? null,
          billingCycle: cycle,
        });
        try {
          const added = autoFillToTierLimit(userId, tier as Tier);
          if (added > 0) {
            console.log(
              `[stripe webhook] auto-filled ${added} ports for ${userId} → ${tier}`,
            );
          }
        } catch (err) {
          console.error("[stripe webhook] autofill failed", err);
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const tier = priceId ? tierFromPriceId(priceId) : null;
      const cycle = priceId ? cycleFromPriceId(priceId) : null;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const userId = (sub.metadata?.userId as string | undefined) ?? null;
      if (userId) {
        const finalTier =
          event.type === "customer.subscription.deleted" ? "free" : (tier ?? "free");
        // On delete keep last known cycle; on update persist the (possibly new) one.
        await syncUserTier(userId, finalTier, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          billingCycle: event.type === "customer.subscription.deleted" ? null : cycle,
        });
        try {
          const added = autoFillToTierLimit(userId, finalTier as Tier);
          if (added > 0) {
            console.log(
              `[stripe webhook] auto-filled ${added} ports for ${userId} → ${finalTier}`,
            );
          }
        } catch (err) {
          console.error("[stripe webhook] autofill failed", err);
        }
      }
      break;
    }
  }

  return Response.json({ received: true });
}
