import { attributeVoyageDelays } from "@/lib/eta-attribution";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const attributions = await attributeVoyageDelays(portId, since, 100);

  const summary: Record<string, number> = {};
  for (const a of attributions) summary[a.cause] = (summary[a.cause] ?? 0) + 1;

  return Response.json({
    port: portId,
    sinceMs: since,
    sampleCount: attributions.length,
    summary,
    attributions: attributions.slice(0, 50),
  });
}
