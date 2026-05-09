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

import { db } from "./db";
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

// ────────────────────────────────────────────────────────────────────
// Position-based vessel emissions (time-window aggregation)
// ────────────────────────────────────────────────────────────────────

/**
 * Time-window emissions for a single vessel, computed by streaming the
 * positions table. Per pair of consecutive positions:
 *   power_kW = installed_power_kW × max(load_floor, (speed/design_speed)^3)
 *   energy_kWh = power_kW × dt_hours
 *   fuel_g = energy_kWh × SFOC
 *   CO2_g = fuel_g × emission_factor
 *
 * Skips pairs with dt > MAX_GAP_HOURS or speed < MIN_SPEED_KN (vessel at
 * berth/anchor — auxiliary load while stationary is not captured here).
 *
 * Reference: IMO Fourth Greenhouse Gas Study 2020, Annex 1 §2.2.4.
 *
 * Distinct from estimateVoyageEmissions() above: this one operates on
 * the raw positions stream (good for time-window or fleet-wide
 * aggregation), the other on a single voyage's distance/avg-sog summary.
 */

const POS_INSTALLED_POWER_MW: Record<CargoClass, number> = {
  crude: 12,
  product: 8,
  chemical: 7,
  lng: 30,
  lpg: 10,
  container: 35,
  "dry-bulk": 10,
  "general-cargo": 5,
  "ro-ro": 15,
  passenger: 25,
  fishing: 1,
  tug: 3,
  other: 6,
};
const POS_DESIGN_SPEED_KN: Record<CargoClass, number> = {
  crude: 14,
  product: 14,
  chemical: 14,
  lng: 19,
  lpg: 16,
  container: 22,
  "dry-bulk": 14,
  "general-cargo": 13,
  "ro-ro": 20,
  passenger: 22,
  fishing: 11,
  tug: 12,
  other: 13,
};
const POS_SFOC_G_PER_KWH = 200;
const POS_HFO_EMISSION_FACTOR = 3.114;
const POS_AUX_LOAD_FLOOR = 0.1;
const POS_MIN_SPEED_KN = 0.5;
const POS_MAX_GAP_HOURS = 6;

export interface VesselEmissionsEstimate {
  mmsi: number;
  windowStart: number;
  windowEnd: number;
  cargoClass: CargoClass | null;
  hoursUnderway: number;
  distanceNm: number;
  avgSpeedKn: number;
  energyMwh: number;
  fuelTonnes: number;
  co2Tonnes: number;
  /** g CO2 per nautical mile — proxy for CII without DWT lookup. */
  gramsCo2PerNm: number;
  /** Coverage 0–1: how much of the window has AIS data. */
  coverage: number;
  positionsCount: number;
}

interface PosRow {
  ts: number;
  lat: number;
  lon: number;
  sog: number | null;
}

const POS_R_NM = 3440.065;
function haversineNmPos(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * POS_R_NM * Math.asin(Math.sqrt(a));
}

export function estimateVesselEmissions(opts: {
  mmsi: number;
  cargoClass: CargoClass | null;
  sinceMs: number;
  untilMs?: number;
}): VesselEmissionsEstimate {
  const cls = opts.cargoClass ?? "other";
  const installedKw = POS_INSTALLED_POWER_MW[cls] * 1000;
  const designSpeedKn = POS_DESIGN_SPEED_KN[cls];
  const until = opts.untilMs ?? Date.now();

  const stmt = db().raw.prepare(
    `SELECT ts, lat, lon, sog FROM positions
     WHERE mmsi = ? AND ts >= ? AND ts <= ?
     ORDER BY ts ASC`,
  );

  let energyKwh = 0;
  let distanceNm = 0;
  let hoursUnderway = 0;
  let positions = 0;
  let totalSpan = 0;
  let prev: PosRow | null = null;

  for (const r of stmt.iterate(
    opts.mmsi,
    opts.sinceMs,
    until,
  ) as IterableIterator<PosRow>) {
    positions++;
    if (prev) {
      const dtH = (r.ts - prev.ts) / 3_600_000;
      totalSpan += dtH;
      if (dtH > 0 && dtH <= POS_MAX_GAP_HOURS) {
        const nm = haversineNmPos(prev.lat, prev.lon, r.lat, r.lon);
        const sogA = r.sog;
        const computed = nm / dtH;
        const speedKn =
          typeof sogA === "number" && sogA > 0 && sogA < 40 ? sogA : computed;
        if (speedKn >= POS_MIN_SPEED_KN && speedKn < 40) {
          const lf = Math.min(1, (speedKn / designSpeedKn) ** 3);
          const powerKw = installedKw * Math.max(POS_AUX_LOAD_FLOOR, lf);
          energyKwh += powerKw * dtH;
          distanceNm += nm;
          hoursUnderway += dtH;
        }
      }
    }
    prev = r;
  }

  const fuelG = energyKwh * POS_SFOC_G_PER_KWH;
  const co2G = fuelG * POS_HFO_EMISSION_FACTOR;
  const avgSpeedKn = hoursUnderway > 0 ? distanceNm / hoursUnderway : 0;
  const expectedSpan = (until - opts.sinceMs) / 3_600_000;
  const coverage =
    expectedSpan > 0 ? Math.min(1, totalSpan / expectedSpan) : 0;

  return {
    mmsi: opts.mmsi,
    windowStart: opts.sinceMs,
    windowEnd: until,
    cargoClass: opts.cargoClass,
    hoursUnderway,
    distanceNm,
    avgSpeedKn,
    energyMwh: energyKwh / 1000,
    fuelTonnes: fuelG / 1_000_000,
    co2Tonnes: co2G / 1_000_000,
    gramsCo2PerNm: distanceNm > 0 ? co2G / distanceNm : 0,
    coverage,
    positionsCount: positions,
  };
}

export function estimateFleetEmissions(
  vessels: Array<{ mmsi: number; cargoClass: CargoClass | null }>,
  sinceMs: number,
  untilMs?: number,
): VesselEmissionsEstimate[] {
  return vessels.map((v) =>
    estimateVesselEmissions({
      mmsi: v.mmsi,
      cargoClass: v.cargoClass,
      sinceMs,
      untilMs,
    }),
  );
}
