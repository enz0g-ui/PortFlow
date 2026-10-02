-- Index de recherche du détecteur de chokepoints (02/10/2026).
-- findOpen interroge `WHERE mmsi = ? AND chokepoint_id = ? ... ORDER BY entered_at DESC`
-- ~3 000 fois par passage (toutes les 5 min). Sans statistiques, SQLite
-- choisissait idx_cpt_chokepoint (chokepoint_id seul, ~23 000 lignes par
-- chokepoint à parcourir par appel) pour éviter le tri : mesuré en prod
-- à ~40 ms par appel, soit 15 à 30 s de gel du serveur toutes les 5 min.
-- Cet index couvre l'égalité sur les deux colonnes ET l'ordre : quelques lignes.
CREATE INDEX IF NOT EXISTS idx_cpt_mmsi_cp_entered
  ON chokepoint_transits(mmsi, chokepoint_id, entered_at DESC);
