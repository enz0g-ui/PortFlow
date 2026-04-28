import { db } from "./db";
import { getVessels } from "./store";

const NM_PER_DEG_LAT = 60;

interface SarRow {
  id: number;
  port: string;
  ts: number;
  lat: number;
  lon: number;
  intensity: number;
  size_px: number;
}

export interface FusionMatch {
  detectionId: number;
  detectionLat: number;
  detectionLon: number;
  detectionTs: number;
  matchedMmsi?: number;
  matchedName?: string;
  matchedDistanceNm?: number;
  matchedDeltaSeconds?: number;
  confidence: "ais-confirmed" | "ais-stale" | "dark-candidate";
  notes?: string;
}

const MAX_DISTANCE_NM = 1.0;
const MAX_AGE_MS = 30 * 60_000;

function distanceNm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = lat1 - lat2;
  const dLon = (lon1 - lon2) * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon) * NM_PER_DEG_LAT;
}

export function fuseSarWithAis(
  portId: string,
  sinceMs: number,
): FusionMatch[] {
  const sar = db()
    .raw.prepare(
      `SELECT id, port, ts, lat, lon, intensity, size_px
       FROM sar_detections WHERE port = ? AND ts >= ? ORDER BY ts DESC LIMIT 200`,
    )
    .all(portId, sinceMs) as unknown as SarRow[];

  if (sar.length === 0) return [];

  const liveVessels = getVessels(portId);
  const matches: FusionMatch[] = [];

  for (const det of sar) {
    let bestVessel: (typeof liveVessels)[number] | null = null;
    let bestDistance = Infinity;
    let bestDelta = Infinity;

    for (const v of liveVessels) {
      const d = distanceNm(det.lat, det.lon, v.latitude, v.longitude);
      if (d > MAX_DISTANCE_NM) continue;
      const delta = Math.abs(det.ts - v.lastUpdate);
      if (delta > MAX_AGE_MS) continue;
      if (d < bestDistance) {
        bestDistance = d;
        bestDelta = delta;
        bestVessel = v;
      }
    }

    if (bestVessel) {
      const fresh = bestDelta < 5 * 60_000;
      matches.push({
        detectionId: det.id,
        detectionLat: det.lat,
        detectionLon: det.lon,
        detectionTs: det.ts,
        matchedMmsi: bestVessel.mmsi,
        matchedName: bestVessel.name,
        matchedDistanceNm: bestDistance,
        matchedDeltaSeconds: Math.round(bestDelta / 1000),
        confidence: fresh ? "ais-confirmed" : "ais-stale",
      });
    } else {
      matches.push({
        detectionId: det.id,
        detectionLat: det.lat,
        detectionLon: det.lon,
        detectionTs: det.ts,
        confidence: "dark-candidate",
        notes:
          "No AIS position within 1 nm and 30 min — vessel either out of AIS coverage or transmitting silently",
      });
    }
  }

  return matches;
}
