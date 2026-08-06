-- 0018 — Versionnement des listes de sanctions (prérequis « dossier navire »).
--
-- Un dossier probatoire doit pouvoir attester « liste UKSL récupérée le X,
-- empreinte SHA-256 Y, N entrées » — et un navire délisté ne doit plus être
-- présenté comme sanctionné. Avant cette migration : INSERT OR REPLACE
-- aveugle, un seul ingested_at écrasé à chaque refresh, aucun hash, aucun
-- historique, délistages invisibles (faux positifs permanents).
--
-- sanctions_list_versions : une ligne par tentative de récupération d'une
-- liste (réussie, inchangée ou échouée). C'est le journal de bord citable.
--
-- sanctioned_vessels gagne :
--   version_id    — dernière version de liste où l'entrée figurait
--   first_seen_at — première ingestion (préservée aux upserts suivants)
--   delisted_at   — posé quand l'entrée disparaît de la liste ; remis à
--                   NULL si elle y revient. Les lecteurs « statut courant »
--                   filtrent delisted_at IS NULL ; le dossier lit tout.

CREATE TABLE IF NOT EXISTS sanctions_list_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,              -- 'uksl' | 'ofac' | 'un_sc' | 'eu_consolidated'
  url TEXT,
  fetched_at INTEGER NOT NULL,
  http_etag TEXT,
  http_last_modified TEXT,
  sha256 TEXT,                       -- empreinte du fichier source brut
  byte_size INTEGER,
  row_count INTEGER,                 -- entrées navires retenues
  ok INTEGER NOT NULL DEFAULT 1,
  unchanged INTEGER NOT NULL DEFAULT 0, -- 1 = même sha256 → ingestion sautée
  error TEXT
);
CREATE INDEX IF NOT EXISTS idx_slv_source_fetched
  ON sanctions_list_versions(source, fetched_at DESC);

ALTER TABLE sanctioned_vessels ADD COLUMN version_id INTEGER;
ALTER TABLE sanctioned_vessels ADD COLUMN first_seen_at INTEGER;
ALTER TABLE sanctioned_vessels ADD COLUMN delisted_at INTEGER;

-- Backfill : les entrées existantes datent au mieux de leur dernier refresh.
UPDATE sanctioned_vessels SET first_seen_at = ingested_at WHERE first_seen_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sv_delisted ON sanctioned_vessels(source, delisted_at);
