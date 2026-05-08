import { listPiracyIncidents } from "@/lib/piracy-asam";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/piracy-incidents?days=365&bbox=minLat,minLon,maxLat,maxLon&limit=200
 *
 * Returns recent piracy / armed-robbery / maritime-security incidents from
 * the local DB (populated daily by the NGA ASAM ingestor). Source field is
 * "nga_asam" for now; future ingestors (IMB, UKMTO, ReCAAP) will populate
 * other sources into the same `piracy_incidents` table.
 *
 * Free, public domain US Gov data. Attribution credit on /legal & /sources.
 */

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const days = Number(sp.get("days") ?? 365);
  const limit = Number(sp.get("limit") ?? 200);
  const bboxStr = sp.get("bbox");
  let bbox: [number, number, number, number] | undefined;
  if (bboxStr) {
    const parts = bboxStr.split(",").map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      bbox = [parts[0], parts[1], parts[2], parts[3]];
    }
  }
  const incidents = listPiracyIncidents({ days, limit, bbox });
  return Response.json({
    count: incidents.length,
    incidents,
  });
}
