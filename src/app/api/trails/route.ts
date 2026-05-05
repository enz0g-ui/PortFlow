import { db } from "@/lib/db";
import { getPort } from "@/lib/ports";
import { getVessels } from "@/lib/store";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/trails?port=PORT_ID&minutes=30
 *
 * Returns recent position trails for all vessels currently tracked in the
 * given port, keyed by MMSI. Used by the dashboard map to draw fading
 * trails behind each vessel — same UX as VesselFinder / Spire.
 *
 * Response shape:
 *   {
 *     port: "rotterdam",
 *     since: 1777920000000,
 *     count: 142,                              // number of vessels with trails
 *     points: 3210,                            // total point count
 *     trails: { "211517290": [[lat, lon, ts], ...], ... }
 *   }
 *
 * Performance:
 * - Filters by the in-memory live vessel list (so we only fetch trails for
 *   ~700 vessels, not the entire `positions` table).
 * - Uses the (mmsi, ts) primary key — fast even on 12M+ rows.
 * - Caps the response at 30 000 points total to keep payload size sane.
 * - Server-side cache TTL 30 s (the worker writes to positions every minute,
 *   so 30 s is enough granularity).
 */

interface TrailRow {
  mmsi: number;
  ts: number;
  lat: number;
  lon: number;
}

interface CachedResponse {
  fetchedAt: number;
  payload: unknown;
}

const CACHE_TTL_MS = 30_000;
const MAX_TOTAL_POINTS = 30_000;
const cache = new Map<string, CachedResponse>();

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? "rotterdam";
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const minutesRaw = Number(request.nextUrl.searchParams.get("minutes") ?? 30);
  // Clamp to [5, 240] minutes — keeps payloads bounded.
  const minutes = Math.max(5, Math.min(240, Math.floor(minutesRaw) || 30));

  const cacheKey = `${portId}:${minutes}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return Response.json(cached.payload);
  }

  const since = now - minutes * 60_000;
  // Live vessels currently tracked in this port (in-memory) — limits the
  // SQL query to MMSIs we actually care about and avoids scanning the full
  // positions table for unrelated vessels.
  const liveMmsis = getVessels(portId).map((v) => v.mmsi);

  if (liveMmsis.length === 0) {
    const payload = {
      port: portId,
      since,
      count: 0,
      points: 0,
      trails: {} as Record<string, Array<[number, number, number]>>,
    };
    cache.set(cacheKey, { fetchedAt: now, payload });
    return Response.json(payload);
  }

  // SQLite has a default parameter limit of 999 (`SQLITE_MAX_VARIABLE_NUMBER`).
  // Chunk the IN clause to be safe on busy ports (Singapore can have >999
  // simultaneously tracked vessels).
  const CHUNK = 800;
  const allRows: TrailRow[] = [];
  for (let i = 0; i < liveMmsis.length; i += CHUNK) {
    const chunk = liveMmsis.slice(i, i + CHUNK);
    const placeholders = chunk.map(() => "?").join(",");
    const sql = `SELECT mmsi, ts, lat, lon FROM positions
       WHERE ts >= ? AND mmsi IN (${placeholders})
       ORDER BY mmsi ASC, ts ASC`;
    const rows = db().raw.prepare(sql).all(since, ...chunk) as unknown as TrailRow[];
    for (const r of rows) {
      allRows.push(r);
      if (allRows.length >= MAX_TOTAL_POINTS) break;
    }
    if (allRows.length >= MAX_TOTAL_POINTS) break;
  }

  // Group by MMSI. Drop trails of length < 2 (a single point is not a trail).
  const trails: Record<string, Array<[number, number, number]>> = {};
  for (const row of allRows) {
    const key = String(row.mmsi);
    if (!trails[key]) trails[key] = [];
    trails[key].push([row.lat, row.lon, row.ts]);
  }
  for (const key of Object.keys(trails)) {
    if (trails[key].length < 2) delete trails[key];
  }

  const payload = {
    port: portId,
    since,
    count: Object.keys(trails).length,
    points: allRows.length,
    trails,
  };
  cache.set(cacheKey, { fetchedAt: now, payload });
  return Response.json(payload);
}
