import { getCurrentUser } from "@/lib/auth/session";
import { TIER_LIMITS } from "@/lib/auth/tier";
import {
  listUserKeysMasked,
  removeUserKey,
  setUserKey,
} from "@/lib/integration-keys";
import { SATELLITE_SOURCES } from "@/lib/satellites/registry";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function userCanByoKey(tier: string): boolean {
  if (tier === "enterprise" || tier === "pro") return true;
  return false;
}

function isValidSource(sourceId: string, envKeyName: string): boolean {
  const src = SATELLITE_SOURCES.find((s) => s.id === sourceId);
  if (!src) return false;
  return src.envKeys.includes(envKeyName);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return Response.json({
    keys: listUserKeysMasked(user.id),
    canByoKey: userCanByoKey(user.tier),
    tier: user.tier,
    operatorWatchlistMax: TIER_LIMITS[user.tier].watchlistMax,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!userCanByoKey(user.tier)) {
    return Response.json(
      {
        error: "Bring-your-own-key requires Pro or Enterprise tier",
        tier: user.tier,
      },
      { status: 403 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as {
    sourceId?: string;
    envKeyName?: string;
    value?: string;
  };
  const { sourceId, envKeyName, value } = body;
  if (
    typeof sourceId !== "string" ||
    typeof envKeyName !== "string" ||
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return Response.json(
      { error: "sourceId, envKeyName, value (non-empty) required" },
      { status: 400 },
    );
  }
  if (!isValidSource(sourceId, envKeyName)) {
    return Response.json(
      { error: "unknown sourceId or envKeyName for that source" },
      { status: 400 },
    );
  }
  if (value.length > 4096) {
    return Response.json({ error: "value too long" }, { status: 400 });
  }
  setUserKey({
    userId: user.id,
    sourceId,
    envKeyName,
    value: value.trim(),
  });
  return Response.json({
    keys: listUserKeysMasked(user.id),
    canByoKey: true,
    tier: user.tier,
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const sourceId = request.nextUrl.searchParams.get("sourceId");
  const envKeyName = request.nextUrl.searchParams.get("envKeyName");
  if (!sourceId || !envKeyName) {
    return Response.json(
      { error: "sourceId and envKeyName required" },
      { status: 400 },
    );
  }
  removeUserKey({ userId: user.id, sourceId, envKeyName });
  return Response.json({
    keys: listUserKeysMasked(user.id),
    canByoKey: userCanByoKey(user.tier),
    tier: user.tier,
  });
}
