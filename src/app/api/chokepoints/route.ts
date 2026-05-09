import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const dynamic = "force-static";
export const revalidate = 86400;

/**
 * GET /api/chokepoints
 *
 * Returns the maritime chokepoint polygon FeatureCollection used for
 * vessel-transit detection (Suez, Hormuz, Bab el-Mandeb, Malacca,
 * Bosphorus, Gibraltar, Skagerrak, Dover, Panama, Cape of Good Hope,
 * Magellan). 12 zones total.
 *
 * Coordinates are facts (not copyrightable). Refine bounding boxes as
 * needed in the static GeoJSON file under public/data/chokepoints.geojson.
 */

let _cached: { ts: number; body: string } | null = null;

export async function GET() {
  const now = Date.now();
  if (_cached && now - _cached.ts < 86_400_000) {
    return new Response(_cached.body, {
      headers: {
        "content-type": "application/geo+json",
        "cache-control": "public, max-age=86400",
      },
    });
  }
  try {
    const path = resolve(process.cwd(), "public/data/chokepoints.geojson");
    const body = await readFile(path, "utf-8");
    _cached = { ts: now, body };
    return new Response(body, {
      headers: {
        "content-type": "application/geo+json",
        "cache-control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return Response.json(
      { error: "chokepoints unavailable", detail: (err as Error).message },
      { status: 500 },
    );
  }
}
