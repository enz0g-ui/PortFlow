import { getCurrentUser } from "@/lib/auth/session";
import {
  addPortToWatchlist,
  countPortWatchlist,
  listPortWatchlist,
  maxPortWatchlist,
  removePortFromWatchlist,
} from "@/lib/port-watchlist";
import { runMigrations } from "@/lib/migrations";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

let migrated = false;
function ensureMigrated() {
  if (migrated) return;
  runMigrations();
  migrated = true;
}

export async function GET() {
  ensureMigrated();
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return Response.json({
    portIds: listPortWatchlist(user.id),
    max: maxPortWatchlist(user.tier),
    tier: user.tier,
  });
}

export async function POST(request: NextRequest) {
  ensureMigrated();
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { portId?: string };
  const portId = body.portId?.trim();
  if (!portId) {
    return Response.json({ error: "portId required" }, { status: 400 });
  }
  const max = maxPortWatchlist(user.tier);
  const current = countPortWatchlist(user.id);
  if (current >= max) {
    return Response.json(
      {
        error: "watchlist limit reached",
        max,
        tier: user.tier,
      },
      { status: 403 },
    );
  }
  addPortToWatchlist(user.id, portId);
  return Response.json({
    portIds: listPortWatchlist(user.id),
    max,
    tier: user.tier,
  });
}

export async function DELETE(request: NextRequest) {
  ensureMigrated();
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const portId = request.nextUrl.searchParams.get("portId");
  if (!portId) {
    return Response.json({ error: "portId required" }, { status: 400 });
  }
  removePortFromWatchlist(user.id, portId);
  return Response.json({
    portIds: listPortWatchlist(user.id),
    max: maxPortWatchlist(user.tier),
    tier: user.tier,
  });
}
