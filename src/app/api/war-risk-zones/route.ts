import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const dynamic = "force-static";
export const revalidate = 3600;

/**
 * GET /api/war-risk-zones
 *
 * Returns a curated GeoJSON FeatureCollection of war-risk maritime zones
 * (approximating Joint War Committee JWLA-033 published 3 March 2026 by
 * Lloyd's Market Association). Boundary coordinates are facts and not
 * copyrightable under EU/UK law; the polygons here are derived from
 * public JWC bulletins and news reporting.
 *
 * IMPORTANT: these are INDICATIVE only. They are not authoritative for
 * navigation, war-risk insurance pricing, or regulatory compliance.
 * Reference the official JWC PDF at lmalloyds.com for binding boundaries.
 *
 * Update cadence: roughly quarterly (when JWC publishes a new JWLA), so
 * we cache the file at the edge for 1 hour. The static GeoJSON itself is
 * version-controlled in the repo.
 */

let _cached: { ts: number; body: string } | null = null;

export async function GET() {
  const now = Date.now();
  if (_cached && now - _cached.ts < 3_600_000) {
    return new Response(_cached.body, {
      headers: {
        "content-type": "application/geo+json",
        "cache-control": "public, max-age=3600",
      },
    });
  }
  try {
    const path = resolve(process.cwd(), "public/data/war-risk-zones.geojson");
    const body = await readFile(path, "utf-8");
    _cached = { ts: now, body };
    return new Response(body, {
      headers: {
        "content-type": "application/geo+json",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return Response.json(
      {
        error: "war-risk zones unavailable",
        detail: (err as Error).message,
      },
      { status: 500 },
    );
  }
}
