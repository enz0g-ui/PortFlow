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
    temperature: f.temperature_2m ?? 0,
    windSpeed: f.wind_speed_10m ?? 0,
    windGust: f.wind_gusts_10m ?? 0,
    windDirection: f.wind_direction_10m ?? 0,
    precipitation: f.precipitation ?? 0,
    cloudCover: f.cloud_cover ?? 0,
    waveHeight: typeof m.wave_height === "number" ? m.wave_height : null,
    waveDirection:
      typeof m.wave_direction === "number" ? m.wave_direction : null,
    fetchedAt: Date.now(),
  };

  cache.set(portId, { data, expires: Date.now() + TTL_MS });
  return data;
}
