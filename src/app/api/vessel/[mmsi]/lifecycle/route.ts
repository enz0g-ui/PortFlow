import { vesselLifecycle } from "@/lib/db";
import { getStatic } from "@/lib/store";
import { PORTS_BY_ID } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mmsi: string }> },
) {
  const { mmsi: mmsiStr } = await params;
  const mmsi = Number(mmsiStr);
  if (!Number.isFinite(mmsi)) {
    return Response.json({ error: "invalid mmsi" }, { status: 400 });
  }
  const days = Number(request.nextUrl.searchParams.get("days") ?? "180");
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const voyages = vesselLifecycle(mmsi, since);
  const stat = getStatic(mmsi);

  const enriched = voyages.map((v) => {
    const port = PORTS_BY_ID[v.port];
    return {
      voyageId: v.voyage_id,
      port: v.port,
      portName: port?.name ?? v.port,
      portFlag: port?.flag,
      cargoClass: v.cargo_class,
      startTs: v.start_ts,
      arrivedTs: v.arrived_ts,
      departedTs: v.departed_ts,
      predictedEta: v.predicted_eta,
      broadcastEta: v.broadcast_eta,
      arrivalZone: v.arrival_zone,
      draughtArrived: v.draught_arrived,
      transitDurationMs:
        v.arrived_ts && v.start_ts ? v.arrived_ts - v.start_ts : null,
      stayDurationMs:
        v.arrived_ts && v.departed_ts ? v.departed_ts - v.arrived_ts : null,
    };
  });

  return Response.json({
    mmsi,
    name: stat?.name,
    cargoClass: stat?.cargoClass,
    windowDays: days,
    portsVisited: new Set(voyages.map((v) => v.port)).size,
    voyages: enriched,
  });
}
