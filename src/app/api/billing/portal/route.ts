import { getCurrentUser, isClerkEnabled } from "@/lib/auth/session";
import { getStripe, isStripeEnabled } from "@/lib/billing/stripe";
import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface UserRow {
  stripe_customer_id: string | null;
}

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
    return Response.json({ error: "must be signed in" }, { status: 401 });
  }

  const row = db()
    .raw.prepare(`SELECT stripe_customer_id FROM users WHERE id = ?`)
    .get(user.id) as UserRow | undefined;

  if (!row?.stripe_customer_id) {
    return Response.json(
      {
        error:
          "no Stripe customer linked yet — make a purchase first via /pricing",
      },
      { status: 404 },
    );
  }

  const stripe = getStripe()!;
  const origin = request.headers.get("origin") ?? "https://portflow.uk";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json(
      { error: "portal session failed", detail: (err as Error).message },
      { status: 500 },
    );
  }
}
