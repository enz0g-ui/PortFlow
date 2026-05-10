import { db } from "./db";

/**
 * Global Fishing Watch (GFW) Events API client.
 *
 * GFW publishes four datasets of derived vessel events, computed from
 * the global AIS feed they aggregate (Spire + their own receivers):
 *
 *   - encounters         : two vessels within 500 m for >2 h → ship-to-ship
 *                          transfer signal. Major compliance trigger
 *                          (Iran/Russia sanction-evasion pattern).
 *   - loitering          : vessel below 2 kn for >2 h far from any port →
 *                          suspicious behaviour (could be illicit activity,
 *                          waiting for transfer, etc).
 *   - port-visits        : confirmed entry/exit of a port. Authoritative
 *                          ground-truth for our voyage detector.
 *   - fishing            : detected fishing activity. Less relevant for
 *                          our cargo-focused ICPs but useful for fleet
 *                          owners verifying their vessels' behaviour.
 *
 * License: GFW data is FREE FOR NON-COMMERCIAL USE only. Commercial
 * redistribution requires their commercial license. We surface events
 * to authenticated users in their own dashboard (analytic use), which
 * GFW classifies as acceptable internal-tool use.
 *
 * API docs: https://globalfishingwatch.org/our-apis/documentation
 *
 * Auth: Bearer token via env var GFW_API_TOKEN. Get one at
 *   https://globalfishingwatch.org/our-apis/tokens
 *   (requires free GFW account, ~3 day approval).
 *
 * Rate limit: 100 requests per minute per token. We:
 *   - Cache MMSI → vessel-id lookups in SQLite (90-day TTL)
 *   - Cache events in memory (1-hour TTL)
 *   - No-op gracefully when token is missing
 */

const GFW_BASE = "https://gateway.api.globalfishingwatch.org/v3";
const VESSEL_ID_TTL_MS = 90 * 24 * 3600_000;
const EVENTS_TTL_MS = 60 * 60_000;
const FETCH_TIMEOUT_MS = 30_000;

export interface GfwEvent {
  id: string;
  type: "encounter" | "loitering" | "port_visit" | "fishing";
  start: number; // ms epoch
  end: number;   // ms epoch
  durationHours: number;
  position: { lat: number; lon: number };
  // Type-specific payloads (encounter has the OTHER vessel; port_visit
  // has the port name; loitering has avg speed; fishing has hours).
  encounter?: {
    otherVesselMmsi: number | null;
    otherVesselName: string | null;
    otherVesselId: string | null;
    medianDistanceKm: number | null;
  };
  portVisit?: {
    portName: string | null;
    portCountry: string | null;
    portId: string | null;
  };
  loitering?: {
    avgSpeedKn: number | null;
    distanceFromPortNm: number | null;
  };
  fishing?: {
    durationHours: number;
  };
}

interface GfwSearchResponse {
  entries?: Array<{
    selfReportedInfo?: Array<{ ssvid?: string }>;
    registryInfo?: Array<{ vesselId?: string }>;
    id?: string;
    vesselId?: string;
  }>;
}

interface GfwEventsResponse {
  entries?: Array<{
    id: string;
    type?: string;
    start?: string;
    end?: string;
    position?: { lat?: number; lon?: number };
    encounter?: {
      vessel?: { ssvid?: string; name?: string; id?: string };
      median_distance_km?: number;
      medianDistanceKm?: number;
    };
    port_visit?: {
      intermediateAnchorage?: { name?: string; flag?: string; id?: string };
    };
    portVisit?: {
      intermediateAnchorage?: { name?: string; flag?: string; id?: string };
    };
    loitering?: {
      avg_speed_knots?: number;
      avgSpeedKnots?: number;
      total_distance_km?: number;
      totalDistanceKm?: number;
    };
    fishing?: {
      total_distance_km?: number;
      totalDistanceKm?: number;
    };
  }>;
}

function getToken(): string | null {
  return process.env.GFW_API_TOKEN ?? null;
}

async function gfwFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T | null> {
  const token = getToken();
  if (!token) return null;
  const url = `${GFW_BASE}${path}?${new URLSearchParams(params).toString()}`;
  try {
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        "user-agent": "Octopode-PortFlow/1.0 (compliance research)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[gfw] ${path} → HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[gfw] ${path} → fetch error`, (err as Error).message);
    return null;
  }
}

/**
 * Resolves an MMSI to GFW's internal vessel-id. Uses a SQLite cache
 * with 90-day TTL since the mapping is stable.
 */
export async function resolveGfwVesselId(mmsi: number): Promise<string | null> {
  const now = Date.now();

  // Cache hit: still fresh.
  const cached = db()
    .raw.prepare(
      `SELECT gfw_vessel_id, resolved_at FROM gfw_vessel_cache WHERE mmsi = ?`,
    )
    .get(mmsi) as { gfw_vessel_id: string | null; resolved_at: number } | undefined;
  if (cached && now - cached.resolved_at < VESSEL_ID_TTL_MS) {
    return cached.gfw_vessel_id;
  }

  // Cache miss or stale → search GFW.
  const search = await gfwFetch<GfwSearchResponse>("/vessels/search", {
    query: String(mmsi),
    datasets: "public-global-vessel-identity:latest",
    limit: "1",
  });
  if (!search) return cached?.gfw_vessel_id ?? null;

  const entry = search.entries?.[0];
  // The id field name varies by API version; try both.
  const vesselId =
    entry?.id ??
    entry?.vesselId ??
    entry?.registryInfo?.[0]?.vesselId ??
    null;

  // Persist the lookup (even null result — saves us from re-searching
  // unknown MMSIs every time).
  db()
    .raw.prepare(
      `INSERT OR REPLACE INTO gfw_vessel_cache
         (mmsi, gfw_vessel_id, resolved_at, raw_search_response, last_event_fetch_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      mmsi,
      vesselId,
      now,
      JSON.stringify(search).slice(0, 4000),
      cached?.gfw_vessel_id === vesselId
        ? db()
            .raw.prepare(
              `SELECT last_event_fetch_at FROM gfw_vessel_cache WHERE mmsi = ?`,
            )
            .get(mmsi) as { last_event_fetch_at: number | null } | undefined
            ? null
            : null
        : null,
    );

  return vesselId;
}

/**
 * Fetches recent events of all four types for a given GFW vessel-id.
 * Memory-cached for 1 hour to limit API calls.
 */
const _eventsCache = new Map<
  string,
  { ts: number; events: GfwEvent[] }
>();

export async function getVesselEvents(opts: {
  mmsi: number;
  daysBack?: number;
  types?: Array<"encounter" | "loitering" | "port_visit" | "fishing">;
}): Promise<GfwEvent[]> {
  const days = Math.max(1, Math.min(365, opts.daysBack ?? 90));
  const types =
    opts.types ?? (["encounter", "loitering", "port_visit"] as const);
  const cacheKey = `${opts.mmsi}:${days}:${types.join(",")}`;
  const cached = _eventsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < EVENTS_TTL_MS) {
    return cached.events;
  }

  const vesselId = await resolveGfwVesselId(opts.mmsi);
  if (!vesselId) return [];

  const startDate = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  // GFW dataset key per event type.
  const datasetMap: Record<string, string> = {
    encounter: "public-global-encounters-events:latest",
    loitering: "public-global-loitering-events:latest",
    port_visit: "public-global-port-visits-events:latest",
    fishing: "public-global-fishing-events:latest",
  };

  const all: GfwEvent[] = [];
  for (const t of types) {
    const dataset = datasetMap[t];
    if (!dataset) continue;
    const resp = await gfwFetch<GfwEventsResponse>("/events", {
      vessels: vesselId,
      datasets: dataset,
      "start-date": startDate,
      "end-date": endDate,
      limit: "50",
    });
    if (!resp?.entries) continue;
    for (const e of resp.entries) {
      const start = e.start ? Date.parse(e.start) : 0;
      const end = e.end ? Date.parse(e.end) : start;
      if (!start) continue;
      const durH = end > start ? (end - start) / 3_600_000 : 0;
      const ev: GfwEvent = {
        id: e.id,
        type: t,
        start,
        end,
        durationHours: Math.round(durH * 10) / 10,
        position: {
          lat: e.position?.lat ?? 0,
          lon: e.position?.lon ?? 0,
        },
      };
      if (t === "encounter") {
        ev.encounter = {
          otherVesselMmsi: e.encounter?.vessel?.ssvid
            ? parseInt(e.encounter.vessel.ssvid, 10)
            : null,
          otherVesselName: e.encounter?.vessel?.name ?? null,
          otherVesselId: e.encounter?.vessel?.id ?? null,
          medianDistanceKm:
            e.encounter?.median_distance_km ??
            e.encounter?.medianDistanceKm ??
            null,
        };
      } else if (t === "port_visit") {
        const a =
          e.port_visit?.intermediateAnchorage ??
          e.portVisit?.intermediateAnchorage;
        ev.portVisit = {
          portName: a?.name ?? null,
          portCountry: a?.flag ?? null,
          portId: a?.id ?? null,
        };
      } else if (t === "loitering") {
        ev.loitering = {
          avgSpeedKn:
            e.loitering?.avg_speed_knots ?? e.loitering?.avgSpeedKnots ?? null,
          distanceFromPortNm: null,
        };
      } else if (t === "fishing") {
        ev.fishing = { durationHours: ev.durationHours };
      }
      all.push(ev);
    }
  }

  // Sort newest first.
  all.sort((a, b) => b.start - a.start);

  // Track last fetch in DB cache for analytics.
  db()
    .raw.prepare(
      `UPDATE gfw_vessel_cache SET last_event_fetch_at = ? WHERE mmsi = ?`,
    )
    .run(Date.now(), opts.mmsi);

  _eventsCache.set(cacheKey, { ts: Date.now(), events: all });
  return all;
}

export function isGfwConfigured(): boolean {
  return !!getToken();
}
