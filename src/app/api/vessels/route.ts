import { getStatic, getVessels } from "@/lib/store";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import { isVesselSanctioned } from "@/lib/uk-sanctions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const vessels = getVessels(portId);
  // Enrich each vessel with a sanctioned flag (UK sanctions list, indexed
  // O(1) via uk-sanctions.isVesselSanctioned). Vessel type doesn't carry
  // IMO directly — we look it up from the static cache.
  const enriched = vessels.map((v) => {
    const stat = getStatic(v.mmsi);
    const sanctioned = isVesselSanctioned({
      mmsi: v.mmsi,
      imo: (stat as { imo?: number } | undefined)?.imo ?? null,
    });
    return sanctioned ? { ...v, sanctioned: true } : v;
  });
  return Response.json({
    ts: Date.now(),
    port: portId,
    count: enriched.length,
    vessels: enriched,
  });
}
