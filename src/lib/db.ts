import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { KpiSnapshot, Vessel } from "./types";

const DB_PATH =
  process.env.PORT_DB_PATH ?? resolve(process.cwd(), "data", "port.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  ts INTEGER PRIMARY KEY,
  port TEXT NOT NULL DEFAULT 'rotterdam',
  total INTEGER, anchored INTEGER, underway INTEGER, moored INTEGER,
  inbound_h INTEGER, outbound_h INTEGER, avg_speed REAL,
  by_class TEXT
);

CREATE TABLE IF NOT EXISTS static_ships (
  mmsi INTEGER PRIMARY KEY,
  name TEXT,
  callsign TEXT,
  ship_type INTEGER,
  destination TEXT,
  draught REAL,
  length_m REAL,
  cargo_class TEXT,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS positions (
  mmsi INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  lat REAL, lon REAL,
  sog REAL, cog REAL,
  nav_status INTEGER,
  zone TEXT,
  state TEXT,
  PRIMARY KEY (mmsi, ts)
);
CREATE INDEX IF NOT EXISTS idx_positions_ts ON positions(ts);

CREATE TABLE IF NOT EXISTS voyages (
  voyage_id TEXT PRIMARY KEY,
  mmsi INTEGER NOT NULL,
  port TEXT NOT NULL DEFAULT 'rotterdam',
  cargo_class TEXT,
  start_ts INTEGER NOT NULL,
  arrived_ts INTEGER,
  departed_ts INTEGER,
  start_lat REAL, start_lon REAL,
  start_distance_nm REAL,
  start_sog REAL,
  predicted_eta INTEGER,
  predicted_at INTEGER,
  broadcast_eta INTEGER,
  arrival_zone TEXT,
  draught_arrived REAL
);
CREATE INDEX IF NOT EXISTS idx_voyages_mmsi ON voyages(mmsi);
CREATE INDEX IF NOT EXISTS idx_voyages_arrived ON voyages(arrived_ts);
CREATE INDEX IF NOT EXISTS idx_voyages_open ON voyages(arrived_ts, departed_ts);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  port TEXT NOT NULL,
  event TEXT NOT NULL,
  threshold REAL,
  active INTEGER DEFAULT 1,
  last_fired_at INTEGER,
  last_fired_value REAL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  status_code INTEGER,
  ok INTEGER,
  body_preview TEXT
);
CREATE INDEX IF NOT EXISTS idx_deliveries_sub ON webhook_deliveries(subscription_id, ts DESC);

CREATE TABLE IF NOT EXISTS sar_scenes (
  scene_id TEXT PRIMARY KEY,
  port TEXT NOT NULL,
  acquired_at INTEGER NOT NULL,
  scanned_at INTEGER NOT NULL,
  bbox_s REAL, bbox_w REAL, bbox_n REAL, bbox_e REAL,
  width INTEGER,
  height INTEGER,
  detections_count INTEGER DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'sentinel1',
  status TEXT NOT NULL DEFAULT 'processed',
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_sar_scenes_port ON sar_scenes(port, acquired_at DESC);

CREATE TABLE IF NOT EXISTS sar_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id TEXT NOT NULL,
  port TEXT NOT NULL,
  ts INTEGER NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  intensity REAL,
  size_px INTEGER,
  bbox_minx INTEGER, bbox_miny INTEGER, bbox_maxx INTEGER, bbox_maxy INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sar_det_scene ON sar_detections(scene_id);
CREATE INDEX IF NOT EXISTS idx_sar_det_port_ts ON sar_detections(port, ts DESC);

CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner TEXT NOT NULL DEFAULT 'default',
  mmsi INTEGER,
  imo INTEGER,
  label TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_watchlist_owner ON watchlist(owner);
CREATE INDEX IF NOT EXISTS idx_watchlist_mmsi ON watchlist(mmsi);
CREATE INDEX IF NOT EXISTS idx_watchlist_imo ON watchlist(imo);
`;

interface DbHandle {
  raw: DatabaseSync;
  insertKpi: ReturnType<DatabaseSync["prepare"]>;
  upsertStatic: ReturnType<DatabaseSync["prepare"]>;
  insertPosition: ReturnType<DatabaseSync["prepare"]>;
  selectStaticAll: ReturnType<DatabaseSync["prepare"]>;
  selectKpisSince: ReturnType<DatabaseSync["prepare"]>;
  insertVoyage: ReturnType<DatabaseSync["prepare"]>;
  updateVoyageArrived: ReturnType<DatabaseSync["prepare"]>;
  updateVoyageDeparted: ReturnType<DatabaseSync["prepare"]>;
  updateVoyagePrediction: ReturnType<DatabaseSync["prepare"]>;
  selectOpenVoyage: ReturnType<DatabaseSync["prepare"]>;
  selectClosedVoyages: ReturnType<DatabaseSync["prepare"]>;
}

const KEY = "__rotterdamPortDb" as const;
type WithDb = typeof globalThis & { [KEY]?: DbHandle };

function open(): DbHandle {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const raw = new DatabaseSync(DB_PATH);
  raw.exec(SCHEMA);

  return {
    raw,
    insertKpi: raw.prepare(
      `INSERT OR REPLACE INTO kpi_snapshots
       (ts, port, total, anchored, underway, moored, inbound_h, outbound_h, avg_speed, by_class)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ),
    upsertStatic: raw.prepare(
      `INSERT INTO static_ships
       (mmsi, name, callsign, ship_type, destination, draught, length_m, cargo_class, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(mmsi) DO UPDATE SET
         name = COALESCE(excluded.name, static_ships.name),
         callsign = COALESCE(excluded.callsign, static_ships.callsign),
         ship_type = COALESCE(excluded.ship_type, static_ships.ship_type),
         destination = COALESCE(excluded.destination, static_ships.destination),
         draught = COALESCE(excluded.draught, static_ships.draught),
         length_m = COALESCE(excluded.length_m, static_ships.length_m),
         cargo_class = COALESCE(excluded.cargo_class, static_ships.cargo_class),
         updated_at = excluded.updated_at`,
    ),
    insertPosition: raw.prepare(
      `INSERT OR IGNORE INTO positions
       (mmsi, ts, lat, lon, sog, cog, nav_status, zone, state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ),
    selectStaticAll: raw.prepare(`SELECT * FROM static_ships`),
    selectKpisSince: raw.prepare(
      `SELECT * FROM kpi_snapshots WHERE ts >= ? AND port = ? ORDER BY ts ASC`,
    ),
    insertVoyage: raw.prepare(
      `INSERT OR IGNORE INTO voyages
       (voyage_id, mmsi, port, cargo_class, start_ts, start_lat, start_lon, start_distance_nm, start_sog, broadcast_eta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ),
    updateVoyageArrived: raw.prepare(
      `UPDATE voyages SET arrived_ts = ?, arrival_zone = ?, draught_arrived = ?
       WHERE voyage_id = ? AND arrived_ts IS NULL`,
    ),
    updateVoyageDeparted: raw.prepare(
      `UPDATE voyages SET departed_ts = ? WHERE voyage_id = ? AND departed_ts IS NULL`,
    ),
    updateVoyagePrediction: raw.prepare(
      `UPDATE voyages SET predicted_eta = ?, predicted_at = ?
       WHERE voyage_id = ? AND (predicted_eta IS NULL OR predicted_at < ?)`,
    ),
    selectOpenVoyage: raw.prepare(
      `SELECT * FROM voyages WHERE mmsi = ? AND port = ? AND arrived_ts IS NULL ORDER BY start_ts DESC LIMIT 1`,
    ),
    selectClosedVoyages: raw.prepare(
      `SELECT * FROM voyages WHERE port = ? AND arrived_ts IS NOT NULL AND arrived_ts >= ? ORDER BY arrived_ts DESC LIMIT ?`,
    ),
  };
}

export function db(): DbHandle {
  const g = globalThis as WithDb;
  if (!g[KEY]) g[KEY] = open();
  return g[KEY]!;
}

export interface StaticRow {
  mmsi: number;
  name?: string;
  callsign?: string;
  ship_type?: number;
  destination?: string;
  draught?: number;
  length_m?: number;
  cargo_class?: string;
  updated_at?: number;
}

export interface VoyageRow {
  voyage_id: string;
  mmsi: number;
  port: string;
  cargo_class?: string;
  start_ts: number;
  arrived_ts?: number;
  departed_ts?: number;
  start_lat?: number;
  start_lon?: number;
  start_distance_nm?: number;
  start_sog?: number;
  predicted_eta?: number;
  predicted_at?: number;
  broadcast_eta?: number;
  arrival_zone?: string;
  draught_arrived?: number;
}

export function persistKpi(s: KpiSnapshot, port: string) {
  db().insertKpi.run(
    s.ts,
    port,
    s.totalVessels,
    s.anchored,
    s.underway,
    s.moored,
    s.inboundLastHour,
    s.outboundLastHour,
    s.avgSpeedChannel,
    JSON.stringify(s.byClass),
  );
}

export function persistStatic(row: StaticRow) {
  db().upsertStatic.run(
    row.mmsi,
    row.name ?? null,
    row.callsign ?? null,
    row.ship_type ?? null,
    row.destination ?? null,
    row.draught ?? null,
    row.length_m ?? null,
    row.cargo_class ?? null,
    row.updated_at ?? Date.now(),
  );
}

export function persistPosition(v: Vessel) {
  db().insertPosition.run(
    v.mmsi,
    v.lastUpdate,
    v.latitude,
    v.longitude,
    v.sog,
    v.cog,
    v.navStatus ?? null,
    v.zone ?? null,
    v.state,
  );
}

export function loadAllStatic(): StaticRow[] {
  return db().selectStaticAll.all() as unknown as StaticRow[];
}

export function loadKpisSince(
  portId: string,
  sinceMs: number,
): KpiSnapshot[] {
  const rows = db().selectKpisSince.all(sinceMs, portId) as unknown as Array<{
    ts: number;
    total: number;
    anchored: number;
    underway: number;
    moored: number;
    inbound_h: number;
    outbound_h: number;
    avg_speed: number;
    by_class: string;
  }>;
  return rows.map((r) => ({
    ts: r.ts,
    totalVessels: r.total,
    anchored: r.anchored,
    underway: r.underway,
    moored: r.moored,
    inboundLastHour: r.inbound_h,
    outboundLastHour: r.outbound_h,
    avgSpeedChannel: r.avg_speed,
    byClass: JSON.parse(r.by_class),
  }));
}

export function openVoyage(input: {
  mmsi: number;
  port: string;
  cargoClass?: string;
  startTs: number;
  lat: number;
  lon: number;
  distanceNm: number;
  sog: number;
  broadcastEta?: number;
}): string {
  const id = `${input.port}_${input.mmsi}_${input.startTs}`;
  db().insertVoyage.run(
    id,
    input.mmsi,
    input.port,
    input.cargoClass ?? null,
    input.startTs,
    input.lat,
    input.lon,
    input.distanceNm,
    input.sog,
    input.broadcastEta ?? null,
  );
  return id;
}

export function markVoyageArrived(
  voyageId: string,
  arrivedTs: number,
  zone: string | undefined,
  draught: number | undefined,
) {
  db().updateVoyageArrived.run(arrivedTs, zone ?? null, draught ?? null, voyageId);
}

export function markVoyageDeparted(voyageId: string, departedTs: number) {
  db().updateVoyageDeparted.run(departedTs, voyageId);
}

export function setVoyagePrediction(
  voyageId: string,
  predictedEta: number,
  predictedAt: number,
) {
  db().updateVoyagePrediction.run(
    predictedEta,
    predictedAt,
    voyageId,
    predictedAt,
  );
}

export function findOpenVoyage(
  portId: string,
  mmsi: number,
): VoyageRow | undefined {
  return db().selectOpenVoyage.get(mmsi, portId) as unknown as
    | VoyageRow
    | undefined;
}

export function recentClosedVoyages(
  portId: string,
  sinceMs: number,
  limit = 500,
): VoyageRow[] {
  return db().selectClosedVoyages.all(
    portId,
    sinceMs,
    limit,
  ) as unknown as VoyageRow[];
}

export function vesselLifecycle(mmsi: number, sinceMs: number): VoyageRow[] {
  return db()
    .raw.prepare(
      `SELECT * FROM voyages WHERE mmsi = ? AND start_ts >= ? ORDER BY start_ts ASC`,
    )
    .all(mmsi, sinceMs) as unknown as VoyageRow[];
}
