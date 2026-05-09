-- Vessel transit events through known chokepoints (Suez, Hormuz, Bab el-Mandeb,
-- Malacca, Bosphorus, Gibraltar, Skagerrak, Dover, Panama, Cape of Good Hope,
-- Magellan, Singapore Strait). Detector matches AIS positions against the
-- bounding boxes defined in public/data/chokepoints.geojson and persists
-- one row per (vessel, chokepoint) entry. Re-entries within COOLDOWN_HOURS
-- are merged into the same row to avoid double-counting GPS jitter.
--
-- The was_sanctioned column captures the UKSL state at entry time so we
-- have a permanent forensic record even if the vessel is later delisted.
CREATE TABLE IF NOT EXISTS chokepoint_transits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mmsi INTEGER NOT NULL,
  chokepoint_id TEXT NOT NULL,
  entered_at INTEGER NOT NULL,        -- ms epoch UTC
  exited_at INTEGER,                  -- NULL while still inside
  entry_lat REAL NOT NULL,
  entry_lon REAL NOT NULL,
  exit_lat REAL,
  exit_lon REAL,
  was_sanctioned INTEGER NOT NULL DEFAULT 0,    -- 1 if UKSL match at entry
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cpt_mmsi ON chokepoint_transits(mmsi);
CREATE INDEX IF NOT EXISTS idx_cpt_chokepoint ON chokepoint_transits(chokepoint_id, entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_cpt_entered ON chokepoint_transits(entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_cpt_open ON chokepoint_transits(exited_at) WHERE exited_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cpt_sanctioned ON chokepoint_transits(was_sanctioned, entered_at DESC) WHERE was_sanctioned = 1;
