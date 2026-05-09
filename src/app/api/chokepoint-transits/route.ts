import { listChokepointTransits } from "@/lib/chokepoint-detector";
import { getStatic } from "@/lib/store";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/chokepoint-transits?days=30&chokepoint=cp_hormuz&sanctionedOnly=1
 *
 * Returns recent vessel transits through the known maritime chokepoints
 * (Suez, Hormuz, Bab el-Mandeb, Malacca, Singapore, Bosphorus, Gibraltar,
 * Skagerrak, Dover, Panama, Cape of Good Hope, Magellan).
 *
 * Each transit row is enriched with vessel name from the static cache and
 * the snapshot was_sanctioned flag captured at entry.
 *
 * The killer query for compliance / sanctions teams:
 *   /api/chokepoint-transits?sanctionedOnly=1&days=30
 *   → "every UKSL-listed vessel that crossed a chokepoint in the last 30
 *      days, from our terrestrial AIS feed"
 */

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const days = Number(sp.get("days") ?? 30);
  const limit = Number(sp.get("limit") ?? 200);
  const chokepointId = sp.get("chokepoint") ?? undefined;
  const sanctionedOnly =
    sp.get("sanctionedOnly") === "1" || sp.get("sanctionedOnly") === "true";

  const transits = listChokepointTransits({
    chokepointId,
    sanctionedOnly,
    daysBack: days,
    limit,
  });

  // Enrich with vessel name from in-memory static cache.
  const enriched = transits.map((t) => {
    const stat = getStatic(t.mmsi);
    return {
      ...t,
      name: stat?.name ?? null,
      cargoClass: stat?.cargoClass ?? null,
      shipType: stat?.shipType ?? null,
    };
  });

  return Response.json({
    count: enriched.length,
    sanctionedOnly,
    days,
    transits: enriched,
  });
}
