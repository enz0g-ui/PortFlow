import { PORTS } from "@/lib/ports";
import { getVessels } from "@/lib/store";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface Match {
  mmsi: number;
  name?: string;
  callsign?: string;
  portId: string;
  portName: string;
  flag: string;
  country: string;
  lat: number;
  lon: number;
  sog: number;
  state: string;
  cargoClass?: string;
  vesselClass?: string;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  const limit = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 20),
  );

  if (!q || q.length < 2) {
    return Response.json({ matches: [], q });
  }

  const matches: Match[] = [];
  const seen = new Set<number>();

  for (const port of PORTS) {
    if (matches.length >= limit) break;
    const vessels = getVessels(port.id);
    for (const v of vessels) {
      if (matches.length >= limit) break;
      if (seen.has(v.mmsi)) continue;
      const matchMmsi = String(v.mmsi).includes(q);
      const matchName = v.name?.toLowerCase().includes(q) ?? false;
      const matchCall = v.callsign?.toLowerCase().includes(q) ?? false;
      if (matchMmsi || matchName || matchCall) {
        seen.add(v.mmsi);
        matches.push({
          mmsi: v.mmsi,
          name: v.name,
          callsign: v.callsign,
          portId: port.id,
          portName: port.name,
          flag: port.flag,
          country: port.country,
          lat: v.latitude,
          lon: v.longitude,
          sog: v.sog,
          state: v.state,
          cargoClass: v.cargoClass,
          vesselClass: v.vesselClass,
        });
      }
    }
  }

  matches.sort((a, b) => {
    const aExact =
      a.name?.toLowerCase() === q ||
      String(a.mmsi) === q ||
      a.callsign?.toLowerCase() === q;
    const bExact =
      b.name?.toLowerCase() === q ||
      String(b.mmsi) === q ||
      b.callsign?.toLowerCase() === q;
    if (aExact !== bExact) return aExact ? -1 : 1;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  return Response.json({ matches, q });
}
