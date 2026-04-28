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

  const track = db()
    .raw.prepare(
      `SELECT ts, lat, lon, sog, cog, state, zone
       FROM positions
       WHERE mmsi = ? AND ts >= ?
       ORDER BY ts ASC
       LIMIT 1000`,
    )
    .all(mmsi, since) as unknown as PositionRow[];

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
