import { getCurrentUser } from "@/lib/auth/session";
import {
  isPushConfigured,
  savePushSubscription,
  removePushSubscription,
} from "@/lib/push";
import {
  alertsAllowed,
  countAlerts,
  createAlert,
  listAlerts,
  maxAlerts,
  type AlertEvent,
} from "@/lib/alerts";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface SubscribeBody {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
}

// Events auto-wired on first subscribe so the channel is useful immediately —
// the user can prune/extend them from /account like any other alert.
const DEFAULT_PUSH_EVENTS: AlertEvent[] = ["vessel.arrived", "vessel.departed"];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (user.isDemo) {
    // Demo identities are throwaway — a subscription would orphan instantly.
    return Response.json(
      { error: "push requires an account" },
      { status: 403 },
    );
  }
  if (!isPushConfigured()) {
    return Response.json({ error: "push not configured" }, { status: 503 });
  }

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys.auth) {
    return Response.json({ error: "invalid subscription" }, { status: 400 });
  }
  if (!sub.endpoint.startsWith("https://")) {
    return Response.json({ error: "invalid endpoint" }, { status: 400 });
  }

  savePushSubscription(user.id, {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });

  // Auto-create the default push alerts (idempotent, tier-gated).
  let alertsCreated = 0;
  if (alertsAllowed(user.tier)) {
    const existing = new Set(
      listAlerts(user.id)
        .filter((a) => a.kind === "push")
        .map((a) => a.event),
    );
    for (const event of DEFAULT_PUSH_EVENTS) {
      if (existing.has(event)) continue;
      if (countAlerts(user.id) >= maxAlerts(user.tier)) break;
      createAlert({
        userId: user.id,
        kind: "push",
        targetUrl: "push",
        event,
        watchlistOnly: true,
        label: "Mobile push",
      });
      alertsCreated++;
    }
  }

  return Response.json({ ok: true, alertsCreated });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  let body: { endpoint?: string };
  try {
    body = (await request.json()) as { endpoint?: string };
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.endpoint) {
    return Response.json({ error: "endpoint required" }, { status: 400 });
  }
  removePushSubscription(user.id, body.endpoint);
  return Response.json({ ok: true });
}
