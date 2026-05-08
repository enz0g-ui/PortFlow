import { db, type VoyageRow } from "@/lib/db";
import { getPort } from "@/lib/ports";
import { getStatic, getVessels } from "@/lib/store";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface PositionRow {
  ts: number;
  lat: number;
  lon: number;
  sog: number;
  cog: number;
  state: string;
  zone: string | null;
}

function haversineNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3440.065; // Earth radius in nautical miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mmsi: string }> },
) {
  const { mmsi: mmsiStr } = await params;
  const mmsi = Number(mmsiStr);
  if (!Number.isFinite(mmsi)) {
    return Response.json({ error: "invalid mmsi" }, { status: 400 });
  }
  const portId = request.nextUrl.searchParams.get("port") ?? "rotterdam";
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const hours = Number(request.nextUrl.searchParams.get("hours") ?? "12");
  const since = Date.now() - hours * 60 * 60 * 1000;

  const live = getVessels(portId).find((v) => v.mmsi === mmsi);
  const stat = getStatic(mmsi);

  const rawTrack = db()
    .raw.prepare(
      `SELECT ts, lat, lon, sog, cog, state, zone
       FROM positions
       WHERE mmsi = ? AND ts >= ?
       ORDER BY ts ASC
       LIMIT 1000`,
    )
    .all(mmsi, since) as unknown as PositionRow[];

  // Strip AIS outliers — a single glitched position (corrupt GPS, wrong
  // antenna parsing) draws a long straight line across the map. We compute
  // the implicit speed between consecutive points and drop any point that
  // would imply > 60 kn travel from BOTH neighbors (a real fast vessel
  // peaks ~25 kn for tankers, ~30 kn for container ships, ~45 kn military).
  const track: PositionRow[] = [];
  for (let i = 0; i < rawTrack.length; i++) {
    const p = rawTrack[i];
    const prev = track[track.length - 1];
    if (!prev) {
      track.push(p);
      continue;
    }
    const dtH = (p.ts - prev.ts) / 3_600_000;
    if (dtH <= 0) continue;
    const dnm = haversineNm(prev.lat, prev.lon, p.lat, p.lon);
    const speedKn = dnm / dtH;
    // Be tolerant of large gaps in time (worker downtime → real big gap, not
    // an outlier). Only flag if the implied speed is impossible AND the gap
    // is short enough that the vessel couldn't have actually moved that far.
    if (speedKn > 60 && dtH < 6) continue;
    track.push(p);
  }

  const openVoyage = db()
    .raw.prepare(
      `SELECT * FROM voyages WHERE mmsi = ? AND port = ? AND arrived_ts IS NULL ORDER BY start_ts DESC LIMIT 1`,
    )
    .get(mmsi, portId) as unknown as VoyageRow | undefined;

  const lastClosedVoyage = db()
    .raw.prepare(
      `SELECT * FROM voyages WHERE mmsi = ? AND port = ? AND arrived_ts IS NOT NULL ORDER BY arrived_ts DESC LIMIT 1`,
    )
    .get(mmsi, portId) as unknown as VoyageRow | undefined;

  return Response.json({
    mmsi,
    port: portId,
    live: live ?? null,
    static: stat ?? null,
    openVoyage: openVoyage ?? null,
    lastClosedVoyage: lastClosedVoyage ?? null,
    track,
  });
}
