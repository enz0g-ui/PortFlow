-- Sociétés sanctionnées par l'UE (fichier consolidé FSF de la Commission).
-- Sert à signaler qu'une société liée à un navire (OFAC « Linked To »,
-- propriétaire, gérant) est aussi sous sanctions UE.
CREATE TABLE IF NOT EXISTS eu_companies (
  logical_id INTEGER PRIMARY KEY,       -- identifiant FSF de l'entité
  eu_ref TEXT,                          -- euReferenceNumber (ex. EU.1234.56)
  name TEXT NOT NULL,                   -- premier nom
  programme TEXT,                       -- UKR, IRN, PRK…
  listed_on INTEGER,                    -- ms epoch (1re publication)
  company_imo TEXT,                     -- n° IMO de société, s'il existe
  maritime INTEGER NOT NULL DEFAULT 0,  -- 1 = armateur / gestionnaire / soutage…
  file_date TEXT,                       -- generationDate du fichier source
  ingested_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eu_company_names (
  norm TEXT NOT NULL,                   -- nom normalisé (sans forme juridique)
  logical_id INTEGER NOT NULL,
  PRIMARY KEY (norm, logical_id)
);
