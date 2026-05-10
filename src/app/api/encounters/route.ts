import { listEncounters } from "@/lib/encounter-detector";
import { getStatic } from "@/lib/store";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/encounters?days=30&mmsi=...&chokepoint=cp_hormuz&sanctionedOnly=1
 *
 * Returns ship-to-ship encounters detected in the chokepoint zones.
 * In-house detection from our positions table — no GFW dependency.
 *
 * Killer query for compliance teams:
 *   /api/encounters?sanctionedOnly=1&days=180
 *   → every encounter where at least one party was on UKSL/OFAC/UN/EU
 *      sanctions list at the moment of detection.
 */

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const days = Number(sp.get("days") ?? 30);
  const limit = Number(sp.get("limit") ?? 100);
  const mmsi = sp.get("mmsi") ? Number(sp.get("mmsi")) : undefined;
  const chokepointId = sp.get("chokepoint") ?? undefined;
  const sanctionedOnly =
    sp.get("sanctionedOnly") === "1" || sp.get("sanctionedOnly") === "true";

  const rows = listEncounters({
    mmsi,
    chokepointId,
    sanctionedOnly,
    daysBack: days,
    limit,
  });

  const enriched = rows.map((r) => {
    const sa = getStatic(r.mmsiA);
    const sb = getStatic(r.mmsiB);
    return {
      ...r,
      vesselAName: sa?.name ?? null,
      vesselBName: sb?.name ?? null,
      vesselACargoClass: sa?.cargoClass ?? null,
      vesselBCargoClass: sb?.cargoClass ?? null,
    };
  });

  return Response.json({
    count: enriched.length,
    days,
    sanctionedOnly,
    encounters: enriched,
  });
}
