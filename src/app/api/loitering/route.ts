import { listLoiteringEvents } from "@/lib/loitering-detector";
import { getStatic } from "@/lib/store";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/loitering?days=30&mmsi=...&sanctionedOnly=1
 *
 * Returns vessel loitering events: SOG <2 kn for >2h, far from any port
 * (>10 nm from port centers). Computed in-house from our positions table.
 *
 * Useful for: detecting suspicious staging before ship-to-ship transfers,
 * unusual long stops mid-ocean, dark-fleet bunkering operations.
 */

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const days = Number(sp.get("days") ?? 30);
  const limit = Number(sp.get("limit") ?? 100);
  const mmsi = sp.get("mmsi") ? Number(sp.get("mmsi")) : undefined;
  const sanctionedOnly =
    sp.get("sanctionedOnly") === "1" || sp.get("sanctionedOnly") === "true";

  const rows = listLoiteringEvents({
    mmsi,
    sanctionedOnly,
    daysBack: days,
    limit,
  });

  const enriched = rows.map((r) => {
    const stat = getStatic(r.mmsi);
    return {
      ...r,
      name: stat?.name ?? null,
      cargoClass: stat?.cargoClass ?? null,
    };
  });

  return Response.json({
    count: enriched.length,
    days,
    sanctionedOnly,
    events: enriched,
  });
}
