export type SourceTier = "ais-terrestrial" | "ais-satellite" | "sar" | "optical-night";
export type SourceTariff = "free" | "free-with-key" | "paid";

export interface SourceStatus {
  active: boolean;
  configured: boolean;
  reason?: string;
  lastSyncAt?: number;
  lastError?: string;
}

export interface SatelliteScene {
  id: string;
  source: string;
  port: string;
  acquiredAt: number;
  bbox: [number, number, number, number];
  productUrl?: string;
  thumbnailUrl?: string;
  meta?: Record<string, unknown>;
}

export interface SatelliteFix {
  source: string;
  port: string;
  ts: number;
  lat: number;
  lon: number;
  mmsi?: number;
  name?: string;
  imo?: number;
  sog?: number;
  cog?: number;
  draught?: number;
  cargoClass?: string;
  meta?: Record<string, unknown>;
}

export interface SatelliteSource {
  id: string;
  label: string;
  tier: SourceTier;
  tariff: SourceTariff;
  description: string;
  homepage: string;
  envKeys: string[];
  status(): SourceStatus;
  /**
   * Fetches recent scene metadata for the given port bbox.
   * Returns [] if not implemented or fails. Must not throw.
   */
  fetchScenes?: (
    port: { id: string; bbox: [number, number, number, number] },
    sinceMs: number,
  ) => Promise<SatelliteScene[]>;
  /**
   * Fetches recent vessel fixes (positions) for the given port bbox.
   * Must not throw — return [] on failure.
   */
  fetchFixes?: (
    port: { id: string; bbox: [number, number, number, number] },
    sinceMs: number,
  ) => Promise<SatelliteFix[]>;
}
