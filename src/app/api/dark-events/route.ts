import { listDarkEvents } from "@/lib/dark-events";
import { getPort } from "@/lib/ports";
import { getStatic } from "@/lib/store";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/dark-events?port=PORT_ID&days=30
 *
 * Returns recent AIS-off "dark fleet" events detected by the in-house
 * gap detector — vessels that stopped emitting AIS positions for >= 12 h
 * while underway (state='underway' at gap_start) and had a healthy feed
 * (>= 14 positions in the prior 12 h).
 *
 * Algorithm reference: Welch et al. 2022, Science Advances.
 * https://doi.org/10.1126/sciadv.abq2109
 *
 * Response includes vessel name and cargo class (joined from the in-memory
 * static-ship cache) so the UI doesn't need a separate lookup.
 */

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? undefined;
  if (portId && !getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const daysRaw = Number(request.nextUrl.searchParams.get("days") ?? 30);
  const days = Math.max(1, Math.min(180, Math.floor(daysRaw) || 30));
  const limit = Math.max(
    1,
    Math.min(500, Number(request.nextUrl.searchParams.get("limit") ?? 200) || 200),
  );

  const events = listDarkEvents({ port: portId, days, limit });

  // Enrich with vessel identity from the static-ship cache.
  const enriched = events.map((e) => {
    const stat = getStatic(e.mmsi);
    return {
      ...e,
      name: stat?.name ?? null,
      cargoClass: stat?.cargoClass ?? null,
      shipType: stat?.shipType ?? null,
    };
  });

  // Bucket counts for UI summary.
  const open = enriched.filter((e) => e.endTs === null).length;
  const closed = enriched.length - open;

  return Response.json({
    port: portId ?? null,
    days,
    summary: { total: enriched.length, open, closed },
    events: enriched,
  });
}
