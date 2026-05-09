import { estimateFleetEmissions } from "@/lib/emissions";
import { listWatchlist } from "@/lib/watchlist";
import { getStatic } from "@/lib/store";
import { isCargoClass } from "@/lib/cargo";
import { getCurrentUser } from "@/lib/auth/session";
import type { CargoClass } from "@/lib/types";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/fleet/emissions?days=30
 *
 * Aggregates CO2 / fuel / energy across the authenticated user's vessel
 * watchlist. In-house estimate from AIS positions (no external dependency).
 *
 * Returns per-vessel rows + a fleet-total summary, suitable for a
 * Scope-3 emissions dashboard or chartering screening.
 */

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const sp = request.nextUrl.searchParams;
  const days = Math.max(1, Math.min(365, Number(sp.get("days") ?? 30)));
  const sinceMs = Date.now() - days * 86_400_000;

  const watch = listWatchlist(user.id);
  const vessels = watch
    .filter((w): w is typeof w & { mmsi: number } => w.mmsi !== null)
    .map((w) => {
      const stat = getStatic(w.mmsi);
      const cargoClass: CargoClass | null = isCargoClass(stat?.cargoClass)
        ? stat.cargoClass
        : null;
      return { mmsi: w.mmsi, cargoClass, label: w.label ?? stat?.name ?? null };
    });

  const estimates = estimateFleetEmissions(vessels, sinceMs);

  const fleet = {
    co2Tonnes: 0,
    fuelTonnes: 0,
    energyMwh: 0,
    distanceNm: 0,
    hoursUnderway: 0,
  };
  const rows = estimates.map((e, i) => {
    fleet.co2Tonnes += e.co2Tonnes;
    fleet.fuelTonnes += e.fuelTonnes;
    fleet.energyMwh += e.energyMwh;
    fleet.distanceNm += e.distanceNm;
    fleet.hoursUnderway += e.hoursUnderway;
    return {
      mmsi: e.mmsi,
      label: vessels[i]?.label ?? null,
      cargoClass: e.cargoClass,
      co2Tonnes: Number(e.co2Tonnes.toFixed(2)),
      fuelTonnes: Number(e.fuelTonnes.toFixed(2)),
      distanceNm: Number(e.distanceNm.toFixed(0)),
      avgSpeedKn: Number(e.avgSpeedKn.toFixed(1)),
      hoursUnderway: Number(e.hoursUnderway.toFixed(0)),
      gramsCo2PerNm: Number(e.gramsCo2PerNm.toFixed(0)),
      coverage: Number(e.coverage.toFixed(2)),
    };
  });

  return Response.json({
    days,
    vesselsCount: rows.length,
    fleet: {
      co2Tonnes: Number(fleet.co2Tonnes.toFixed(2)),
      fuelTonnes: Number(fleet.fuelTonnes.toFixed(2)),
      energyMwh: Number(fleet.energyMwh.toFixed(0)),
      distanceNm: Number(fleet.distanceNm.toFixed(0)),
      hoursUnderway: Number(fleet.hoursUnderway.toFixed(0)),
      avgGramsCo2PerNm:
        fleet.distanceNm > 0
          ? Number(((fleet.co2Tonnes * 1_000_000) / fleet.distanceNm).toFixed(0))
          : 0,
    },
    vessels: rows,
    methodology:
      "IMO 4th GHG Study (2020) bottom-up — class-default installed power × cube-law load factor on AIS speed.",
    license: "Computed in-house; freely redistributable.",
  });
}
