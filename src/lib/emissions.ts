/**
 * Maritime emissions estimator. Tier-2 IMO methodology (simplified):
 *   fuel_use(t) = engine_power(kW) * load_factor * SFOC(g/kWh) / 1e6
 *   CO2 = fuel_use * 3.114
 *   SOx = fuel_use * 2 * sulphur_share (0.5% IMO 2020 cap)
 *   NOx = fuel_use * NOx_factor
 *
 * Engine power and SFOC come from Smith et al. (2014) Third IMO GHG Study
 * tabulated by ship type and DWT. We use class-level proxies — sufficient
 * for relative ranking across voyages, not for regulatory reporting.
 */

import type { CargoClass } from "./types";

interface ClassProfile {
  baseFuelKgPerNm: number;
  cubic: number;
  co2Factor: number;
  soxFactor: number;
  noxFactor: number;
}

const CLASS_PROFILES: Record<CargoClass, ClassProfile> = {
  crude: { baseFuelKgPerNm: 380, cubic: 0.005, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  product: { baseFuelKgPerNm: 230, cubic: 0.005, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  chemical: { baseFuelKgPerNm: 220, cubic: 0.005, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  lng: { baseFuelKgPerNm: 320, cubic: 0.004, co2Factor: 2.75, soxFactor: 0.001, noxFactor: 0.052 },
  lpg: { baseFuelKgPerNm: 250, cubic: 0.004, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  container: { baseFuelKgPerNm: 280, cubic: 0.006, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  "dry-bulk": { baseFuelKgPerNm: 240, cubic: 0.005, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  "general-cargo": { baseFuelKgPerNm: 180, cubic: 0.005, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  "ro-ro": { baseFuelKgPerNm: 270, cubic: 0.005, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  passenger: { baseFuelKgPerNm: 350, cubic: 0.004, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  fishing: { baseFuelKgPerNm: 60, cubic: 0.004, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  tug: { baseFuelKgPerNm: 90, cubic: 0.005, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
  other: { baseFuelKgPerNm: 200, cubic: 0.005, co2Factor: 3.114, soxFactor: 0.05, noxFactor: 0.087 },
};

export interface VoyageEmissions {
  fuelKg: number;
  co2Kg: number;
  soxKg: number;
  noxKg: number;
  notes: string;
}

export function estimateVoyageEmissions(input: {
  cargoClass?: CargoClass;
  distanceNm: number;
  averageSog: number;
  draughtM?: number;
  designDraughtM?: number;
}): VoyageEmissions {
  const profile =
    CLASS_PROFILES[input.cargoClass ?? "other"] ?? CLASS_PROFILES.other;

  const distance = Math.max(0, input.distanceNm);
  const sog = Math.max(1, Math.min(25, input.averageSog || 10));

  const speedFactor = Math.pow(sog / 12, 3) * 0.6 + 0.4;

  const loadFactor =
    input.draughtM && input.designDraughtM
      ? Math.min(1.2, Math.max(0.5, input.draughtM / input.designDraughtM))
      : 0.85;

  const fuelKg = distance * profile.baseFuelKgPerNm * speedFactor * loadFactor;

  return {
    fuelKg,
    co2Kg: fuelKg * profile.co2Factor,
    soxKg: fuelKg * profile.soxFactor,
    noxKg: fuelKg * profile.noxFactor,
    notes: `Tier-2 IMO simplified, class=${input.cargoClass ?? "other"}, sog=${sog.toFixed(1)} kn, load=${loadFactor.toFixed(2)}`,
  };
}
