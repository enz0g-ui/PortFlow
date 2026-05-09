import {
  findSanctionsForVessel,
  listSanctionedVessels,
} from "@/lib/uk-sanctions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/sanctioned-vessels
 *
 * Modes:
 *   - ?imo=9123456              → vessel-specific lookup (returns matches)
 *   - ?mmsi=211123456           → vessel-specific lookup
 *   - ?regime=Russia            → list all sanctioned ships in regime
 *   - (no params)               → list all sanctioned ships (limit 500)
 *
 * Source: UK Sanctions List (FCDO), OGL v3.0. Replaced the OFSI
 * Consolidated List which was discontinued 28 Jan 2026.
 */

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const imoStr = sp.get("imo");
  const mmsiStr = sp.get("mmsi");

  if (imoStr || mmsiStr) {
    const imo = imoStr ? parseInt(imoStr, 10) : null;
    const mmsi = mmsiStr ? parseInt(mmsiStr, 10) : null;
    const matches = findSanctionsForVessel({
      imo: Number.isFinite(imo) ? imo : null,
      mmsi: Number.isFinite(mmsi) ? mmsi : null,
    });
    return Response.json({
      query: { imo, mmsi },
      sanctioned: matches.length > 0,
      matches,
      attribution: "UK Sanctions List (FCDO) — OGL v3.0",
    });
  }

  const regime = sp.get("regime") ?? undefined;
  const source = sp.get("source") ?? undefined;
  const limit = Number(sp.get("limit") ?? 500);
  const ships = listSanctionedVessels({ regime, source, limit });
  return Response.json({
    count: ships.length,
    ships,
    attribution: "UK Sanctions List (FCDO) — OGL v3.0",
  });
}
