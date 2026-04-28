import { getKpiHistory } from "@/lib/store";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const hours = Number(request.nextUrl.searchParams.get("hours") ?? "6");
  const since = Date.now() - hours * 60 * 60 * 1000;
  return Response.json({
    port: portId,
    history: getKpiHistory(portId, since),
  });
}
