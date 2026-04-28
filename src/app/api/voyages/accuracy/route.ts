import { getVoyageAccuracy } from "@/lib/voyages";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const result = getVoyageAccuracy(portId, since);

  return Response.json({
    port: portId,
    windowDays: days,
    sampleCount: result.count,
    rmseHours: result.rmseHours,
    maeHours: result.maeHours,
    baselineRmseHours: result.baselineRmseHours,
    voyages: result.voyages.slice(0, 50).map((v) => ({
      voyageId: v.voyage_id,
      mmsi: v.mmsi,
      cargoClass: v.cargo_class,
      arrivedTs: v.arrived_ts,
      predictedEta: v.predicted_eta,
      broadcastEta: v.broadcast_eta,
      errorHours: v.predicted_eta
        ? (v.predicted_eta - (v.arrived_ts ?? 0)) / 3_600_000
        : null,
      baselineErrorHours: v.broadcast_eta
        ? (v.broadcast_eta - (v.arrived_ts ?? 0)) / 3_600_000
        : null,
    })),
  });
}
