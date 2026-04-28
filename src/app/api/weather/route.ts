import { getPort } from "@/lib/ports";
import { getWeather } from "@/lib/weather";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? "rotterdam";
  const port = getPort(portId);
  if (!port) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  try {
    const data = await getWeather(portId, port.center[0], port.center[1]);
    return Response.json({ port: portId, ...data });
  } catch (err) {
    return Response.json(
      { error: "weather fetch failed", detail: (err as Error).message },
      { status: 502 },
    );
  }
}
