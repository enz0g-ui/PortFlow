import { getCurrentUser } from "@/lib/auth/session";
import {
  addVesselToUserWatchlist,
  countVesselWatchlist,
  maxVesselWatchlist,
  removeVesselByMmsi,
  vesselWatchlistMmsis,
} from "@/lib/watchlist";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return Response.json({
    mmsis: vesselWatchlistMmsis(user.id),
    max: maxVesselWatchlist(user.tier),
    tier: user.tier,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    mmsi?: number;
    label?: string;
    notes?: string;
  };
  const mmsi = Number(body.mmsi);
  if (!Number.isFinite(mmsi) || mmsi <= 0) {
    return Response.json({ error: "valid mmsi required" }, { status: 400 });
  }
  const max = maxVesselWatchlist(user.tier);
  if (max <= 0) {
    return Response.json(
      { error: "tier does not allow vessel watchlist", max, tier: user.tier },
      { status: 403 },
    );
  }
  if (countVesselWatchlist(user.id) >= max) {
    return Response.json(
      { error: "watchlist limit reached", max, tier: user.tier },
      { status: 403 },
    );
  }
  addVesselToUserWatchlist({
    userId: user.id,
    mmsi,
    label: body.label,
    notes: body.notes,
  });
  return Response.json({
    mmsis: vesselWatchlistMmsis(user.id),
    max,
    tier: user.tier,
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const mmsiParam = request.nextUrl.searchParams.get("mmsi");
  const mmsi = Number(mmsiParam);
  if (!Number.isFinite(mmsi) || mmsi <= 0) {
    return Response.json({ error: "valid mmsi required" }, { status: 400 });
  }
  removeVesselByMmsi(user.id, mmsi);
  return Response.json({
    mmsis: vesselWatchlistMmsis(user.id),
    max: maxVesselWatchlist(user.tier),
    tier: user.tier,
  });
}
