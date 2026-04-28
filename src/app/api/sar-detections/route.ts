import { db } from "@/lib/db";
import { DEFAULT_PORT_ID, getPort } from "@/lib/ports";
import { getScannerStatus } from "@/lib/sar/scanner";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface DetectionRow {
  id: number;
  scene_id: string;
  port: string;
  ts: number;
  lat: number;
  lon: number;
  intensity: number;
  size_px: number;
}

interface SceneRow {
  scene_id: string;
  port: string;
  acquired_at: number;
  scanned_at: number;
  detections_count: number;
  status: string;
  notes: string | null;
}

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get("port") ?? DEFAULT_PORT_ID;
  if (!getPort(portId)) {
    return Response.json({ error: "unknown port" }, { status: 400 });
  }
  const days = Number(request.nextUrl.searchParams.get("days") ?? "14");
  const since = Date.now() - days * 24 * 60 * 60 * 1000;

  const detections = db()
    .raw.prepare(
      `SELECT id, scene_id, port, ts, lat, lon, intensity, size_px
       FROM sar_detections WHERE port = ? AND ts >= ? ORDER BY ts DESC LIMIT 1000`,
    )
    .all(portId, since) as unknown as DetectionRow[];

  const scenes = db()
    .raw.prepare(
      `SELECT scene_id, port, acquired_at, scanned_at, detections_count, status, notes
       FROM sar_scenes WHERE port = ? AND acquired_at >= ? ORDER BY acquired_at DESC LIMIT 50`,
    )
    .all(portId, since) as unknown as SceneRow[];

  return Response.json({
    port: portId,
    sinceMs: since,
    scenes,
    detections,
    scanner: getScannerStatus(),
  });
}
