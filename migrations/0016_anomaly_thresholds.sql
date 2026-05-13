-- Dynamic anomaly thresholds.
--
-- Replaces hardcoded warn/critical dwell-time thresholds with P50 / P95
-- of the actual (port, cargo_class) distribution computed from positions
-- history. Background job recomputes every 6 h; queries fall back to
-- hardcoded defaults when the table has no row yet (cold start).
--
-- One row per (port, cargo_class). cargo_class can be NULL for "unknown"
-- cargo — those vessels share a default-class bucket.
CREATE TABLE IF NOT EXISTS anomaly_thresholds (
  port TEXT NOT NULL,
  cargo_class TEXT,            -- NULL = unknown cargo bucket
  kind TEXT NOT NULL,          -- "anchor-dwell" (only kind today; reserved for future)
  warn_h REAL NOT NULL,        -- P50 of dwell distribution
  critical_h REAL NOT NULL,    -- P95 of dwell distribution
  n_samples INTEGER NOT NULL,  -- distribution size; <20 → fallback to hardcoded
  computed_at INTEGER NOT NULL,
  PRIMARY KEY (port, cargo_class, kind)
);
CREATE INDEX IF NOT EXISTS idx_anomaly_thresholds_computed_at
  ON anomaly_thresholds(computed_at DESC);
