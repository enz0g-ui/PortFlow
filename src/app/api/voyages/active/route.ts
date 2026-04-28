import { db, type VoyageRow } from "@/lib/db";
import { getStatic, getVessels } from "@/lib/store";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import { TANKER_CARGOS } from "@/lib/cargo";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const NM_PER_DEG_LAT = 60;

function distanceNm(
  centerLat: number,
  centerLon: number,
  lat: number,
  lon: number,
): number {
  const dLat = lat - centerLat;
  const dLon = (lon - centerLon) * Math.cos((lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon) * NM_PER_DEG_LAT;
}

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  const port = getPort(portId);
  if (!port) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const onlyTankers = request.nextUrl.searchParams.get("tankersOnly") === "1";

  const allOpen = db()
    .raw.prepare(
      `SELECT * FROM voyages WHERE port = ? AND arrived_ts IS NULL ORDER BY start_ts DESC LIMIT 500`,
    )
    .all(portId) as unknown as VoyageRow[];

  const vesselByMmsi = new Map(getVessels(portId).map((v) => [v.mmsi, v]));

  const enriched = allOpen
    .map((row) => {
      const vessel = vesselByMmsi.get(row.mmsi);
      const stat = getStatic(row.mmsi);
      const cargoClass = (row.cargo_class ?? stat?.cargoClass) as
        | string
        | undefined;
      const distance = vessel
        ? distanceNm(
            port.center[0],
            port.center[1],
            vessel.latitude,
            vessel.longitude,
          )
        : row.start_distance_nm;
      return {
        voyageId: row.voyage_id,
        mmsi: row.mmsi,
        name: stat?.name ?? `MMSI ${row.mmsi}`,
        cargoClass,
        startTs: row.start_ts,
        startDistanceNm: row.start_distance_nm,
        currentDistanceNm: distance,
        currentSog: vessel?.sog ?? 0,
        currentState: vessel?.state ?? "unknown",
        zone: vessel?.zone,
        predictedEta: row.predicted_eta,
        predictedAt: row.predicted_at,
        broadcastEta: row.broadcast_eta,
        draught: stat?.draught,
      };
    })
    .filter((row) => {
      if (!onlyTankers) return true;
      return row.cargoClass && TANKER_CARGOS.has(row.cargoClass as never);
    })
    .sort((a, b) => {
      const aEta = a.predictedEta ?? Infinity;
      const bEta = b.predictedEta ?? Infinity;
      return aEta - bEta;
    });

  return Response.json({
    port: portId,
    ts: Date.now(),
    count: enriched.length,
    voyages: enriched,
  });
}
