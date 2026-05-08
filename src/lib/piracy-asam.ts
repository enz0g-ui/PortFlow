import { db } from "./db";

/**
 * NGA ASAM (Anti-Shipping Activity Messages) ingestor.
 *
 * Source: National Geospatial-Intelligence Agency Maritime Safety
 * Information portal (https://msi.nga.mil/). ASAM publishes historical
 * and recent piracy / armed-robbery / hijack / security incidents
 * globally as a structured JSON feed. US Government work — public
 * domain, no attribution required (but credited in /methodology and
 * /legal pages as good citizenship).
 *
 * The exact endpoint URL has changed over the years; we use the public
 * `https://msi.nga.mil/api/publications/asam` REST endpoint which
 * returns active+archived ASAMs as JSON. If that URL stops working we
 * fall back gracefully (log + skip) and the operator can swap the URL
 * via the `NGA_ASAM_URL` env var without redeploying code.
 *
 * Cadence: daily — ASAM publication cadence is irregular (sometimes
 * multiple per day during incident waves, sometimes weeks of silence)
 * but D-1 freshness is fine for a context layer; alerts are handled
 * separately via UKMTO.
 */

const DEFAULT_NGA_ASAM_URL =
  "https://msi.nga.mil/api/publications/asam?status=active";
const FETCH_TIMEOUT_MS = 30_000;

export interface AsamRecord {
  // Common ASAM fields seen in recent NGA outputs. The feed shape has
  // shifted between v1 (XML) and current REST (JSON); we accept several
  // field-name spellings and pick the first one that's defined.
  reference?: string;
  asam_number?: string;
  occurrenceDate?: string;
  date?: string;
  latitude?: number | string;
  longitude?: number | string;
  navArea?: string;
  navarea?: string;
  description?: string;
  hostility?: string;
  victim?: string;
  subreg?: string;
  reference_year?: number;
}

interface FetchResult {
  ok: boolean;
  count: number;
  inserted: number;
  url: string;
  error?: string;
}

function parseAsamRow(rec: AsamRecord): {
  source_id: string;
  occurred_at: number;
  lat: number;
  lon: number;
  navarea: string | null;
  region: string | null;
  hostility: string | null;
  victim: string | null;
  description: string | null;
  url: string | null;
} | null {
  const sourceId = rec.reference ?? rec.asam_number ?? null;
  const dateStr = rec.occurrenceDate ?? rec.date ?? null;
  const lat =
    typeof rec.latitude === "number"
      ? rec.latitude
      : parseFloat(String(rec.latitude ?? ""));
  const lon =
    typeof rec.longitude === "number"
      ? rec.longitude
      : parseFloat(String(rec.longitude ?? ""));
  if (!sourceId || !dateStr || !Number.isFinite(lat) || !Number.isFinite(lon))
    return null;
  const ts = Date.parse(dateStr);
  if (!Number.isFinite(ts)) return null;
  return {
    source_id: sourceId,
    occurred_at: ts,
    lat,
    lon,
    navarea: rec.navArea ?? rec.navarea ?? null,
    region: rec.subreg ?? null,
    hostility: rec.hostility ?? null,
    victim: rec.victim ?? null,
    description: rec.description ?? null,
    url: null,
  };
}

export async function fetchAsam(opts?: {
  url?: string;
}): Promise<FetchResult> {
  const url = opts?.url ?? process.env.NGA_ASAM_URL ?? DEFAULT_NGA_ASAM_URL;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return {
        ok: false,
        count: 0,
        inserted: 0,
        url,
        error: `HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as
      | AsamRecord[]
      | { asam: AsamRecord[] }
      | { results: AsamRecord[] }
      | { features: Array<{ properties: AsamRecord }> };

    // Normalise possible response shapes.
    let records: AsamRecord[] = [];
    if (Array.isArray(json)) records = json;
    else if ("asam" in json && Array.isArray(json.asam)) records = json.asam;
    else if ("results" in json && Array.isArray(json.results))
      records = json.results;
    else if ("features" in json && Array.isArray(json.features))
      records = json.features.map((f) => f.properties);

    const insert = db().raw.prepare(
      `INSERT OR IGNORE INTO piracy_incidents
         (source, source_id, occurred_at, lat, lon, navarea, region, hostility, victim, description, url, raw_json, ingested_at)
       VALUES ('nga_asam', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    let inserted = 0;
    const now = Date.now();
    db().raw.exec("BEGIN");
    try {
      for (const rec of records) {
        const row = parseAsamRow(rec);
        if (!row) continue;
        const r = insert.run(
          row.source_id,
          row.occurred_at,
          row.lat,
          row.lon,
          row.navarea,
          row.region,
          row.hostility,
          row.victim,
          row.description,
          row.url,
          JSON.stringify(rec),
          now,
        );
        if (r.changes > 0) inserted++;
      }
      db().raw.exec("COMMIT");
    } catch (err) {
      db().raw.exec("ROLLBACK");
      throw err;
    }
    return { ok: true, count: records.length, inserted, url };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      inserted: 0,
      url,
      error: (err as Error).message,
    };
  }
}

export interface PiracyIncident {
  id: number;
  source: string;
  sourceId: string;
  occurredAt: number;
  lat: number;
  lon: number;
  navarea: string | null;
  region: string | null;
  hostility: string | null;
  victim: string | null;
  description: string | null;
  url: string | null;
}

export function listPiracyIncidents(opts: {
  bbox?: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
  days?: number;
  limit?: number;
}): PiracyIncident[] {
  const days = Math.max(1, Math.min(3650, opts.days ?? 365));
  const limit = Math.max(1, Math.min(1000, opts.limit ?? 200));
  const since = Date.now() - days * 86_400_000;
  const where: string[] = ["occurred_at >= ?"];
  const params: (string | number)[] = [since];
  if (opts.bbox) {
    where.push("lat BETWEEN ? AND ?");
    where.push("lon BETWEEN ? AND ?");
    params.push(opts.bbox[0], opts.bbox[2], opts.bbox[1], opts.bbox[3]);
  }
  params.push(limit);
  const rows = db()
    .raw.prepare(
      `SELECT id, source, source_id, occurred_at, lat, lon, navarea,
              region, hostility, victim, description, url
       FROM piracy_incidents
       WHERE ${where.join(" AND ")}
       ORDER BY occurred_at DESC
       LIMIT ?`,
    )
    .all(...params) as unknown as Array<{
    id: number;
    source: string;
    source_id: string;
    occurred_at: number;
    lat: number;
    lon: number;
    navarea: string | null;
    region: string | null;
    hostility: string | null;
    victim: string | null;
    description: string | null;
    url: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    sourceId: r.source_id,
    occurredAt: r.occurred_at,
    lat: r.lat,
    lon: r.lon,
    navarea: r.navarea,
    region: r.region,
    hostility: r.hostility,
    victim: r.victim,
    description: r.description,
    url: r.url,
  }));
}

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastRunAt = 0;
let _lastResult: FetchResult | null = null;

export function startPiracyAsamScanner(): void {
  if (_intervalId) return;
  // Daily refresh; first run deferred 60s after boot to keep startup quick.
  setTimeout(async () => {
    try {
      const r = await fetchAsam();
      _lastRunAt = Date.now();
      _lastResult = r;
      if (r.ok) {
        console.log(
          `[piracy-asam] initial fetch: count=${r.count} inserted=${r.inserted}`,
        );
      } else {
        console.error(`[piracy-asam] initial fetch failed: ${r.error}`);
      }
    } catch (err) {
      console.error("[piracy-asam] initial fetch crashed", err);
    }
  }, 60_000);

  _intervalId = setInterval(
    async () => {
      try {
        const r = await fetchAsam();
        _lastRunAt = Date.now();
        _lastResult = r;
        if (r.ok && r.inserted > 0) {
          console.log(`[piracy-asam] +${r.inserted} new incidents`);
        }
      } catch (err) {
        console.error("[piracy-asam] tick crashed", err);
      }
    },
    24 * 3_600_000,
  );
}

export function getPiracyAsamStatus() {
  return {
    started: _intervalId !== null,
    lastRunAt: _lastRunAt || null,
    lastResult: _lastResult,
  };
}
