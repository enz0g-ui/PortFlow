import { computeAnomalies } from "@/lib/anomaly";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  return Response.json({
    port: portId,
    ts: Date.now(),
    anomalies: computeAnomalies(portId),
  });
}
