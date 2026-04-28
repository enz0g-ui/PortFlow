import { db } from "../db";
import { PORTS } from "../ports";
import {
  detectShipsCfar,
  geocodeDetections,
  type DetectionGeo,
} from "./cfar";
import { fetchSarImage } from "./copernicus";

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_LOOKBACK_DAYS = 7;

interface ScannerState {
  started: boolean;
  lastScanAt?: number;
  lastError?: string;
}

const KEY = "__rotterdamSarScanner" as const;
type WithState = typeof globalThis & { [KEY]?: ScannerState };

function getState(): ScannerState {
  const g = globalThis as WithState;
  if (!g[KEY]) g[KEY] = { started: false };
  return g[KEY]!;
}

function isAuthAvailable(): boolean {
  return (
    !!process.env.COPERNICUS_CLIENT_ID && !!process.env.COPERNICUS_CLIENT_SECRET
  );
}

function isDemoEnabled(): boolean {
  return process.env.SAR_DEMO === "1";
}

function persistScene(input: {
  sceneId: string;
  port: string;
  acquiredAt: number;
  bbox: [number, number, number, number];
  width: number;
  height: number;
  detections: DetectionGeo[];
  notes?: string;
  status?: string;
}) {
  const insertScene = db().raw.prepare(
    `INSERT OR REPLACE INTO sar_scenes
     (scene_id, port, acquired_at, scanned_at, bbox_s, bbox_w, bbox_n, bbox_e, width, height, detections_count, source, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sentinel1', ?, ?)`,
  );
  insertScene.run(
    input.sceneId,
    input.port,
    input.acquiredAt,
    Date.now(),
    input.bbox[0],
    input.bbox[1],
    input.bbox[2],
    input.bbox[3],
    input.width,
    input.height,
    input.detections.length,
    input.status ?? "processed",
    input.notes ?? null,
  );

  const insertDet = db().raw.prepare(
    `INSERT INTO sar_detections
     (scene_id, port, ts, lat, lon, intensity, size_px, bbox_minx, bbox_miny, bbox_maxx, bbox_maxy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  if (input.detections.length === 0) return;
  db().raw.exec("BEGIN");
  try {
    for (const d of input.detections) {
      insertDet.run(
        input.sceneId,
        input.port,
        input.acquiredAt,
        d.lat,
        d.lon,
        d.intensity,
        d.sizePx,
        d.bbox[0],
        d.bbox[1],
        d.bbox[2],
        d.bbox[3],
      );
    }
    db().raw.exec("COMMIT");
  } catch (err) {
    db().raw.exec("ROLLBACK");
    throw err;
  }
}

function generateDemoDetections(
  bbox: [number, number, number, number],
  count: number,
  seed: number,
): DetectionGeo[] {
  const [s, w, n, e] = bbox;
  const detections: DetectionGeo[] = [];
  let r = seed;
  const rand = () => {
    r = (r * 1664525 + 1013904223) % 4294967296;
    return r / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const lat = s + rand() * (n - s);
    const lon = w + rand() * (e - w);
    detections.push({
      cx: 0,
      cy: 0,
      sizePx: 4 + Math.floor(rand() * 12),
      intensity: 200 + rand() * 55,
      bbox: [0, 0, 0, 0],
      lat,
      lon,
    });
  }
  return detections;
}

async function scanPort(port: {
  id: string;
  bbox: [number, number, number, number];
  region: string;
}): Promise<void> {
  const since = Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const sceneId = `sen1_${port.id}_${Date.now()}`;

  if (!isAuthAvailable()) {
    if (isDemoEnabled()) {
      const detections = generateDemoDetections(port.bbox, 8, Date.now());
      persistScene({
        sceneId: `demo_${port.id}_${Date.now()}`,
        port: port.id,
        acquiredAt: Date.now(),
        bbox: port.bbox,
        width: 0,
        height: 0,
        detections,
        status: "demo",
        notes: "synthetic detections (SAR_DEMO=1)",
      });
    }
    return;
  }

  try {
    const result = await fetchSarImage(port.bbox, since, Date.now());
    if (!result) return;
    const raw = detectShipsCfar(result.pixels, result.width, result.height, {
      k: 5,
      minSizePx: 2,
      maxSizePx: 200,
    });
    const geo = geocodeDetections(raw, port.bbox, result.width, result.height);
    persistScene({
      sceneId: result.sceneId,
      port: port.id,
      acquiredAt: result.acquiredAt,
      bbox: port.bbox,
      width: result.width,
      height: result.height,
      detections: geo,
    });
  } catch (err) {
    persistScene({
      sceneId,
      port: port.id,
      acquiredAt: Date.now(),
      bbox: port.bbox,
      width: 0,
      height: 0,
      detections: [],
      status: "error",
      notes: (err as Error).message.slice(0, 200),
    });
    getState().lastError = (err as Error).message;
  }
}

let timer: NodeJS.Timeout | undefined;

const PRIORITY_REGIONS = new Set(["chokepoint", "middle-east"]);

async function tick() {
  const state = getState();
  state.lastScanAt = Date.now();
  const ports = PORTS.filter((p) => PRIORITY_REGIONS.has(p.region));
  for (const p of ports) {
    try {
      await scanPort({ id: p.id, bbox: p.bbox, region: p.region });
    } catch (err) {
      console.error(`[sar] scan ${p.id} failed`, err);
    }
  }
}

export function startSarScanner(intervalMs = DEFAULT_INTERVAL_MS) {
  const state = getState();
  if (state.started) return;
  if (!isAuthAvailable() && !isDemoEnabled()) {
    console.log(
      "[sar] no Copernicus credentials and SAR_DEMO != 1 — scanner idle. Set COPERNICUS_CLIENT_ID/SECRET or SAR_DEMO=1 to activate.",
    );
    return;
  }
  state.started = true;
  console.log(
    `[sar] scanner started (interval=${intervalMs}ms · demo=${isDemoEnabled()} · auth=${isAuthAvailable()})`,
  );
  tick().catch((err) => console.error("[sar] initial tick failed", err));
  timer = setInterval(() => {
    tick().catch((err) => console.error("[sar] tick failed", err));
  }, intervalMs);
}

export function getScannerStatus(): {
  started: boolean;
  lastScanAt?: number;
  lastError?: string;
  authAvailable: boolean;
  demoEnabled: boolean;
} {
  const state = getState();
  return {
    started: state.started,
    lastScanAt: state.lastScanAt,
    lastError: state.lastError,
    authAvailable: isAuthAvailable(),
    demoEnabled: isDemoEnabled(),
  };
}
