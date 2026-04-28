import { getPort } from "@/lib/ports";
import { getVessels } from "@/lib/store";
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
  if (!getPort(id)) {
    return Response.json({ error: "unknown port" }, { status: 404 });
  }
  const onlyTankers = request.nextUrl.searchParams.get("tankersOnly") === "1";
  const vessels = getVessels(id).filter((v) => {
    if (!onlyTankers) return true;
    return v.cargoClass && TANKER_CARGOS.has(v.cargoClass);
  });
  return withHeaders(
    {
      port: id,
      ts: Date.now(),
      count: vessels.length,
      vessels,
    },
    auth.headers,
  );
}
