import { db } from "./db";
import { getPort } from "./ports";
import { getVessel } from "./store";
import { getVoyageAccuracy } from "./voyages";

// « Ce qui vient » pour une fiche navire : voyage ouvert vers un port suivi,
// heure d'arrivée prédite par notre modèle (ETA v2), heure annoncée par le
// navire, et l'erreur typique mesurée du modèle sur ce port (la même que
// /precision). Rien n'est extrapolé hors de ce que le modèle calcule déjà.

const H = 3_600_000;
const NM_PER_DEG_LAT = 60;

export interface VesselOutlook {
  state: "inbound" | "waiting" | "inPort";
  portId: string;
  portName: string;
  predictedEta: number | null;
  predictedAt: number | null;
  broadcastEta: number | null;
  arrivedTs: number | null;
  startTs: number;
  distanceNm: number | null;
  sog: number | null;
  maeHours: number | null;
  maeCount: number;
}

interface Row {
  port: string;
  start_ts: number;
  arrived_ts: number | null;
  predicted_eta: number | null;
  predicted_at: number | null;
  broadcast_eta: number | null;
}

// Erreur typique par port : recalculée au plus une fois par heure.
const maeCache = new Map<string, { at: number; mae: number | null; n: number }>();
function portMae(portId: string): { mae: number | null; n: number } {
  const c = maeCache.get(portId);
  if (c && Date.now() - c.at < H) return c;
  let mae: number | null = null;
  let n = 0;
  try {
    const a = getVoyageAccuracy(portId, Date.now() - 30 * 24 * H);
    mae = a.maeHours;
    n = a.count;
  } catch {
    /* pas de mesure : on n'affiche pas de marge */
  }
  const v = { at: Date.now(), mae, n };
  maeCache.set(portId, v);
  return v;
}

export function getVesselOutlook(mmsi: number): VesselOutlook | null {
  const now = Date.now();
  // Beaucoup de voyages restent « ouverts » en base sans clôture : on ne
  // garde qu'un voyage récent dont le navire est encore vu dans la zone du port.
  const rows = db()
    .raw.prepare(
      `SELECT port, start_ts, arrived_ts, predicted_eta, predicted_at, broadcast_eta
       FROM voyages
       WHERE mmsi = ? AND departed_ts IS NULL AND start_ts > ?
       ORDER BY start_ts DESC LIMIT 5`,
    )
    .all(mmsi, now - 5 * 24 * H) as unknown as Row[];

  for (const r of rows) {
    const live = getVessel(r.port, mmsi);
    if (!live || now - live.lastUpdate > 6 * H) continue;
    const port = getPort(r.port);
    if (!port) continue;
    const [pLat, pLon] = port.center;
    const dLat = live.latitude - pLat;
    const dLon = (live.longitude - pLon) * Math.cos((live.latitude * Math.PI) / 180);
    const distanceNm = Math.sqrt(dLat * dLat + dLon * dLon) * NM_PER_DEG_LAT;

    let state: VesselOutlook["state"];
    if (r.arrived_ts != null) {
      if (live.state !== "moored") continue; // reparti : voyage terminé de fait
      state = "inPort";
    } else {
      state = live.sog >= 1 ? "inbound" : "waiting";
    }
    const fresh = r.predicted_at != null && now - r.predicted_at < 6 * H;
    const predictedEta =
      state !== "inPort" && fresh && r.predicted_eta != null && r.predicted_eta > now - 2 * H
        ? Math.round(r.predicted_eta)
        : null;
    const broadcastEta =
      state !== "inPort" && r.broadcast_eta != null && r.broadcast_eta > now - 2 * H && r.broadcast_eta < now + 30 * 24 * H
        ? r.broadcast_eta
        : null;
    const m = state === "inPort" ? { mae: null, n: 0 } : portMae(r.port);
    return {
      state,
      portId: r.port,
      portName: port.name,
      predictedEta,
      predictedAt: r.predicted_at,
      broadcastEta,
      arrivedTs: r.arrived_ts,
      startTs: r.start_ts,
      distanceNm: Number.isFinite(distanceNm) ? distanceNm : null,
      sog: live.sog ?? null,
      maeHours: m.mae,
      maeCount: m.n,
    };
  }
  return null;
}
