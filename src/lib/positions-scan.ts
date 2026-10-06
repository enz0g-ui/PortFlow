import { db } from "./db";

/**
 * Lecture NON BLOQUANTE d'une fenêtre de la table `positions`.
 *
 * Pourquoi : les détecteurs lisaient leur fenêtre (8 à 24 h, jusqu'à ~2 M de
 * lignes) en une seule requête synchrone `ORDER BY mmsi, ts`. SQLite doit
 * alors trier toute la fenêtre avant de rendre la première ligne, et
 * node:sqlite est synchrone : le serveur entier (HTTP, flux AIS) gelait
 * 20 à 45 s à chaque passage — mesuré en prod (oct. 2026), 104 gels sur 147
 * venaient du seul détecteur de dark events, toutes les heures.
 *
 * Ici : tranches de temps successives lues via l'index `ts` (pas de tri à
 * faire, l'index est déjà ordonné), avec retour à la boucle d'événements
 * entre deux tranches. Les lignes sortent par `ts` croissant, PAS groupées
 * par navire : l'appelant tient un état par MMSI.
 *
 * Une position arrivée en retard dans une tranche déjà lue est ignorée par
 * ce passage et vue au suivant — les détecteurs relisent une fenêtre
 * glissante, c'est sans effet sur le résultat.
 */
export async function* scanPositionsByTime<T>(opts: {
  columns: string;
  since: number;
  until?: number;
  sliceMs?: number;
}): AsyncGenerator<T[]> {
  const until = opts.until ?? Date.now();
  const sliceMs = opts.sliceMs ?? 10 * 60_000;
  const stmt = db().raw.prepare(
    `SELECT ${opts.columns} FROM positions INDEXED BY idx_positions_ts
     WHERE ts >= ? AND ts < ?
     ORDER BY ts`,
  );
  for (let a = opts.since; a < until; a += sliceMs) {
    const b = Math.min(a + sliceMs, until);
    const rows = stmt.all(a, b) as unknown as T[];
    if (rows.length > 0) yield rows;
    await yieldToEventLoop();
  }
}

export function yieldToEventLoop(): Promise<void> {
  return new Promise<void>((resolve) => setImmediate(resolve));
}
