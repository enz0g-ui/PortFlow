import { getStatic, getVessels, meta } from "@/lib/store";
import { DEFAULT_PORT_ID, getPort, type Port } from "@/lib/ports";
import { isVesselSanctioned } from "@/lib/uk-sanctions";
import { classifyShip } from "@/lib/rotterdam";
import {
  loadLastKnownPositions,
  type LastKnownPositionRow,
} from "@/lib/db";
import type { Vessel, VesselState } from "@/lib/types";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Fallback « panne de flux » : si le live est vide ET que le flux AIS est
// muet, on sert les dernières positions connues (< 7 j) marquées stale —
// une carte datée et honnête plutôt qu'une carte vide (panne AISStream
// 05-08/08/2026). Cache 60 s : la donnée ne bouge pas tant que le flux
// est muet, inutile de refaire le GROUP BY à chaque poll visiteur.
const FEED_MUTE_MS = 10 * 60_000;
const FALLBACK_WINDOW_MS = 7 * 24 * 60 * 60_000;
let _staleCache: { at: number; rows: LastKnownPositionRow[] } | null = null;

const VESSEL_STATES: VesselState[] = ["underway", "anchored", "moored", "unknown"];

function lastKnownForPort(port: Port): Vessel[] {
  if (!_staleCache || Date.now() - _staleCache.at > 60_000) {
    _staleCache = {
      at: Date.now(),
      rows: loadLastKnownPositions(Date.now() - FALLBACK_WINDOW_MS),
    };
  }
  const [latMin, lonMin, latMax, lonMax] = port.bbox;
  const out: Vessel[] = [];
  for (const r of _staleCache.rows) {
    if (r.lat == null || r.lon == null) continue;
    if (r.lat < latMin || r.lat > latMax || r.lon < lonMin || r.lon > lonMax)
      continue;
    const stat = getStatic(r.mmsi);
    out.push({
      mmsi: r.mmsi,
      name: stat?.name,
      callsign: stat?.callsign,
      shipType: stat?.shipType,
      vesselClass: classifyShip(stat?.shipType),
      cargoClass: stat?.cargoClass,
      latitude: r.lat,
      longitude: r.lon,
      sog: r.sog ?? 0,
      cog: r.cog ?? 0,
      navStatus: r.nav_status ?? undefined,
      destination: stat?.destination,
      draught: stat?.draught,
      lengthM: stat?.lengthM,
      state: VESSEL_STATES.includes(r.state as VesselState)
        ? (r.state as VesselState)
        : "unknown",
      zone: r.zone ?? undefined,
      lastUpdate: r.ts,
    });
  }
  return out;
}

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  const port = getPort(portId);
  if (!port) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }

  let vessels = getVessels(portId);
  let stale = false;
  if (vessels.length === 0) {
    const ais = meta.status();
    const feedMute =
      !ais.lastMessageAt || Date.now() - ais.lastMessageAt > FEED_MUTE_MS;
    if (feedMute) {
      const fallback = lastKnownForPort(port);
      if (fallback.length > 0) {
        vessels = fallback;
        stale = true;
      }
    }
  }

  // Enrich each vessel with a sanctioned flag (UK sanctions list, indexed
  // O(1) via uk-sanctions.isVesselSanctioned). Vessel type doesn't carry
  // IMO directly — we look it up from the static cache.
  const enriched = vessels.map((v) => {
    const stat = getStatic(v.mmsi);
    const sanctioned = isVesselSanctioned({
      mmsi: v.mmsi,
      imo: (stat as { imo?: number } | undefined)?.imo ?? null,
    });
    return sanctioned ? { ...v, sanctioned: true } : v;
  });
  const dataAsOf = stale
    ? enriched.reduce((m, v) => Math.max(m, v.lastUpdate), 0)
    : null;
  return Response.json({
    ts: Date.now(),
    port: portId,
    count: enriched.length,
    stale,
    dataAsOf,
    vessels: enriched,
  });
}
