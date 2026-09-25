import { db, type VoyageRow } from "./db";
import { getStatic, getVessels } from "./store";
import { getPort } from "./ports";
import { TANKER_CARGOS } from "./cargo";
import { isVesselSanctioned } from "./uk-sanctions";

/**
 * Voyages ouverts d'un port, enrichis et classés « inbound » / « waiting ».
 *
 * Extrait de la route /api/voyages/active (09/2026) pour être appelé AUSSI
 * par le composant serveur app/page.tsx : les tuiles « voyages actifs » et
 * « en attente en rade » sont ainsi rendues avec leurs chiffres dans le HTML
 * initial, au lieu d'attendre bundle + hydratation + polling.
 *
 * Seuils de classification : un voyage ouvert est « inbound » ssi le navire
 * se dirige activement vers le port —
 *  - SOG ≥ INBOUND_MIN_SOG_KN (il bouge)
 *  - distance ≥ INBOUND_MIN_DISTANCE_NM (pas déjà à la porte)
 *  - cap grossièrement convergent vers le port
 *    (|relèvement − COG| ≤ INBOUND_MAX_BEARING_DIFF_DEG)
 * Sinon « waiting » : au mouillage en rade, en dérive, ou s'éloignant. Les
 * deux états restent des voyages ouverts ; seul l'affichage change.
 */
const NM_PER_DEG_LAT = 60;
const INBOUND_MIN_SOG_KN = 2;
const INBOUND_MIN_DISTANCE_NM = 3;
const INBOUND_MAX_BEARING_DIFF_DEG = 60;

export type VoyageState = "inbound" | "waiting";

export interface ActiveVoyageItem {
  voyageId: string;
  mmsi: number;
  name: string;
  cargoClass: string | undefined;
  startTs: number;
  // Les champs SQL optionnels arrivent en `undefined` (VoyageRow), pas en
  // `null` : on accepte les deux, la sérialisation JSON les confond de
  // toute façon côté client.
  startDistanceNm: number | null | undefined;
  currentDistanceNm: number | null | undefined;
  currentSog: number;
  currentState: string;
  voyageState: VoyageState;
  zone: string | undefined;
  predictedEta: number | null | undefined;
  predictedAt: number | null | undefined;
  broadcastEta: number | null | undefined;
  draught: number | undefined;
  sanctioned: true | undefined;
}

export interface ActiveVoyagesPayload {
  port: string;
  ts: number;
  count: number;
  inboundCount: number;
  waitingCount: number;
  voyages: ActiveVoyageItem[];
}

function distanceNm(
  centerLat: number,
  centerLon: number,
  lat: number,
  lon: number,
): number {
  const dLat = lat - centerLat;
  const dLon = (lon - centerLon) * Math.cos((lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon) * NM_PER_DEG_LAT;
}

function bearingDeg(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(fromLat);
  const φ2 = toRad(toLat);
  const Δλ = toRad(toLon - fromLon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

function classifyVoyage(
  vessel:
    | { sog: number; cog: number; latitude: number; longitude: number }
    | undefined,
  distance: number | null | undefined,
  port: { center: [number, number] },
): VoyageState {
  if (!vessel || distance == null) return "waiting";
  if (vessel.sog < INBOUND_MIN_SOG_KN) return "waiting";
  if (distance < INBOUND_MIN_DISTANCE_NM) return "waiting";
  const bearing = bearingDeg(
    vessel.latitude,
    vessel.longitude,
    port.center[0],
    port.center[1],
  );
  if (angleDiff(bearing, vessel.cog) > INBOUND_MAX_BEARING_DIFF_DEG) {
    return "waiting";
  }
  return "inbound";
}

/** Retourne null si le port est inconnu. */
export function computeActiveVoyages(
  portId: string,
  onlyTankers = false,
): ActiveVoyagesPayload | null {
  const port = getPort(portId);
  if (!port) return null;

  const allOpen = db()
    .raw.prepare(
      `SELECT * FROM voyages WHERE port = ? AND arrived_ts IS NULL ORDER BY start_ts DESC LIMIT 500`,
    )
    .all(portId) as unknown as VoyageRow[];

  const vesselByMmsi = new Map(getVessels(portId).map((v) => [v.mmsi, v]));

  const enriched: ActiveVoyageItem[] = allOpen
    .map((row) => {
      const vessel = vesselByMmsi.get(row.mmsi);
      const stat = getStatic(row.mmsi);
      const cargoClass = (row.cargo_class ?? stat?.cargoClass) as
        | string
        | undefined;
      const distance = vessel
        ? distanceNm(
            port.center[0],
            port.center[1],
            vessel.latitude,
            vessel.longitude,
          )
        : row.start_distance_nm;
      const sanctioned = isVesselSanctioned({
        mmsi: row.mmsi,
        imo: (stat as { imo?: number } | undefined)?.imo ?? null,
      });
      return {
        voyageId: row.voyage_id,
        mmsi: row.mmsi,
        name: stat?.name ?? `MMSI ${row.mmsi}`,
        cargoClass,
        startTs: row.start_ts,
        startDistanceNm: row.start_distance_nm,
        currentDistanceNm: distance,
        currentSog: vessel?.sog ?? 0,
        currentState: vessel?.state ?? "unknown",
        voyageState: classifyVoyage(vessel, distance, port),
        zone: vessel?.zone,
        predictedEta: row.predicted_eta,
        predictedAt: row.predicted_at,
        broadcastEta: row.broadcast_eta,
        draught: stat?.draught,
        sanctioned: sanctioned || undefined,
      };
    })
    .filter((row) => {
      if (!onlyTankers) return true;
      return Boolean(row.cargoClass && TANKER_CARGOS.has(row.cargoClass as never));
    })
    .sort((a, b) => (a.predictedEta ?? Infinity) - (b.predictedEta ?? Infinity));

  const inboundCount = enriched.filter((v) => v.voyageState === "inbound").length;
  return {
    port: portId,
    ts: Date.now(),
    count: enriched.length,
    inboundCount,
    waitingCount: enriched.length - inboundCount,
    voyages: enriched,
  };
}
