import { getCurrentUser } from "@/lib/auth/session";
import {
  alertsAllowed,
  countAlerts,
  createAlert,
  deleteAlert,
  listAlerts,
  maxAlerts,
  setAlertActive,
  type AlertEvent,
  type AlertKind,
} from "@/lib/alerts";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const VALID_KINDS = new Set<AlertKind>([
  "slack",
  "discord",
  "telegram",
  "webhook",
]);
const VALID_EVENTS = new Set<AlertEvent>([
  "vessel.arrived",
  "vessel.departed",
  "vessel.anomaly",
]);

function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return Response.json({
    alerts: listAlerts(user.id),
    max: maxAlerts(user.tier),
    allowed: alertsAllowed(user.tier),
    tier: user.tier,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!alertsAllowed(user.tier)) {
    return Response.json(
      {
        error: "alerts not available on this tier",
        tier: user.tier,
      },
      { status: 403 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    targetUrl?: string;
    event?: string;
    watchlistOnly?: boolean;
    portFilter?: string;
    label?: string;
  };
  const kind = body.kind as AlertKind;
  const event = body.event as AlertEvent;
  if (!VALID_KINDS.has(kind)) {
    return Response.json({ error: "invalid kind" }, { status: 400 });
  }
  if (!VALID_EVENTS.has(event)) {
    return Response.json({ error: "invalid event" }, { status: 400 });
  }
  if (!body.targetUrl || !isHttpsUrl(body.targetUrl)) {
    return Response.json(
      { error: "targetUrl must be a valid https URL" },
      { status: 400 },
    );
  }
  if (countAlerts(user.id) >= maxAlerts(user.tier)) {
    return Response.json(
      { error: "alerts limit reached", max: maxAlerts(user.tier) },
      { status: 403 },
    );
  }
  const created = createAlert({
    userId: user.id,
    kind,
    targetUrl: body.targetUrl,
    event,
    watchlistOnly: body.watchlistOnly !== false,
    portFilter: body.portFilter,
    label: body.label,
  });
  return Response.json({ alert: created });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  const ok = deleteAlert(id, user.id);
  if (!ok) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    id?: number;
    active?: boolean;
  };
  if (!body.id || typeof body.active !== "boolean") {
    return Response.json({ error: "id + active required" }, { status: 400 });
  }
  const ok = setAlertActive(body.id, user.id, body.active);
  if (!ok) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
