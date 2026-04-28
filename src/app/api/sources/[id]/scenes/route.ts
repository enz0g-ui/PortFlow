import { getSource } from "@/lib/satellites/registry";
import { getPort, DEFAULT_PORT_ID } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const source = getSource(id);
  if (!source) {
    return Response.json({ error: "unknown source" }, { status: 404 });
  }
  if (!source.fetchScenes) {
    return Response.json(
      { error: "source does not expose scenes" },
      { status: 400 },
    );
  }
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  const port = getPort(portId);
  if (!port) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const scenes = await source.fetchScenes(
    { id: port.id, bbox: port.bbox },
    since,
  );
  return Response.json({
    source: id,
    port: portId,
    sinceMs: since,
    count: scenes.length,
    scenes,
  });
}
