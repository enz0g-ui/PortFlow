export type VesselClass =
  | "cargo"
  | "tanker"
  | "passenger"
  | "fishing"
  | "tug"
  | "pilot"
  | "other";

export type CargoClass =
  | "crude"
  | "product"
  | "chemical"
  | "lng"
  | "lpg"
  | "container"
  | "dry-bulk"
  | "general-cargo"
  | "ro-ro"
  | "passenger"
  | "fishing"
  | "tug"
  | "other";

export type VesselState = "underway" | "anchored" | "moored" | "unknown";

export interface Vessel {
  mmsi: number;
  name?: string;
  callsign?: string;
  shipType?: number;
  vesselClass: VesselClass;
  cargoClass?: CargoClass;
  latitude: number;
  longitude: number;
  sog: number;
  cog: number;
  heading?: number;
  navStatus?: number;
  destination?: string;
  draught?: number;
  lengthM?: number;
  state: VesselState;
  zone?: string;
  lastUpdate: number;
}

export interface FlowEvent {
  ts: number;
  mmsi: number;
  direction: "inbound" | "outbound";
  zone: string;
}

export interface KpiSnapshot {
  ts: number;
  totalVessels: number;
  anchored: number;
  underway: number;
  moored: number;
  inboundLastHour: number;
  outboundLastHour: number;
  avgSpeedChannel: number;
  byClass: Record<VesselClass, number>;
}

export interface Zone {
  id: string;
  name: string;
  kind: "anchorage" | "channel" | "berth" | "approach";
  bbox: [number, number, number, number];
}
