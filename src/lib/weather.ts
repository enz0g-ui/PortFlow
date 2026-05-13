export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  precipitation: number;
  cloudCover: number;
  waveHeight: number | null;
  waveDirection: number | null;
  fetchedAt: number;
}

interface CacheEntry {
  data: WeatherData;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 30 * 60_000;

const FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast?current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover&wind_speed_unit=kn&timezone=auto";
const MARINE_URL =
  "https://marine-api.open-meteo.com/v1/marine?current=wave_height,wave_direction&timezone=auto";

/**
 * Physical bounds for sanitization. Reject NaN / Infinity / out-of-range
 * values from Open-Meteo (their model occasionally emits placeholder
 * values like -999 or absurd spikes in poorly-observed regions).
 *
 * Wave height 0-15m: 15m is the upper end of category 5 hurricane seas.
 * Anything higher is almost certainly a data error.
 */
const BOUNDS = {
  temperature: [-50, 60] as const, // °C — Dallol to Vostok
  windSpeed: [0, 250] as const, // knots — record gust ~250kn
  windGust: [0, 300] as const,
  windDirection: [0, 360] as const,
  precipitation: [0, 500] as const, // mm/h
  cloudCover: [0, 100] as const, // %
  waveHeight: [0, 15] as const, // m
  waveDirection: [0, 360] as const,
} as const;

function clampOrNull(
  v: unknown,
  [min, max]: readonly [number, number],
): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v < min || v > max) return null;
  return v;
}

function clampOrZero(
  v: unknown,
  [min, max]: readonly [number, number],
): number {
  return clampOrNull(v, [min, max]) ?? 0;
}

/**
 * Exposed for unit tests. Bounds every field, replaces NaN/out-of-range
 * with safe defaults (0 for non-nullable, null for nullable).
 */
export function sanitizeWeather(raw: {
  temperature_2m?: unknown;
  wind_speed_10m?: unknown;
  wind_gusts_10m?: unknown;
  wind_direction_10m?: unknown;
  precipitation?: unknown;
  cloud_cover?: unknown;
  wave_height?: unknown;
  wave_direction?: unknown;
}): Omit<WeatherData, "fetchedAt"> {
  return {
    temperature: clampOrZero(raw.temperature_2m, BOUNDS.temperature),
    windSpeed: clampOrZero(raw.wind_speed_10m, BOUNDS.windSpeed),
    windGust: clampOrZero(raw.wind_gusts_10m, BOUNDS.windGust),
    windDirection: clampOrZero(raw.wind_direction_10m, BOUNDS.windDirection),
    precipitation: clampOrZero(raw.precipitation, BOUNDS.precipitation),
    cloudCover: clampOrZero(raw.cloud_cover, BOUNDS.cloudCover),
    waveHeight: clampOrNull(raw.wave_height, BOUNDS.waveHeight),
    waveDirection: clampOrNull(raw.wave_direction, BOUNDS.waveDirection),
  };
}

export async function getWeather(
  portId: string,
  lat: number,
  lon: number,
): Promise<WeatherData> {
  const cached = cache.get(portId);
  if (cached && cached.expires > Date.now()) return cached.data;

  const [forecast, marine] = await Promise.all([
    fetch(`${FORECAST_URL}&latitude=${lat}&longitude=${lon}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    }).then((r) => (r.ok ? r.json() : null)),
    fetch(`${MARINE_URL}&latitude=${lat}&longitude=${lon}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const f = forecast?.current ?? {};
  const m = marine?.current ?? {};

  const data: WeatherData = {
    ...sanitizeWeather({ ...f, ...m }),
    fetchedAt: Date.now(),
  };

  cache.set(portId, { data, expires: Date.now() + TTL_MS });
  return data;
}
