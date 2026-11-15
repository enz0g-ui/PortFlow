-- Historique d'identité AIS : chaque changement de nom, d'indicatif ou
-- d'IMO diffusé par un transpondeur est conservé (signal de changement
-- d'identité, fréquent dans les flottes qui contournent les sanctions).
-- Alimenté par un déclencheur : le chemin d'ingestion AIS ne change pas.
CREATE TABLE IF NOT EXISTS static_identity_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mmsi INTEGER NOT NULL,
  changed_at INTEGER NOT NULL,          -- ms epoch (updated_at de la ligne)
  old_name TEXT,
  new_name TEXT,
  old_callsign TEXT,
  new_callsign TEXT,
  old_imo INTEGER,
  new_imo INTEGER
);
CREATE INDEX IF NOT EXISTS idx_identity_history_mmsi ON static_identity_history(mmsi, changed_at);

CREATE TRIGGER IF NOT EXISTS trg_static_identity_change
AFTER UPDATE OF name, callsign, imo ON static_ships
WHEN (OLD.name IS NOT NULL AND NEW.name IS NOT NULL AND TRIM(UPPER(OLD.name)) <> TRIM(UPPER(NEW.name)))
  OR (OLD.callsign IS NOT NULL AND NEW.callsign IS NOT NULL AND TRIM(UPPER(OLD.callsign)) <> TRIM(UPPER(NEW.callsign)))
  OR (OLD.imo IS NOT NULL AND NEW.imo IS NOT NULL AND OLD.imo <> NEW.imo)
BEGIN
  INSERT INTO static_identity_history
    (mmsi, changed_at, old_name, new_name, old_callsign, new_callsign, old_imo, new_imo)
  VALUES
    (NEW.mmsi, NEW.updated_at, OLD.name, NEW.name, OLD.callsign, NEW.callsign, OLD.imo, NEW.imo);
END;
