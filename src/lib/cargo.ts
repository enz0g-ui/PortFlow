import type { CargoClass } from "./types";

const CARGO_LIST: ReadonlyArray<CargoClass> = [
  "crude",
  "product",
  "chemical",
  "lng",
  "lpg",
  "container",
  "dry-bulk",
  "general-cargo",
  "ro-ro",
  "passenger",
  "fishing",
  "tug",
  "other",
];

const CARGO_SET: ReadonlySet<string> = new Set(CARGO_LIST);

export function isCargoClass(value: unknown): value is CargoClass {
  return typeof value === "string" && CARGO_SET.has(value);
}

export { CARGO_LIST as CARGO_CLASSES };

export const TANKER_CARGOS: ReadonlySet<CargoClass> = new Set([
  "crude",
  "product",
  "chemical",
  "lng",
  "lpg",
]);

export const CARGO_LABELS: Record<CargoClass, string> = {
  crude: "Crude",
  product: "Product",
  chemical: "Chemical",
  lng: "LNG",
  lpg: "LPG",
  container: "Container",
  "dry-bulk": "Dry bulk",
  "general-cargo": "General cargo",
  "ro-ro": "Ro-Ro",
  passenger: "Passenger",
  fishing: "Fishing",
  tug: "Tug",
  other: "Other",
};

export const CARGO_COLOR: Record<CargoClass, string> = {
  crude: "#f87171",
  product: "#fb923c",
  chemical: "#facc15",
  lng: "#22d3ee",
  lpg: "#7dd3fc",
  container: "#34d399",
  "dry-bulk": "#a78bfa",
  "general-cargo": "#94a3b8",
  "ro-ro": "#f472b6",
  passenger: "#a78bfa",
  fishing: "#fde047",
  tug: "#38bdf8",
  other: "#64748b",
};
