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

export type IntegrationStatus =
  | "live"          // vendor calls coded + tested, data flows in production
  | "in-progress"   // partial implementation, validation in progress
  | "planned";      // BYO key infrastructure ready, vendor integration still to code

export interface SatelliteSource {
  id: string;
  label: string;
  tier: SourceTier;
  tariff: SourceTariff;
  description: string;
  homepage: string;
  envKeys: string[];
  /**
   * Honest status of the data integration with the vendor:
   * - "live": fetchScenes/fetchFixes hit the real vendor API and return data
   * - "in-progress": code path exists but coverage / formats not yet validated
   * - "planned": BYO key UI works, but pasting a key DOES NOT fetch any data yet
   */
  integration: IntegrationStatus;
  /** Optional ETA for going from planned → live, e.g. "Q2 2026" */
  integrationEta?: string;
  status(): SourceStatus;
  fetchScenes?: (
    port: { id: string; bbox: [number, number, number, number] },
    sinceMs: number,
  ) => Promise<SatelliteScene[]>;
  fetchFixes?: (
    port: { id: string; bbox: [number, number, number, number] },
    sinceMs: number,
  ) => Promise<SatelliteFix[]>;
}
