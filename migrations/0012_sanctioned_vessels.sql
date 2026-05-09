-- Sanctioned-vessel registry — multi-source aggregation for vessel-level
-- sanctions screening. Currently fed by:
--   * UK Sanctions List (UKSL) — FCDO, OGL v3 (replaced OFSI Jan 2026)
--   * (future) EU Council OJ shadow-fleet additions via OpenSanctions
--   * (future) US OFAC SDN ship records
--
-- Indexed by IMO + MMSI for cheap cross-reference at AIS-position-update
-- time (called from ais-worker → sanctioned-flag).
CREATE TABLE IF NOT EXISTS sanctioned_vessels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,                -- 'uksl' | 'eu_oj' | 'ofac' | 'opensanctions'
  source_id TEXT NOT NULL,             -- e.g. UKSL Unique ID
  ship_name TEXT,
  alt_names TEXT,                      -- pipe-separated aliases / former names
  imo INTEGER,                         -- 7-digit IMO when known
  mmsi INTEGER,                        -- 9-digit MMSI when known
  flag TEXT,                           -- vessel flag state (country)
  vessel_type TEXT,
  tonnage REAL,
  built_year INTEGER,
  owner TEXT,
  operator TEXT,
  regime TEXT,                         -- Russia | Iran | DPRK | Belarus | …
  listed_on INTEGER,                   -- ms epoch when first listed
  reason TEXT,                         -- Statement of Reasons
  raw_json TEXT,                       -- full source row for forensic debug
  ingested_at INTEGER NOT NULL,
  UNIQUE(source, source_id)
);
CREATE INDEX IF NOT EXISTS idx_sv_imo ON sanctioned_vessels(imo);
CREATE INDEX IF NOT EXISTS idx_sv_mmsi ON sanctioned_vessels(mmsi);
CREATE INDEX IF NOT EXISTS idx_sv_regime ON sanctioned_vessels(regime);
