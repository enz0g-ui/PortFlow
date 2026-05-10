-- In-house encounter + loitering detection — replaces the (commercial-
-- restricted) Global Fishing Watch events for our purpose. Computed from
-- our own positions table.
--
-- Encounters (ship-to-ship): two vessels within 500m for >2 hours.
-- Strongest sanctions-evasion signal in maritime trade (Iranian/Russian
-- shadow fleet pattern). v1 restricts detection to chokepoint zones
-- where the signal-to-noise ratio is highest and the computational cost
-- bounded (~50-200 vessels per zone vs thousands worldwide).
--
-- Convention: mmsi_a < mmsi_b to avoid (a,b) and (b,a) duplicates.
CREATE TABLE IF NOT EXISTS encounters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mmsi_a INTEGER NOT NULL,
  mmsi_b INTEGER NOT NULL,
  start_ts INTEGER NOT NULL,        -- ms epoch of first close fix
  end_ts INTEGER,                   -- NULL while ongoing
  duration_h REAL,
  median_distance_m INTEGER,
  chokepoint_id TEXT,               -- which zone (suez/hormuz/etc) or NULL
  start_lat REAL, start_lon REAL,
  was_sanctioned_a INTEGER NOT NULL DEFAULT 0,
  was_sanctioned_b INTEGER NOT NULL DEFAULT 0,
  detected_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(mmsi_a, mmsi_b, start_ts)
);
CREATE INDEX IF NOT EXISTS idx_enc_mmsi_a ON encounters(mmsi_a, start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_enc_mmsi_b ON encounters(mmsi_b, start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_enc_chokepoint ON encounters(chokepoint_id, start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_enc_sanctioned ON encounters(was_sanctioned_a, was_sanctioned_b, start_ts DESC) WHERE was_sanctioned_a = 1 OR was_sanctioned_b = 1;

-- Loitering: vessel with SOG <2kn for >2h, far from any port.
-- Lighter than dark-events (which detects total AIS silence); loitering
-- is "AIS still on but vessel barely moving in open water" — typical
-- staging behaviour before a ship-to-ship transfer or unauthorized
-- bunkering.
CREATE TABLE IF NOT EXISTS loitering_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mmsi INTEGER NOT NULL,
  start_ts INTEGER NOT NULL,
  end_ts INTEGER,
  duration_h REAL,
  avg_speed_kn REAL,
  start_lat REAL, start_lon REAL,
  end_lat REAL, end_lon REAL,
  was_sanctioned INTEGER NOT NULL DEFAULT 0,
  detected_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(mmsi, start_ts)
);
CREATE INDEX IF NOT EXISTS idx_loit_mmsi ON loitering_events(mmsi, start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_loit_start ON loitering_events(start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_loit_sanctioned ON loitering_events(was_sanctioned, start_ts DESC) WHERE was_sanctioned = 1;
