import { getCurrentUser } from "@/lib/auth/session";
import { TIER_LIMITS } from "@/lib/auth/tier";
import { getUserKeyPlain, listUserKeysMasked } from "@/lib/integration-keys";
import { getPort } from "@/lib/ports";
import { SATELLITE_SOURCES } from "@/lib/satellites/registry";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * BYO satellite vendor fetch — Pro+ users only.
 *
 * GET /api/user/satellite/{providerId}/fixes?port=PORT_ID&sinceHours=24
 *
 * - Looks up the calling user
 * - Decrypts their stored vendor keys for {providerId}
 * - Calls provider.fetchFixes with the user's keys as env override
 * - Returns the fixes (vessel positions) for the caller to merge into UI
 *
 * Requires:
 * - User authenticated
 * - Tier with sarFusion (Pro+ / Enterprise) — same gate as BYO key UI
 * - Provider supports fetchFixes
 * - User has at least one key configured for the provider
 */

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!TIER_LIMITS[user.tier].sarFusion) {
    return Response.json(
      {
        error: "BYO vendor fetch requires Pro+ or Enterprise plan",
        tier: user.tier,
      },
      { status: 403 },
    );
  }

  const { id: providerId } = await ctx.params;
  const provider = SATELLITE_SOURCES.find((s) => s.id === providerId);
  if (!provider) {
    return Response.json({ error: "unknown provider" }, { status: 404 });
  }
  if (typeof provider.fetchFixes !== "function") {
    return Response.json(
      {
        error: `provider ${providerId} does not yet implement fetchFixes`,
        integration: provider.integration,
        eta: provider.integrationEta,
      },
      { status: 501 },
    );
  }

  const portId = request.nextUrl.searchParams.get("port");
  if (!portId) {
    return Response.json({ error: "port query required" }, { status: 400 });
  }
  const port = getPort(portId);
  if (!port) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }

  const sinceHours = Math.max(
    1,
    Math.min(168, Number(request.nextUrl.searchParams.get("sinceHours")) || 6),
  );
  const sinceMs = Date.now() - sinceHours * 3600_000;

  const userKeys = listUserKeysMasked(user.id).filter(
    (k) => k.sourceId === providerId,
  );
  if (userKeys.length === 0) {
    return Response.json(
      {
        error: `no key configured for ${providerId}. Paste it on /sources first.`,
      },
      { status: 412 },
    );
  }

  const env: Record<string, string> = {};
  for (const k of userKeys) {
    const plain = getUserKeyPlain(user.id, providerId, k.envKeyName);
    if (plain) env[k.envKeyName] = plain;
  }
  if (Object.keys(env).length === 0) {
    return Response.json(
      { error: "could not decrypt your stored keys (master key mismatch?)" },
      { status: 500 },
    );
  }

  try {
    const fixes = await provider.fetchFixes(
      { id: port.id, bbox: port.bbox },
      sinceMs,
      { env, signal: AbortSignal.timeout(15_000) },
    );
    return Response.json({
      provider: providerId,
      port: portId,
      sinceMs,
      count: fixes.length,
      fixes,
    });
  } catch (err) {
    return Response.json(
      {
        provider: providerId,
        error: "fetch failed",
        detail: (err as Error).message,
      },
      { status: 502 },
    );
  }
}
