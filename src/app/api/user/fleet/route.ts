import { getCurrentUser } from "@/lib/auth/session";
import { db, type VoyageRow } from "@/lib/db";
import { findPortByPosition, getPort } from "@/lib/ports";
import { vesselWatchlistMmsis } from "@/lib/watchlist";
import { computeDemurrageScore } from "@/lib/demurrage";

export const dynamic = "force-dynamic";

interface FleetRow {
  mmsi: number;
  name: string;
  cargoClass?: string | null;
  draught?: number | null;
  position?: {
    ts: number;
    lat: number;
    lon: number;
    sog: number;
    zone?: string | null;
    state?: string | null;
  };
  currentPort?: {
    id: string;
    name: string;
    flag: string;
    country: string;
  };
  openVoyage?: {
    voyageId: string;
    port: string;
    portName: string;
    startTs: number;
    predictedEta?: number | null;
    broadcastEta?: number | null;
    distanceNm?: number | null;
  };
  lastClosedVoyage?: {
    voyageId: string;
    port: string;
    portName: string;
    arrivedTs: number;
    departedTs?: number | null;
    durationHours?: number | null;
  };
  demurrageRisk?: {
    score: number;
    voyageAgeHours: number;
    p50Hours: number;
    p75Hours: number;
    congestionFactor: number;
    sampleCount: number;
  };
}

interface StaticRow {
  mmsi: number;
  name?: string | null;
  cargo_class?: string | null;
  draught?: number | null;
}

interface PositionRow {
  ts: number;
  lat: number;
  lon: number;
  sog: number;
  zone: string | null;
  state: string | null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const mmsis = vesselWatchlistMmsis(user.id);
  if (mmsis.length === 0) {
    return Response.json({ count: 0, vessels: [], ts: Date.now() });
  }

  const placeholders = mmsis.map(() => "?").join(",");
  const statics = db()
    .raw.prepare(
      `SELECT mmsi, name, cargo_class, draught FROM static_ships WHERE mmsi IN (${placeholders})`,
    )
    .all(...mmsis) as unknown as StaticRow[];
  const staticByMmsi = new Map(statics.map((s) => [s.mmsi, s]));

  const fleet: FleetRow[] = mmsis.map((mmsi) => {
    const stat = staticByMmsi.get(mmsi);
    const lastPos = db()
      .raw.prepare(
        `SELECT ts, lat, lon, sog, zone, state FROM positions WHERE mmsi = ? ORDER BY ts DESC LIMIT 1`,
      )
      .get(mmsi) as PositionRow | undefined;

    const openVoyage = db()
      .raw.prepare(
        `SELECT * FROM voyages WHERE mmsi = ? AND arrived_ts IS NULL ORDER BY start_ts DESC LIMIT 1`,
      )
      .get(mmsi) as VoyageRow | undefined;

    const lastClosed = db()
      .raw.prepare(
        `SELECT * FROM voyages WHERE mmsi = ? AND arrived_ts IS NOT NULL ORDER BY arrived_ts DESC LIMIT 1`,
      )
      .get(mmsi) as VoyageRow | undefined;

    const port = lastPos
      ? findPortByPosition(lastPos.lat, lastPos.lon)
      : undefined;

    const row: FleetRow = {
      mmsi,
      name: stat?.name ?? `MMSI ${mmsi}`,
      cargoClass: stat?.cargo_class ?? null,
      draught: stat?.draught ?? null,
      position: lastPos
        ? {
            ts: lastPos.ts,
            lat: lastPos.lat,
            lon: lastPos.lon,
            sog: lastPos.sog,
            zone: lastPos.zone,
            state: lastPos.state,
          }
        : undefined,
      currentPort: port
        ? {
            id: port.id,
            name: port.name,
            flag: port.flag,
            country: port.country,
          }
        : undefined,
      openVoyage: openVoyage
        ? {
            voyageId: openVoyage.voyage_id,
            port: openVoyage.port,
            portName: getPort(openVoyage.port)?.name ?? openVoyage.port,
            startTs: openVoyage.start_ts,
            predictedEta: openVoyage.predicted_eta ?? null,
            broadcastEta: openVoyage.broadcast_eta ?? null,
            distanceNm: openVoyage.start_distance_nm ?? null,
          }
        : undefined,
      lastClosedVoyage: lastClosed
        ? {
            voyageId: lastClosed.voyage_id,
            port: lastClosed.port,
            portName: getPort(lastClosed.port)?.name ?? lastClosed.port,
            arrivedTs: lastClosed.arrived_ts!,
            departedTs: lastClosed.departed_ts ?? null,
            durationHours:
              lastClosed.departed_ts && lastClosed.arrived_ts
                ? (lastClosed.departed_ts - lastClosed.arrived_ts) / 3_600_000
                : null,
          }
        : undefined,
    };

    const stillAtPort =
      lastClosed?.arrived_ts && !lastClosed.departed_ts
        ? lastClosed
        : undefined;
    if (stillAtPort) {
      const ds = computeDemurrageScore({
        portId: stillAtPort.port,
        cargoClass: stillAtPort.cargo_class ?? null,
        arrivedTs: stillAtPort.arrived_ts!,
      });
      row.demurrageRisk = {
        score: ds.score,
        voyageAgeHours: ds.voyageAgeHours,
        p50Hours: ds.p50Hours,
        p75Hours: ds.p75Hours,
        congestionFactor: ds.congestionFactor,
        sampleCount: ds.sampleCount,
      };
    }
    return row;
  });

  return Response.json({
    count: fleet.length,
    vessels: fleet,
    ts: Date.now(),
  });
}
