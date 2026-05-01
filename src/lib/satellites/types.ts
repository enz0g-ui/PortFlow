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

/**
 * Per-fetch options passed to a provider. `env` overrides process.env for
 * BYO-key tenant fetches: callers (api/user/satellite/...) inject the
 * decrypted user's key here so the same fetcher works for operator polls
 * AND per-tenant calls.
 */
export interface FetchOpts {
  env?: Record<string, string>;
  signal?: AbortSignal;
}

export interface SatelliteSource {
  id: string;
  label: string;
  tier: SourceTier;
  tariff: SourceTariff;
  description: string;
  homepage: string;
  envKeys: string[];
  integration: IntegrationStatus;
  integrationEta?: string;
  status(): SourceStatus;
  fetchScenes?: (
    port: { id: string; bbox: [number, number, number, number] },
    sinceMs: number,
    opts?: FetchOpts,
  ) => Promise<SatelliteScene[]>;
  fetchFixes?: (
    port: { id: string; bbox: [number, number, number, number] },
    sinceMs: number,
    opts?: FetchOpts,
  ) => Promise<SatelliteFix[]>;
}

/** Resolves the value of an env key, preferring per-tenant override if present. */
export function readEnv(
  name: string,
  opts?: FetchOpts,
): string | undefined {
  if (opts?.env && opts.env[name]) return opts.env[name];
  return process.env[name];
}
