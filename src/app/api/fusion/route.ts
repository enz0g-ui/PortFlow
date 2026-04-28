import { fuseSarWithAis } from "@/lib/fusion";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const days = Number(request.nextUrl.searchParams.get("days") ?? "14");
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const matches = fuseSarWithAis(portId, since);
  const stats = {
    total: matches.length,
    aisConfirmed: matches.filter((m) => m.confidence === "ais-confirmed").length,
    aisStale: matches.filter((m) => m.confidence === "ais-stale").length,
    darkCandidates: matches.filter((m) => m.confidence === "dark-candidate")
      .length,
  };
  return Response.json({ port: portId, sinceMs: since, stats, matches });
}
