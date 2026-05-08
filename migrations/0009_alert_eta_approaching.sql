-- ETA-approaching alerts: fire N minutes BEFORE the predicted ETA so the
-- recipient has time to act (vs. the existing vessel.arrived alert which
-- fires once it's too late). The lead time is configurable per alert.
--
-- New event type stored in user_alerts.event: 'vessel.eta_approaching'.
-- Lead time persisted in a new column. Default 60 minutes if NULL.

ALTER TABLE user_alerts ADD COLUMN lead_time_minutes INTEGER;

-- Dedup: track which (alert, voyage) pairs have already fired so we don't
-- spam the user every time the scanner re-runs while ETA is still close.
-- voyage_id is the same id used in the voyages table (port_mmsi_startTs).
CREATE TABLE IF NOT EXISTS alert_eta_fired (
  alert_id INTEGER NOT NULL,
  voyage_id TEXT NOT NULL,
  fired_at INTEGER NOT NULL,
  PRIMARY KEY (alert_id, voyage_id)
);
CREATE INDEX IF NOT EXISTS idx_alert_eta_fired_at ON alert_eta_fired(fired_at);
