import { estimateVesselEmissions } from "@/lib/emissions";
import { getStatic } from "@/lib/store";
import { isCargoClass } from "@/lib/cargo";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/vessels/{mmsi}/emissions?days=30
 *
 * Returns a CO2 / fuel / energy estimate for the vessel over the given
 * trailing window. Computed in-house from the AIS positions table using
 * the IMO 4th GHG Study bottom-up methodology (cube-law load factor on
 * installed engine power).
 *
 * Example:
 *   { mmsi: 244620000, co2Tonnes: 412.5, fuelTonnes: 132.4,
 *     distanceNm: 8400, avgSpeedKn: 13.2, hoursUnderway: 636,
 *     coverage: 0.91, methodology: "IMO 4th GHG Study (2020) bottom-up" }
 */

interface RouteParams {
  params: Promise<{ mmsi: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { mmsi: mmsiStr } = await params;
  const mmsi = Number(mmsiStr);
  if (!Number.isFinite(mmsi) || mmsi < 100_000_000 || mmsi > 999_999_999) {
    return Response.json({ error: "invalid mmsi" }, { status: 400 });
  }

  const sp = request.nextUrl.searchParams;
  const days = Math.max(1, Math.min(365, Number(sp.get("days") ?? 30)));
  const sinceMs = Date.now() - days * 86_400_000;

  const stat = getStatic(mmsi);
  const cargoClass = isCargoClass(stat?.cargoClass) ? stat.cargoClass : null;

  const estimate = estimateVesselEmissions({
    mmsi,
    cargoClass,
    sinceMs,
  });

  return Response.json({
    mmsi,
    name: stat?.name ?? null,
    cargoClass,
    days,
    hoursUnderway: Number(estimate.hoursUnderway.toFixed(1)),
    distanceNm: Number(estimate.distanceNm.toFixed(1)),
    avgSpeedKn: Number(estimate.avgSpeedKn.toFixed(2)),
    energyMwh: Number(estimate.energyMwh.toFixed(1)),
    fuelTonnes: Number(estimate.fuelTonnes.toFixed(2)),
    co2Tonnes: Number(estimate.co2Tonnes.toFixed(2)),
    gramsCo2PerNm: Number(estimate.gramsCo2PerNm.toFixed(0)),
    coverage: Number(estimate.coverage.toFixed(2)),
    positionsCount: estimate.positionsCount,
    methodology: "IMO 4th GHG Study (2020) bottom-up — class-default power × cube-law load factor",
    license: "Computed in-house from AIS positions; freely redistributable.",
  });
}
