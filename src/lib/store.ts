import type { CargoClass, FlowEvent, KpiSnapshot, Vessel } from "./types";
import { PORTS } from "./ports";

const STALE_MS = 30 * 60 * 1000;
const KPI_RETENTION_MIN = 7 * 24 * 60;
const FLOW_RETENTION_MS = 24 * 60 * 60 * 1000;

export interface StaticInfo {
  name?: string;
  callsign?: string;
  shipType?: number;
  destination?: string;
  draught?: number;
  lengthM?: number;
  cargoClass?: CargoClass;
}

interface PortState {
  vessels: Map<number, Vessel>;
  lastZone: Map<number, string | undefined>;
  lastState: Map<number, string>;
  anchorStarts: Map<number, number>;
  positionWriteAt: Map<number, number>;
  kpiHistory: KpiSnapshot[];
  flowEvents: FlowEvent[];
  startupGraceUntil: number;
}

interface SharedState {
  staticCache: Map<number, StaticInfo>;
  ports: Map<string, PortState>;
  workerStarted: boolean;
  startedAt: number;
  lastConnectionAt?: number;
  lastMessageAt?: number;
  messageCount: number;
}

const KEY = "__rotterdamPortStore" as const;
type GlobalWithStore = typeof globalThis & { [KEY]?: SharedState };

function newPortState(): PortState {
  return {
    vessels: new Map(),
    lastZone: new Map(),
    lastState: new Map(),
    anchorStarts: new Map(),
    positionWriteAt: new Map(),
    kpiHistory: [],
    flowEvents: [],
    startupGraceUntil: Date.now() + 60_000,
  };
}

function getState(): SharedState {
  const g = globalThis as GlobalWithStore;
  if (!g[KEY]) {
    const ports = new Map<string, PortState>();
    for (const p of PORTS) ports.set(p.id, newPortState());
    g[KEY] = {
      staticCache: new Map(),
      ports,
      workerStarted: false,
      startedAt: Date.now(),
      messageCount: 0,
    };
  }
  return g[KEY]!;
}

function ps(portId: string): PortState {
  const st = getState();
  let p = st.ports.get(portId);
  if (!p) {
    p = newPortState();
    st.ports.set(portId, p);
  }
  return p;
}

export const meta = {
  isStarted: () => getState().workerStarted,
  markStarted: () => {
    getState().workerStarted = true;
  },
  recordConnection: () => {
    getState().lastConnectionAt = Date.now();
  },
  recordMessage: () => {
    const s = getState();
    s.lastMessageAt = Date.now();
    s.messageCount++;
  },
  status: () => {
    const s = getState();
    let total = 0;
    for (const p of s.ports.values()) total += p.vessels.size;
    return {
      started: s.workerStarted,
      lastConnectionAt: s.lastConnectionAt,
      lastMessageAt: s.lastMessageAt,
      vesselCount: total,
      messageCount: s.messageCount,
    };
  },
  perPortStatus: () => {
    const s = getState();
    const out: Record<string, { vesselCount: number }> = {};
    for (const [id, p] of s.ports.entries()) {
      out[id] = { vesselCount: p.vessels.size };
    }
    return out;
  },
};

export function upsertVessel(portId: string, v: Vessel) {
  ps(portId).vessels.set(v.mmsi, v);
}

export function getVessels(portId: string): Vessel[] {
  const cutoff = Date.now() - STALE_MS;
  return [...ps(portId).vessels.values()].filter(
    (v) => v.lastUpdate >= cutoff,
  );
}

export function getPreviousZone(
  portId: string,
  mmsi: number,
): string | undefined {
  return ps(portId).lastZone.get(mmsi);
}

export function setPreviousZone(
  portId: string,
  mmsi: number,
  zoneId: string | undefined,
) {
  ps(portId).lastZone.set(mmsi, zoneId);
}

export function pushKpi(portId: string, s: KpiSnapshot) {
  const st = ps(portId);
  st.kpiHistory.push(s);
  if (st.kpiHistory.length > KPI_RETENTION_MIN) st.kpiHistory.shift();
}

export function getKpiHistory(
  portId: string,
  sinceMs?: number,
): KpiSnapshot[] {
  const hist = ps(portId).kpiHistory;
  if (!sinceMs) return [...hist];
  return hist.filter((k) => k.ts >= sinceMs);
}

export function latestKpi(portId: string): KpiSnapshot | undefined {
  const hist = ps(portId).kpiHistory;
  return hist[hist.length - 1];
}

export function recordFlow(portId: string, e: FlowEvent) {
  const st = ps(portId);
  st.flowEvents.push(e);
  const cutoff = Date.now() - FLOW_RETENTION_MS;
  while (st.flowEvents.length && st.flowEvents[0].ts < cutoff) {
    st.flowEvents.shift();
  }
}

export function getFlowEvents(portId: string, sinceMs: number): FlowEvent[] {
  return ps(portId).flowEvents.filter((e) => e.ts >= sinceMs);
}

export function inStartupGrace(portId: string, now = Date.now()): boolean {
  return now < ps(portId).startupGraceUntil;
}

export function getStatic(mmsi: number): StaticInfo | undefined {
  return getState().staticCache.get(mmsi);
}

export function setStatic(mmsi: number, info: StaticInfo) {
  const st = getState();
  const merged = { ...(st.staticCache.get(mmsi) ?? {}), ...info };
  st.staticCache.set(mmsi, merged);
}

export function bulkLoadStatic(rows: Array<{ mmsi: number } & StaticInfo>) {
  const st = getState();
  for (const row of rows) {
    const { mmsi, ...info } = row;
    st.staticCache.set(mmsi, info);
  }
}

export function bulkLoadKpis(portId: string, snapshots: KpiSnapshot[]) {
  const st = ps(portId);
  for (const s of snapshots) {
    st.kpiHistory.push(s);
  }
  while (st.kpiHistory.length > KPI_RETENTION_MIN) st.kpiHistory.shift();
}

export function shouldPersistPosition(
  portId: string,
  mmsi: number,
  now: number,
): boolean {
  const st = ps(portId);
  const last = st.positionWriteAt.get(mmsi) ?? 0;
  if (now - last < 60_000) return false;
  st.positionWriteAt.set(mmsi, now);
  return true;
}

export function trackAnchorTransition(
  portId: string,
  mmsi: number,
  newState: string,
  ts: number,
) {
  const st = ps(portId);
  const prev = st.lastState.get(mmsi);
  if (newState === "anchored" && prev !== "anchored") {
    st.anchorStarts.set(mmsi, ts);
  } else if (newState !== "anchored" && st.anchorStarts.has(mmsi)) {
    st.anchorStarts.delete(mmsi);
  }
  st.lastState.set(mmsi, newState);
}

export function getAnchorStart(
  portId: string,
  mmsi: number,
): number | undefined {
  return ps(portId).anchorStarts.get(mmsi);
}

export function getAnchoredVessels(
  portId: string,
): Array<Vessel & { anchorStart: number }> {
  const cutoff = Date.now() - 30 * 60 * 1000;
  const st = ps(portId);
  const out: Array<Vessel & { anchorStart: number }> = [];
  for (const v of st.vessels.values()) {
    if (v.lastUpdate < cutoff) continue;
    if (v.state !== "anchored") continue;
    const start = st.anchorStarts.get(v.mmsi);
    if (start) out.push({ ...v, anchorStart: start });
  }
  return out;
}
