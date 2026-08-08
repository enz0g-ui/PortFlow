import WebSocket from "ws";
import { classifyCargo, classifyShip, inferState } from "./rotterdam";
import { findPortByPosition, findZone, PORTS } from "./ports";
import { getChokepointSubscriptionBboxes, findChokepoint } from "./chokepoint-detector";
import { db } from "./db";
import {
  getPreviousZone,
  getStatic,
  getVessel,
  meta,
  recordFlow,
  setPreviousZone,
  setStatic,
  shouldPersistPosition,
  trackAnchorTransition,
  upsertVessel,
  inStartupGrace,
} from "./store";
import type { StaticInfo } from "./store";
import type { Vessel } from "./types";
import { startKpiSampler } from "./kpi";
import { persistPosition, persistStatic } from "./db";
import { observeVoyage } from "./voyages";

const STREAM_URL = "wss://stream.aisstream.io/v0/stream";
const MIN_RECONNECT_MS = 1_000;
// Plafond long : pendant la panne AISStream du 05-08/08/2026, le plafond de
// 60 s combiné au reset-sur-open a fait marteler le serveur toutes les ~90 s
// pendant 3 jours → HTTP 429 à l'upgrade WebSocket (mise au piquet).
const MAX_RECONNECT_MS = 10 * 60_000;
// Un refus 429 explicite vaut au minimum cette attente avant de réessayer.
const RATE_LIMIT_FLOOR_MS = 5 * 60_000;

/**
 * AIS strings (Name, CallSign, Destination) are encoded in 6-bit ASCII per
 * ITU-R M.1371. Unused trailing positions are filled with '@' (0x40 in
 * 6-bit), and partially-received messages can leave embedded '@' or NUL
 * bytes. Strip all of those + non-printable controls, then trim.
 */
function cleanAisString(s: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  const cleaned = s
    .replace(/@/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function readStatic(payload: any): StaticInfo {
  const dim = payload?.Dimension ?? {};
  const lengthM =
    typeof dim?.A === "number" && typeof dim?.B === "number"
      ? dim.A + dim.B
      : undefined;
  const name = cleanAisString(payload?.Name);
  const shipType = typeof payload?.Type === "number" ? payload.Type : undefined;
  const destination = cleanAisString(payload?.Destination);
  // IMO : identifiant canonique (clé des listes de sanctions — UKSL n'a
  // souvent PAS de MMSI). 0 = « non disponible » dans le message AIS ; on ne
  // retient qu'une valeur plausible à 7 chiffres. Non transmis en classe B.
  const rawImo = payload?.ImoNumber;
  const imo =
    typeof rawImo === "number" && rawImo >= 1_000_000 && rawImo <= 9_999_999
      ? rawImo
      : undefined;
  return {
    name,
    callsign: cleanAisString(payload?.CallSign),
    shipType,
    destination,
    draught:
      typeof payload?.MaximumStaticDraught === "number"
        ? payload.MaximumStaticDraught
        : undefined,
    lengthM,
    cargoClass: classifyCargo(shipType, name, destination),
    imo,
  };
}

function trackZoneTransition(
  portId: string,
  mmsi: number,
  prevZoneId: string | undefined,
  nextZoneId: string | undefined,
  ts: number,
) {
  if (prevZoneId === nextZoneId) return;
  if (inStartupGrace(portId, ts)) return;

  const prev = prevZoneId ?? "outside";
  const next = nextZoneId ?? "outside";

  if (prev === "outside" && nextZoneId) {
    recordFlow(portId, { ts, mmsi, direction: "inbound", zone: next });
  } else if (prevZoneId && next === "outside") {
    recordFlow(portId, { ts, mmsi, direction: "outbound", zone: prev });
  }
}

function parseBroadcastEta(payload: any): number | undefined {
  const eta = payload?.Eta;
  if (!eta) return undefined;
  const month = eta.Month;
  const day = eta.Day;
  const hour = eta.Hour;
  const minute = eta.Minute;
  if (
    typeof month !== "number" ||
    typeof day !== "number" ||
    typeof hour !== "number" ||
    typeof minute !== "number"
  )
    return undefined;
  if (month === 0 || day === 0 || hour > 23 || minute > 59) return undefined;
  const now = new Date();
  const year = now.getUTCFullYear();
  const candidate = Date.UTC(year, month - 1, day, hour, minute);
  // Year-wrap heuristic: AIS Type 5 ETA has no year field. If the calendar
  // date resolves to far in the past, the captain almost certainly means
  // next year (e.g. broadcasting "Jan 5 ETA" on Dec 20). But within ~60 days
  // we keep current year so stale ETAs surface as legitimate "vessel late"
  // signals rather than getting silently rolled +12 months — which was
  // making the UI show absurd "+8000 h" deltas on overdue vessels.
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
  if (candidate < now.getTime() - SIXTY_DAYS_MS) {
    return Date.UTC(year + 1, month - 1, day, hour, minute);
  }
  return candidate;
}

/**
 * Per-MMSI write throttle for chokepoint positions. Hormuz/Malacca/Suez/
 * Singapore see thousands of vessels; without this we'd write thousands
 * of positions per minute to disk just for transit detection. One write
 * per minute per vessel is enough for the 5-min chokepoint scanner to
 * detect transits with a typical 2-4 hour transit duration giving us
 * 120-240 sample points per vessel per transit.
 */
const CHOKEPOINT_WRITE_INTERVAL_MS = 60_000;
const chokepointWriteAt = new Map<number, number>();

function shouldWriteChokepointPosition(mmsi: number, ts: number): boolean {
  const last = chokepointWriteAt.get(mmsi) ?? 0;
  if (ts - last < CHOKEPOINT_WRITE_INTERVAL_MS) return false;
  chokepointWriteAt.set(mmsi, ts);
  // Cap memory: prune entries older than 1h once we cross 5k vessels tracked.
  if (chokepointWriteAt.size > 5000) {
    const cutoff = ts - 3_600_000;
    for (const [k, v] of chokepointWriteAt) {
      if (v < cutoff) chokepointWriteAt.delete(k);
    }
  }
  return true;
}

let lastUnknownPayloadLogAt = 0;

/** Retourne true si le message était une vraie donnée AIS (MMSI présent). */
function handleMessage(raw: WebSocket.RawData): boolean {
  let msg: any;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return false;
  }

  const mmsi = msg?.MetaData?.MMSI;
  if (typeof mmsi !== "number") {
    // AISStream signale « clé invalide », quota, etc. par un payload SANS
    // MetaData — l'avaler sans trace rend toute panne muette. Loggué
    // throttlé, et PAS compté comme trafic : le watchdog mesure la
    // fraîcheur des données, pas la présence de messages d'erreur.
    const now = Date.now();
    if (now - lastUnknownPayloadLogAt > 60_000) {
      lastUnknownPayloadLogAt = now;
      console.warn(
        `[ais] payload sans MMSI (erreur serveur ?): ${raw.toString().slice(0, 300)}`,
      );
    }
    return false;
  }
  meta.recordMessage();

  if (msg.MessageType === "ShipStaticData") {
    const payload = msg.Message?.ShipStaticData;
    if (payload) {
      const info = readStatic(payload);
      setStatic(mmsi, info);
      try {
        persistStatic({
          mmsi,
          name: info.name,
          callsign: info.callsign,
          ship_type: info.shipType,
          destination: info.destination,
          draught: info.draught,
          length_m: info.lengthM,
          cargo_class: info.cargoClass,
          updated_at: Date.now(),
          imo: info.imo,
        });
      } catch (err) {
        console.error("[db] persistStatic failed", err);
      }
      const broadcastEta = parseBroadcastEta(payload);
      if (broadcastEta) {
        for (const p of PORTS) {
          try {
            observeVoyage({ portId: p.id, mmsi, broadcastEta });
          } catch (err) {
            console.error(`[voyage] eta update ${p.id} failed`, err);
          }
        }
      }
    }
    return true;
  }

  if (msg.MessageType !== "PositionReport") return true;

  const pr = msg.Message?.PositionReport;
  if (!pr) return true;

  const lat = msg.MetaData?.latitude ?? pr.Latitude;
  const lon = msg.MetaData?.longitude ?? pr.Longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return true;

  processPosition({
    mmsi,
    lat,
    lon,
    sog: typeof pr.Sog === "number" ? pr.Sog : undefined,
    cog: typeof pr.Cog === "number" ? pr.Cog : undefined,
    heading: typeof pr.TrueHeading === "number" ? pr.TrueHeading : undefined,
    navStatus:
      typeof pr.NavigationalStatus === "number"
        ? pr.NavigationalStatus
        : undefined,
    shipName: cleanAisString(msg.MetaData?.ShipName),
  });
  return true;
}

/**
 * Position normalisée, indépendante de la source. `source` absent =
 * aisstream (flux primaire) ; les pollers secondaires (BarentsWatch,
 * Digitraffic…) passent leur identifiant, propagé jusqu'à la colonne
 * `positions.source` (provenance : attribution légale NLOD/CC-BY et
 * traçabilité dossier navire).
 */
export interface NormalizedPosition {
  mmsi: number;
  lat: number;
  lon: number;
  sog?: number;
  cog?: number;
  heading?: number;
  navStatus?: number;
  shipName?: string;
  /** Horodatage du message (défaut : maintenant). */
  ts?: number;
  source?: string;
}

// Une source secondaire ne remplace jamais une donnée à peine plus vieille
// déjà en mémoire : le primaire (temps réel) garde la priorité.
const SECONDARY_FRESHNESS_MS = 5_000;

export function processPosition(p: NormalizedPosition) {
  const { mmsi, lat, lon } = p;
  const ts = p.ts ?? Date.now();
  const sogRaw = p.sog ?? 0;
  const sog = sogRaw >= 0 && sogRaw < 60 ? sogRaw : 0;
  const cog = typeof p.cog === "number" && p.cog < 360 ? p.cog : 0;
  const heading =
    typeof p.heading === "number" && p.heading < 360 ? p.heading : undefined;
  const navStatus = p.navStatus;

  const port = findPortByPosition(lat, lon);
  if (!port) {
    // Position is outside any subscribed port bbox. If it falls inside a
    // tracked chokepoint, persist a throttled copy so the chokepoint
    // detector (5-min cadence on the positions table) can reconstruct
    // the transit. Skip all the port-specific bookkeeping (zones,
    // anchor transitions, voyages, KPIs).
    const cp = findChokepoint(lat, lon);
    if (!cp) return;
    if (!shouldWriteChokepointPosition(mmsi, ts)) return;
    try {
      db().insertPosition.run(
        mmsi,
        ts,
        lat,
        lon,
        sog,
        cog,
        null,
        null,
        "transit",
        p.source ?? null,
      );
    } catch (err) {
      console.error("[db] chokepoint persistPosition failed", err);
    }
    return;
  }

  if (p.source) {
    const existing = getVessel(port.id, mmsi);
    if (existing && existing.lastUpdate >= ts - SECONDARY_FRESHNESS_MS) return;
  }

  const stat = getStatic(mmsi) ?? {};
  const vesselClass = classifyShip(stat.shipType);
  const zone = findZone(port, lat, lon);
  const state = inferState(sog, navStatus, zone);

  const vessel: Vessel = {
    mmsi,
    name: stat.name ?? p.shipName,
    callsign: stat.callsign,
    shipType: stat.shipType,
    vesselClass,
    cargoClass: stat.cargoClass,
    latitude: lat,
    longitude: lon,
    sog,
    cog,
    heading,
    navStatus,
    destination: stat.destination,
    draught: stat.draught,
    lengthM: stat.lengthM,
    state,
    zone: zone?.id,
    lastUpdate: ts,
  };

  const prevZone = getPreviousZone(port.id, mmsi);
  trackZoneTransition(port.id, mmsi, prevZone, zone?.id, ts);
  setPreviousZone(port.id, mmsi, zone?.id);
  trackAnchorTransition(port.id, mmsi, state, ts);

  upsertVessel(port.id, vessel);

  if (shouldPersistPosition(port.id, mmsi, ts)) {
    try {
      persistPosition(vessel, p.source);
    } catch (err) {
      console.error("[db] persistPosition failed", err);
    }
  }

  try {
    observeVoyage({
      portId: port.id,
      mmsi,
      cargoClass: stat.cargoClass,
      vessel,
    });
  } catch (err) {
    console.error("[voyage] observe failed", err);
  }
}

// Watchdog: AISStream sends 50-300 msg/s on a global subscription, so
// crossing this many seconds with zero traffic means the connection has
// silently gone zombie (cf. the 2026-05-21 outage: WebSocket "open" but
// 0 msg for 26h, no close event ever fired). Force-close past the threshold
// and let the reconnect loop start fresh.
const STALE_RECONNECT_MS = 90_000;

export function startAisWorker(apiKey: string) {
  if (meta.isStarted()) return;
  meta.markStarted();
  startKpiSampler();
  let reconnectMs = MIN_RECONNECT_MS;

  const connect = () => {
    const ws = new WebSocket(STREAM_URL);
    let watchdog: NodeJS.Timeout | undefined;
    let closedByUs = false;
    let rateLimited = false;

    const armWatchdog = () => {
      if (watchdog) clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        const last = meta.status().lastMessageAt ?? 0;
        const ageMs = Date.now() - last;
        if (ageMs > STALE_RECONNECT_MS) {
          console.warn(
            `[ais] watchdog: ${Math.round(ageMs / 1000)}s without messages — force-closing connection`,
          );
          closedByUs = true;
          ws.terminate();
        } else {
          armWatchdog();
        }
      }, STALE_RECONNECT_MS).unref();
    };

    ws.on("open", () => {
      meta.recordConnection();
      // NE PAS réarmer le backoff ici : une connexion « ouverte » peut
      // rester muette (panne amont). Le reset se fait à la réception de
      // vraies données, dans le handler message ci-dessous.
      const portBboxes: Array<[[number, number], [number, number]]> = PORTS.map(
        (p) => [
          [p.bbox[0], p.bbox[1]],
          [p.bbox[2], p.bbox[3]],
        ],
      );
      // Chokepoint bboxes (Hormuz, Malacca, Suez, Singapore, etc.) re-enabled
      // after the UKSL parser fix removed the 1.4 GB heap blowup. The actual
      // crash root cause was UKSL (transient allocation), not message rate;
      // the per-MMSI throttle in handleMessage protects against any residual
      // pressure from high-traffic chokepoints.
      const chokepointBboxes = getChokepointSubscriptionBboxes();
      const sub = {
        APIKey: apiKey,
        BoundingBoxes: [...portBboxes, ...chokepointBboxes],
        FilterMessageTypes: ["PositionReport", "ShipStaticData"],
      };
      ws.send(JSON.stringify(sub));
      console.log(
        `[ais] connected, subscribed to ${portBboxes.length} ports + ${chokepointBboxes.length} chokepoints`,
      );
      armWatchdog();
    });

    ws.on("message", (data) => {
      if (handleMessage(data) && reconnectMs !== MIN_RECONNECT_MS) {
        reconnectMs = MIN_RECONNECT_MS;
      }
    });

    ws.on("error", (err) => {
      console.error("[ais] error", err.message);
      // « Unexpected server response: 429 » à l'upgrade WebSocket.
      if (err.message.includes("429")) rateLimited = true;
    });

    ws.on("close", (code, reason) => {
      if (watchdog) clearTimeout(watchdog);
      const trigger = closedByUs ? "watchdog" : "upstream";
      if (rateLimited) reconnectMs = Math.max(reconnectMs, RATE_LIMIT_FLOOR_MS);
      console.warn(
        `[ais] closed code=${code} reason=${reason?.toString() || "n/a"} trigger=${trigger}; reconnecting in ${reconnectMs}ms`,
      );
      setTimeout(connect, reconnectMs);
      reconnectMs = Math.min(reconnectMs * 2, MAX_RECONNECT_MS);
    });
  };

  connect();
  startFeedAlerts();
}

// ---------------------------------------------------------------------------
// Alerte « flux muet » — le propriétaire doit savoir AVANT les visiteurs.
// Push via ntfy.sh (topic dans NTFY_TOPIC ; non configuré = no-op).
// Anti-spam : 1 alerte/heure max, + notification de rétablissement.

const ALERT_MUTE_MS = 15 * 60_000;
const ALERT_RESEND_MS = 60 * 60_000;

let _alertsStarted = false;

function startFeedAlerts() {
  if (_alertsStarted) return;
  _alertsStarted = true;
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    console.log("[ais-alert] NTFY_TOPIC non défini — alertes téléphone désactivées");
    return;
  }
  const bootAt = Date.now();
  let lastAlertAt = 0;
  let alerting = false;

  const push = async (title: string, body: string, priority: string, tags: string) => {
    try {
      await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
        method: "POST",
        body,
        // En-têtes ASCII uniquement (les titres UTF-8 passent mal en header).
        headers: { Title: title, Priority: priority, Tags: tags },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      console.error("[ais-alert] envoi ntfy échoué:", (err as Error).message);
    }
  };

  setInterval(() => {
    const last = meta.status().lastMessageAt ?? bootAt;
    const ageMs = Date.now() - last;
    if (ageMs > ALERT_MUTE_MS) {
      if (Date.now() - lastAlertAt > ALERT_RESEND_MS) {
        lastAlertAt = Date.now();
        alerting = true;
        const min = Math.round(ageMs / 60_000);
        console.warn(`[ais-alert] flux muet depuis ${min} min — push ntfy`);
        void push(
          "Port Flow: AIS feed DOWN",
          `Aucun message AIS depuis ${min} min. Verifier aisstream.io et les logs pm2.`,
          "high",
          "warning,anchor",
        );
      }
    } else if (alerting && ageMs < 2 * 60_000) {
      alerting = false;
      lastAlertAt = 0;
      void push(
        "Port Flow: AIS feed OK",
        "Le flux AIS est retabli, les positions arrivent de nouveau.",
        "default",
        "white_check_mark",
      );
    }
  }, 60_000).unref();
}
