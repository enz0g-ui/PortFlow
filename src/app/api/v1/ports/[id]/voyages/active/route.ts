import { db, type VoyageRow } from "@/lib/db";
import { getPort } from "@/lib/ports";
import { getStatic, getVessels } from "@/lib/store";
import { TANKER_CARGOS } from "@/lib/cargo";
import { gate, withHeaders } from "@/lib/api-auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = gate(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const port = getPort(id);
  if (!port) {
    return Response.json({ error: "unknown port" }, { status: 404 });
  }
  const onlyTankers = request.nextUrl.searchParams.get("tankersOnly") === "1";

  const rows = db()
    .raw.prepare(
      `SELECT * FROM voyages WHERE port = ? AND arrived_ts IS NULL ORDER BY start_ts DESC LIMIT 500`,
    )
    .all(id) as unknown as VoyageRow[];

  const vesselByMmsi = new Map(getVessels(id).map((v) => [v.mmsi, v]));

  const enriched = rows
    .map((row) => {
      const vessel = vesselByMmsi.get(row.mmsi);
      const stat = getStatic(row.mmsi);
      const cargoClass = row.cargo_class ?? stat?.cargoClass;
      return {
        voyageId: row.voyage_id,
        mmsi: row.mmsi,
        name: stat?.name,
        cargoClass,
        startTs: row.start_ts,
        startDistanceNm: row.start_distance_nm,
        currentSog: vessel?.sog,
        currentState: vessel?.state,
        zone: vessel?.zone,
        predictedEta: row.predicted_eta,
        broadcastEta: row.broadcast_eta,
        draught: stat?.draught,
      };
    })
    .filter((row) => {
      if (!onlyTankers) return true;
      return row.cargoClass && TANKER_CARGOS.has(row.cargoClass as never);
    });

  return withHeaders(
    {
      port: id,
      ts: Date.now(),
      count: enriched.length,
      voyages: enriched,
    },
    auth.headers,
  );
}
