import { forecast } from "@/lib/forecast";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "anchored",
  "totalVessels",
  "inboundLastHour",
  "outboundLastHour",
]);

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const metric = request.nextUrl.searchParams.get("metric") ?? "anchored";
  if (!ALLOWED.has(metric)) {
    return Response.json({ error: "invalid metric" }, { status: 400 });
  }
  const hours = Number(request.nextUrl.searchParams.get("horizon") ?? "24");
  return Response.json(forecast(portId, metric as never, hours));
}
