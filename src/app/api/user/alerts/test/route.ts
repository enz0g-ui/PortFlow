import { getCurrentUser } from "@/lib/auth/session";
import { fireVesselEvent } from "@/lib/alerts";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Admin/owner test endpoint — fires a fake vessel.arrived event for the
 * caller's own user_id. Lets a Pro+ user verify their alert pipeline
 * (Slack / Telegram / Email / webhook) end-to-end without waiting for a
 * real vessel arrival.
 *
 * GET /api/user/alerts/test?event=vessel.arrived
 *
 * Rate-limited per-user (one fire every 30s).
 */

const lastFireByUser = new Map<string, number>();

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const now = Date.now();
  const last = lastFireByUser.get(user.id) ?? 0;
  if (now - last < 30_000) {
    return Response.json(
      {
        error: "rate-limited",
        retryAfterSec: Math.ceil((30_000 - (now - last)) / 1000),
      },
      { status: 429 },
    );
  }
  lastFireByUser.set(user.id, now);

  const eventParam = request.nextUrl.searchParams.get("event") ?? "vessel.arrived";
  const event =
    eventParam === "vessel.departed"
      ? "vessel.departed"
      : eventParam === "vessel.anomaly"
        ? "vessel.anomaly"
        : "vessel.arrived";

  const fired = await fireVesselEvent(event, {
    mmsi: 999999999,
    vesselName: "TEST VESSEL — Port Flow alert pipeline check",
    port: "rotterdam",
    portName: "Rotterdam",
    cargoClass: "crude",
    ts: now,
    detail: "This is a test event triggered manually from /api/user/alerts/test",
  });

  return Response.json({
    ok: true,
    event,
    firedToAlerts: fired,
    note: "Check your configured alerts (Slack/Telegram/Email/webhook). Watchlist-only alerts will NOT fire because mmsi 999999999 is not in your watchlist.",
  });
}
