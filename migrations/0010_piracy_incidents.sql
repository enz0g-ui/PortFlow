-- Piracy / armed robbery / security incidents — ingested from public sources:
-- NGA ASAM (Anti-Shipping Activity Messages, US Gov public domain) and
-- optionally IMB / UKMTO when scrapable.
--
-- Each row is one incident. We dedup on (source, source_id) and persist the
-- raw payload for forensic debugging.
CREATE TABLE IF NOT EXISTS piracy_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,                 -- 'nga_asam' | 'ukmto' | 'imb' | 'manual'
  source_id TEXT NOT NULL,              -- original publication id
  occurred_at INTEGER NOT NULL,         -- UTC epoch ms
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  navarea TEXT,                         -- ASAM NAVAREA (II/III/IV/...)
  region TEXT,                          -- coarse region tag (Red Sea, Gulf of Aden, ...)
  hostility TEXT,                       -- ASAM hostility/victim type
  victim TEXT,                          -- vessel attacked (when known)
  description TEXT,                     -- short narrative
  url TEXT,                             -- link to original advisory if any
  raw_json TEXT,                        -- full source record
  ingested_at INTEGER NOT NULL,
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_piracy_occurred ON piracy_incidents(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_piracy_source ON piracy_incidents(source, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_piracy_geo ON piracy_incidents(lat, lon);
