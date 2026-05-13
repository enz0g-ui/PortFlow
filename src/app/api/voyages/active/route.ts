import { db, type VoyageRow } from "@/lib/db";
import { getStatic, getVessels } from "@/lib/store";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import { TANKER_CARGOS } from "@/lib/cargo";
import { isVesselSanctioned } from "@/lib/uk-sanctions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const NM_PER_DEG_LAT = 60;

/**
 * Voyage classification thresholds. An open voyage is "inbound" iff the
 * vessel is actively moving towards the port:
 *  - SOG ≥ INBOUND_MIN_SOG_KN (vessel is moving)
 *  - distance ≥ INBOUND_MIN_DISTANCE_NM (not already at the gate)
 *  - course is roughly convergent on the port (|bearing-to-port − COG| ≤
 *    INBOUND_MAX_BEARING_DIFF_DEG)
 *
 * Otherwise the voyage is "waiting" — vessel anchored in roads, drifting,
 * or heading away. Both states are still open voyages; this only changes
 * how we surface them in the UI.
 */
const INBOUND_MIN_SOG_KN = 2;
const INBOUND_MIN_DISTANCE_NM = 3;
const INBOUND_MAX_BEARING_DIFF_DEG = 60;

export type VoyageState = "inbound" | "waiting";

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

function bearingDeg(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(fromLat);
  const φ2 = toRad(toLat);
  const Δλ = toRad(toLon - fromLon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b + 540) % 360) - 180);
  return d;
}

function classifyVoyage(
  vessel: { sog: number; cog: number; latitude: number; longitude: number } | undefined,
  distance: number | null | undefined,
  port: { center: [number, number] },
): VoyageState {
  if (!vessel || distance == null) return "waiting";
  if (vessel.sog < INBOUND_MIN_SOG_KN) return "waiting";
  if (distance < INBOUND_MIN_DISTANCE_NM) return "waiting";
  const bearing = bearingDeg(
    vessel.latitude,
    vessel.longitude,
    port.center[0],
    port.center[1],
  );
  if (angleDiff(bearing, vessel.cog) > INBOUND_MAX_BEARING_DIFF_DEG) {
    return "waiting";
  }
  return "inbound";
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
      const sanctioned = isVesselSanctioned({
        mmsi: row.mmsi,
        imo: (stat as { imo?: number } | undefined)?.imo ?? null,
      });
      const voyageState: VoyageState = classifyVoyage(
        vessel,
        distance,
        port,
      );
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
        voyageState,
        zone: vessel?.zone,
        predictedEta: row.predicted_eta,
        predictedAt: row.predicted_at,
        broadcastEta: row.broadcast_eta,
        draught: stat?.draught,
        sanctioned: sanctioned || undefined,
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

  const inboundCount = enriched.filter((v) => v.voyageState === "inbound").length;
  const waitingCount = enriched.length - inboundCount;

  return Response.json({
    port: portId,
    ts: Date.now(),
    count: enriched.length,
    inboundCount,
    waitingCount,
    voyages: enriched,
  });
}
