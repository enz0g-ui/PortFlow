import { PORTS } from "@/lib/ports";
import { meta } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const perPort = meta.perPortStatus();
  return Response.json({
    ports: PORTS.map((p) => ({
      id: p.id,
      name: p.name,
      country: p.country,
      flag: p.flag,
      region: p.region,
      strategic: p.strategic ?? false,
      nativeLocale: p.nativeLocale,
      names: p.names,
      countryNames: p.countryNames,
      center: p.center,
      bbox: p.bbox,
      zones: p.zones,
      cargoStrength: p.cargoStrength,
      blurb: p.blurb,
      blurbs: p.blurbs ?? null,
      vesselCount: perPort[p.id]?.vesselCount ?? 0,
    })),
  });
}
