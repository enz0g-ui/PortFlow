import { getVesselEvents, isGfwConfigured } from "@/lib/gfw";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/vessels/{mmsi}/events?days=90&types=encounter,loitering,port_visit
 *
 * Returns recent vessel-level events from Global Fishing Watch:
 *   - encounters: ship-to-ship transfers (>2h within 500m of another vessel)
 *   - loitering: stationary >2h far from any port
 *   - port_visit: confirmed port entry/exit
 *   - fishing: detected fishing activity
 *
 * Killer query for compliance teams:
 *   /api/vessels/{iranian_tanker_mmsi}/events?days=180&types=encounter
 *   → reveals every ship-to-ship transfer that vessel did over 6 months.
 *
 * Empty array if:
 *   - GFW_API_TOKEN not configured (returns ok=true, empty events,
 *     configured=false so the UI can show "Enable GFW" call-to-action)
 *   - MMSI not found in GFW vessel registry
 *   - No events of the requested types in the window
 */

interface RouteParams {
  params: Promise<{ mmsi: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { mmsi: mmsiStr } = await params;
  const mmsi = Number(mmsiStr);
  if (!Number.isFinite(mmsi) || mmsi < 100_000_000 || mmsi > 999_999_999) {
    return Response.json({ error: "invalid mmsi" }, { status: 400 });
  }

  if (!isGfwConfigured()) {
    return Response.json({
      ok: true,
      configured: false,
      mmsi,
      events: [],
      note: "GFW_API_TOKEN not set — see https://globalfishingwatch.org/our-apis/tokens",
    });
  }

  const sp = request.nextUrl.searchParams;
  const days = Math.max(1, Math.min(365, Number(sp.get("days") ?? 90)));
  const typesParam = sp.get("types");
  const allowed = ["encounter", "loitering", "port_visit", "fishing"] as const;
  type EventType = (typeof allowed)[number];
  const types: EventType[] = typesParam
    ? typesParam
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is EventType =>
          (allowed as readonly string[]).includes(s),
        )
    : ["encounter", "loitering", "port_visit"];

  const events = await getVesselEvents({ mmsi, daysBack: days, types });

  return Response.json({
    ok: true,
    configured: true,
    mmsi,
    days,
    types,
    count: events.length,
    events,
    license:
      "Global Fishing Watch — free for non-commercial use. Commercial redistribution requires GFW commercial license.",
  });
}
