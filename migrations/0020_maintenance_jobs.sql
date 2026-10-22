-- Tâches de maintenance ponctuelles (exécutées une seule fois par base) :
-- la ligne marque la tâche comme faite, avec un résumé JSON.
CREATE TABLE IF NOT EXISTS maintenance_jobs (
  name TEXT PRIMARY KEY,
  done_at INTEGER NOT NULL,
  detail TEXT
);
