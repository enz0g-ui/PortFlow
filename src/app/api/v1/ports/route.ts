import { PORTS } from "@/lib/ports";
import { meta } from "@/lib/store";
import { gate, withHeaders } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = gate(request);
  if (!auth.ok) return auth.response;
  const perPort = meta.perPortStatus();
  return withHeaders(
    {
      ports: PORTS.map((p) => ({
        id: p.id,
        name: p.name,
        country: p.country,
        flag: p.flag,
        region: p.region,
        strategic: p.strategic ?? false,
        nativeLocale: p.nativeLocale,
        center: p.center,
        bbox: p.bbox,
        cargoStrength: p.cargoStrength,
        vesselCount: perPort[p.id]?.vesselCount ?? 0,
      })),
    },
    auth.headers,
  );
}
