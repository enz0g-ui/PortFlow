import { db } from "./db";
import { getPort } from "./ports";
import { getVessel } from "./store";

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
  /** Erreur absolue médiane du modèle à cet horizon, sur ce port (30 j). */
  errHours: number | null;
  errCount: number;
}

interface Row {
  port: string;
  start_ts: number;
  arrived_ts: number | null;
  predicted_eta: number | null;
  predicted_at: number | null;
  broadcast_eta: number | null;
}

// Erreur typique par port ET par horizon : erreur absolue médiane des
// prédictions faites à un délai comparable avant l'arrivée (voyages clos,
// 30 derniers jours). Recalculée au plus une fois par heure et par port.
const HORIZONS = [1, 3, 6, 12, 24, 72]; // bornes hautes, en heures
const errCache = new Map<string, { at: number; buckets: Array<{ med: number | null; n: number }> }>();

function portErrorBuckets(portId: string) {
  const c = errCache.get(portId);
  if (c && Date.now() - c.at < H) return c.buckets;
  const lists: number[][] = HORIZONS.map(() => []);
  try {
    const rows = db()
      .raw.prepare(
        `SELECT predicted_eta p, predicted_at pa, arrived_ts a FROM voyages
         WHERE port = ? AND arrived_ts > ? AND predicted_eta IS NOT NULL AND predicted_at IS NOT NULL`,
      )
      .all(portId, Date.now() - 30 * 24 * H) as unknown as Array<{ p: number; pa: number; a: number }>;
    for (const r of rows) {
      const hz = (r.a - r.pa) / H;
      const i = HORIZONS.findIndex((b) => hz < b);
      if (i >= 0 && hz >= 0) lists[i].push(Math.abs(r.p - r.a) / H);
    }
  } catch {
    /* pas de mesure : pas de marge affichée */
  }
  const buckets = lists.map((l) => {
    l.sort((a, b) => a - b);
    return { med: l.length ? l[l.length >> 1] : null, n: l.length };
  });
  errCache.set(portId, { at: Date.now(), buckets });
  return buckets;
}

function typicalError(portId: string, horizonH: number): { med: number | null; n: number } {
  const i = HORIZONS.findIndex((b) => horizonH < b);
  if (i < 0) return { med: null, n: 0 };
  return portErrorBuckets(portId)[i];
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
    const m =
      predictedEta != null ? typicalError(r.port, Math.max(0, (predictedEta - now) / H)) : { med: null, n: 0 };
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
      errHours: m.med,
      errCount: m.n,
    };
  }
  return null;
}
