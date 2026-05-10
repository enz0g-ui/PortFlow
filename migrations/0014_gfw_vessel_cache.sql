-- Cache table for Global Fishing Watch vessel-id lookups.
--
-- GFW exposes vessel events keyed by their internal vessel-id (a UUID
-- distinct from MMSI/IMO). Resolving MMSI → GFW vessel-id costs one
-- /v3/vessels/search request per fresh MMSI; we cache the mapping so
-- repeated event lookups don't hammer the API. GFW's vessel-id is
-- stable (it tracks the hull, not the call-sign), so a 90-day TTL is
-- safe.
--
-- The `last_event_fetch_at` column lets us throttle the events fetch
-- per vessel separately from the id-resolution call.
CREATE TABLE IF NOT EXISTS gfw_vessel_cache (
  mmsi INTEGER PRIMARY KEY,
  gfw_vessel_id TEXT,            -- NULL if MMSI not known to GFW
  resolved_at INTEGER NOT NULL,  -- ms epoch
  last_event_fetch_at INTEGER,   -- ms epoch, NULL until first events fetch
  raw_search_response TEXT       -- compact JSON for forensic debug
);
CREATE INDEX IF NOT EXISTS idx_gfw_resolved_at ON gfw_vessel_cache(resolved_at);
CREATE INDEX IF NOT EXISTS idx_gfw_last_event_fetch ON gfw_vessel_cache(last_event_fetch_at);
