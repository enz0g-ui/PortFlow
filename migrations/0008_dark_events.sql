-- Dark fleet detection: AIS-off gap events.
-- Algorithm derived from Welch et al. 2022 (Science Advances, DOI:10.1126/sciadv.abq2109)
-- and the Global Fishing Watch published gap criteria.
--
-- v1 criteria applied (simplified — see /methodology page):
--   * gap >= 12 hours between two consecutive positions for the same MMSI
--   * vessel was 'underway' at gap_start (excludes berth/anchorage standstill)
--   * vessel had >= 14 positions in the 12 h before the gap (excludes feed-quality issues)
--
-- A `dark_event` row represents a single detected AIS-silence period.
-- end_ts IS NULL while the gap is still open (vessel still missing).
CREATE TABLE IF NOT EXISTS dark_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mmsi INTEGER NOT NULL,
  start_ts INTEGER NOT NULL,         -- last position before the silence (UTC ms)
  end_ts INTEGER,                    -- first position after; NULL while gap is open
  duration_hours REAL,               -- (end_ts - start_ts) / 3.6e6, NULL while open
  start_lat REAL NOT NULL,
  start_lon REAL NOT NULL,
  end_lat REAL,
  end_lon REAL,
  n_prior_positions INTEGER NOT NULL,
  start_state TEXT,                  -- vessel state at gap_start ('underway' for valid dark events)
  start_zone TEXT,                   -- zone name at gap_start (anchorage/channel/berth/null)
  start_port TEXT,                   -- nearest port id at gap_start (best-effort)
  detected_at INTEGER NOT NULL,      -- when the detector first saw this event
  UNIQUE(mmsi, start_ts)
);

CREATE INDEX IF NOT EXISTS idx_dark_events_mmsi ON dark_events(mmsi);
CREATE INDEX IF NOT EXISTS idx_dark_events_start_ts ON dark_events(start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_dark_events_open ON dark_events(end_ts) WHERE end_ts IS NULL;
CREATE INDEX IF NOT EXISTS idx_dark_events_port ON dark_events(start_port, start_ts DESC);
