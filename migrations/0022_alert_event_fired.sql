-- Déduplication des alertes « contact en mer » / « coupure AIS » : une
-- alerte ne part qu'une fois par événement détecté (ref = encounter / dark).
CREATE TABLE IF NOT EXISTS alert_event_fired (
  alert_id INTEGER NOT NULL,
  ref TEXT NOT NULL,
  fired_at INTEGER NOT NULL,
  PRIMARY KEY (alert_id, ref)
);
