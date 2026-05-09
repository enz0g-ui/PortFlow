-- IMF PortWatch ingestion — port activity + chokepoint transit feeds.
-- Hub ArcGIS, weekly Tuesday 09:00 ET refresh, CC-BY-style commercial reuse.
-- Source: https://portwatch.imf.org
--
-- We store the full attribute payload as JSON (raw_attrs) so the schema can
-- evolve upstream without requiring migrations. Indexed columns are the
-- query keys we actually filter on (port id, date).

CREATE TABLE IF NOT EXISTS portwatch_port_activity (
  port_id TEXT NOT NULL,                 -- e.g. 'port56120' or 'rotterdam_nl'
  port_name TEXT,
  country TEXT,
  date_utc INTEGER NOT NULL,             -- midnight UTC of the day, ms epoch
  total_calls INTEGER,
  container_calls INTEGER,
  tanker_calls INTEGER,
  dry_bulk_calls INTEGER,
  general_cargo_calls INTEGER,
  ro_ro_calls INTEGER,
  raw_attrs TEXT,                        -- full ArcGIS feature attributes JSON
  ingested_at INTEGER NOT NULL,
  PRIMARY KEY (port_id, date_utc)
);
CREATE INDEX IF NOT EXISTS idx_pw_port_date ON portwatch_port_activity(date_utc DESC);
CREATE INDEX IF NOT EXISTS idx_pw_port_id ON portwatch_port_activity(port_id);

CREATE TABLE IF NOT EXISTS portwatch_chokepoint_transit (
  chokepoint_id TEXT NOT NULL,           -- 'chokepoint1' .. 'chokepoint28' per IMF naming
  chokepoint_name TEXT,
  date_utc INTEGER NOT NULL,
  total_transits INTEGER,
  tanker_transits INTEGER,
  container_transits INTEGER,
  dry_bulk_transits INTEGER,
  general_cargo_transits INTEGER,
  trade_volume_tons REAL,
  raw_attrs TEXT,
  ingested_at INTEGER NOT NULL,
  PRIMARY KEY (chokepoint_id, date_utc)
);
CREATE INDEX IF NOT EXISTS idx_pw_choke_date ON portwatch_chokepoint_transit(date_utc DESC);
CREATE INDEX IF NOT EXISTS idx_pw_choke_id ON portwatch_chokepoint_transit(chokepoint_id);
