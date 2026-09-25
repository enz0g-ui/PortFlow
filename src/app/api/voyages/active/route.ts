import { computeActiveVoyages } from "@/lib/active-voyages";
import { DEFAULT_PORT_ID } from "@/lib/ports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// La logique (classification inbound/waiting, enrichissement) vit dans
// src/lib/active-voyages.ts, partagée avec le composant serveur app/page.tsx
// qui rend les tuiles « voyages actifs » / « en attente » dans le HTML initial.
export type { VoyageState } from "@/lib/active-voyages";

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  const onlyTankers = request.nextUrl.searchParams.get("tankersOnly") === "1";
  const payload = computeActiveVoyages(portId, onlyTankers);
  if (!payload) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  return Response.json(payload);
}
