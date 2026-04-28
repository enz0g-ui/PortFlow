import type { CargoClass, VesselClass, VesselState, Zone } from "./types";

export function inBbox(
  lat: number,
  lon: number,
  bbox: [number, number, number, number],
) {
  const [s, w, n, e] = bbox;
  return lat >= s && lat <= n && lon >= w && lon <= e;
}

export function classifyShip(shipType?: number): VesselClass {
  if (shipType === undefined) return "other";
  if (shipType >= 70 && shipType <= 79) return "cargo";
  if (shipType >= 80 && shipType <= 89) return "tanker";
  if (shipType >= 60 && shipType <= 69) return "passenger";
  if (shipType >= 30 && shipType <= 39) return "fishing";
  if (shipType === 52) return "tug";
  if (shipType === 50) return "pilot";
  return "other";
}

const KEYWORDS: Array<[RegExp, CargoClass]> = [
  [/\b(LNG|METHANE|GAS\s?(CARRIER|TRANSPORT))\b/i, "lng"],
  [/\bLPG\b/i, "lpg"],
  [/\b(CHEM|MTBE|XYLENE|BENZENE)\b/i, "chemical"],
  [/\b(CRUDE|VLCC|SUEZMAX|AFRAMAX)\b/i, "crude"],
  [/\b(PRODUCT|MR\b|DIRTY|CLEAN\s?TANK)\b/i, "product"],
  [/\b(MSC|MAERSK|EVER|CMA|HMM|ZIM|ONE\s|YM\s|CONT)\b/i, "container"],
  [/\b(BULK|ORE|COAL|CAPESIZE|HANDYMAX|PANAMAX)\b/i, "dry-bulk"],
  [/\b(RO[\s-]?RO|VEHICLE|CAR\s?CARRIER)\b/i, "ro-ro"],
];

export function classifyCargo(
  shipType?: number,
  name?: string,
  destination?: string,
): CargoClass {
  const text = `${name ?? ""} ${destination ?? ""}`;
  for (const [re, cls] of KEYWORDS) {
    if (re.test(text)) return cls;
  }

  if (shipType === undefined) return "other";

  if (shipType >= 80 && shipType <= 89) {
    if (shipType === 81) return "chemical";
    if (shipType === 82 || shipType === 83) return "chemical";
    if (shipType === 84) return "product";
    return "product";
  }
  if (shipType >= 70 && shipType <= 79) {
    if (shipType === 71) return "general-cargo";
    return "container";
  }
  if (shipType >= 60 && shipType <= 69) return "passenger";
  if (shipType >= 30 && shipType <= 39) return "fishing";
  if (shipType === 52) return "tug";
  return "other";
}

export function inferState(
  sog: number,
  navStatus: number | undefined,
  zone: Zone | undefined,
): VesselState {
  if (navStatus === 1 || navStatus === 2) return "anchored";
  if (navStatus === 5) return "moored";
  if (sog < 0.3 && zone?.kind === "anchorage") return "anchored";
  if (sog < 0.3 && zone?.kind === "berth") return "moored";
  if (sog >= 0.3) return "underway";
  return "unknown";
}
