import WebSocket from "ws";
import { classifyCargo, classifyShip, inferState } from "./rotterdam";
import { findPortByPosition, findZone, PORTS } from "./ports";
import {
  getPreviousZone,
  getStatic,
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
const MAX_RECONNECT_MS = 60_000;

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
  let year = now.getUTCFullYear();
  const candidate = Date.UTC(year, month - 1, day, hour, minute);
  if (candidate < now.getTime() - 7 * 24 * 60 * 60 * 1000) {
    return Date.UTC(year + 1, month - 1, day, hour, minute);
  }
  return candidate;
}

function handleMessage(raw: WebSocket.RawData) {
  let msg: any;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }
  meta.recordMessage();

  const mmsi = msg?.MetaData?.MMSI;
  if (typeof mmsi !== "number") return;

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
    return;
  }

  if (msg.MessageType !== "PositionReport") return;

  const pr = msg.Message?.PositionReport;
  if (!pr) return;

  const lat = msg.MetaData?.latitude ?? pr.Latitude;
  const lon = msg.MetaData?.longitude ?? pr.Longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return;

  const port = findPortByPosition(lat, lon);
  if (!port) return;

  const sogRaw = typeof pr.Sog === "number" ? pr.Sog : 0;
  const sog = sogRaw >= 0 && sogRaw < 60 ? sogRaw : 0;
  const cog = typeof pr.Cog === "number" && pr.Cog < 360 ? pr.Cog : 0;
  const heading =
    typeof pr.TrueHeading === "number" && pr.TrueHeading < 360
      ? pr.TrueHeading
      : undefined;
  const navStatus =
    typeof pr.NavigationalStatus === "number" ? pr.NavigationalStatus : undefined;

  const stat = getStatic(mmsi) ?? {};
  const vesselClass = classifyShip(stat.shipType);
  const zone = findZone(port, lat, lon);
  const state = inferState(sog, navStatus, zone);
  const ts = Date.now();

  const vessel: Vessel = {
    mmsi,
    name: stat.name ?? cleanAisString(msg.MetaData?.ShipName),
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
      persistPosition(vessel);
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

export function startAisWorker(apiKey: string) {
  if (meta.isStarted()) return;
  meta.markStarted();
  startKpiSampler();
  let reconnectMs = MIN_RECONNECT_MS;

  const connect = () => {
    const ws = new WebSocket(STREAM_URL);

    ws.on("open", () => {
      meta.recordConnection();
      reconnectMs = MIN_RECONNECT_MS;
      const sub = {
        APIKey: apiKey,
        BoundingBoxes: PORTS.map((p) => [
          [p.bbox[0], p.bbox[1]],
          [p.bbox[2], p.bbox[3]],
        ]),
        FilterMessageTypes: ["PositionReport", "ShipStaticData"],
      };
      ws.send(JSON.stringify(sub));
      console.log(
        `[ais] connected, subscribed to ${PORTS.length} bboxes (${PORTS.map((p) => p.id).join(", ")})`,
      );
    });

    ws.on("message", handleMessage);

    ws.on("error", (err) => {
      console.error("[ais] error", err.message);
    });

    ws.on("close", (code, reason) => {
      console.warn(
        `[ais] closed code=${code} reason=${reason?.toString() || "n/a"}; reconnecting in ${reconnectMs}ms`,
      );
      setTimeout(connect, reconnectMs);
      reconnectMs = Math.min(reconnectMs * 2, MAX_RECONNECT_MS);
    });
  };

  connect();
}
