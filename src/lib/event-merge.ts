import { db } from "./db";
import { yieldToEventLoop } from "./positions-scan";

/**
 * Fusion des événements de mouillage (`loitering_events`) et de rencontres
 * (`encounters`) qui se CHEVAUCHENT dans le temps pour un même navire / une
 * même paire.
 *
 * Pourquoi : les détecteurs relisent une fenêtre glissante. Un événement
 * plus long que la fenêtre voit son début tronqué à chaque passage, donc un
 * `start_ts` différent → l'INSERT OR REPLACE sur (navire, start_ts) créait
 * une NOUVELLE ligne à chaque passage. Mesuré en prod (oct. 2026) : 6,0 M
 * lignes de mouillage pour 206 k événements réels, 1,48 M rencontres pour
 * 112 k. Désormais une détection qui chevauche un événement existant le
 * prolonge ; `dedupeEventTables` nettoie l'historique une fois.
 */

const round1 = (x: number) => Math.round(x * 10) / 10;

interface Span {
  id: number;
  start_ts: number;
  end_ts: number | null;
}

/** Regroupe les intervalles qui se chevauchent (lignes triées par start_ts). */
export function overlapGroups<T extends Span>(rows: T[]): T[][] {
  const groups: T[][] = [];
  let cur: T[] = [];
  let curEnd = -Infinity;
  for (const r of rows) {
    const end = r.end_ts ?? r.start_ts;
    if (cur.length > 0 && r.start_ts <= curEnd) {
      cur.push(r);
      if (end > curEnd) curEnd = end;
    } else {
      if (cur.length > 0) groups.push(cur);
      cur = [r];
      curEnd = end;
    }
  }
  if (cur.length > 0) groups.push(cur);
  return groups;
}

const earliest = <T extends Span>(g: T[]) =>
  g.reduce((a, b) => (b.start_ts < a.start_ts ? b : a));
const latest = <T extends Span>(g: T[]) =>
  g.reduce((a, b) => ((b.end_ts ?? b.start_ts) > (a.end_ts ?? a.start_ts) ? b : a));
const spanMs = (r: Span) => (r.end_ts ?? r.start_ts) - r.start_ts;

/* ---------------- mouillage ---------------- */

export interface LoiteringRecord extends Span {
  mmsi: number;
  avg_speed_kn: number | null;
  start_lat: number;
  start_lon: number;
  end_lat: number | null;
  end_lon: number | null;
  was_sanctioned: number;
  detected_at: number;
  updated_at: number;
}

const LOIT_COLS = `id, mmsi, start_ts, end_ts, avg_speed_kn, start_lat, start_lon,
  end_lat, end_lon, was_sanctioned, detected_at, updated_at`;

function mergedLoitering(g: LoiteringRecord[]) {
  const first = earliest(g);
  const last = latest(g);
  const start = first.start_ts;
  const end = last.end_ts ?? last.start_ts;
  // Vitesse moyenne pondérée par la durée de chaque détection.
  let w = 0;
  let s = 0;
  for (const r of g) {
    const wi = Math.max(spanMs(r), 1);
    w += wi;
    s += (r.avg_speed_kn ?? 0) * wi;
  }
  return {
    start,
    end,
    durationH: round1((end - start) / 3_600_000),
    avgSpeed: Math.round((s / w) * 100) / 100,
    startLat: first.start_lat,
    startLon: first.start_lon,
    endLat: last.end_lat,
    endLon: last.end_lon,
    sanctioned: g.some((r) => r.was_sanctioned === 1) ? 1 : 0,
    detectedAt: Math.min(...g.map((r) => r.detected_at)),
    updatedAt: Math.max(...g.map((r) => r.updated_at)),
  };
}

/**
 * Écrit un groupe fusionné : on garde la ligne existante la plus ancienne
 * (son id reste stable), on supprime les autres. `fresh` = la détection du
 * passage courant, pas encore en base (id < 0).
 */
function applyLoiteringGroup(g: LoiteringRecord[]): number {
  const stored = g.filter((r) => r.id > 0);
  if (stored.length === 0) return 0;
  const keep = earliest(stored);
  const m = mergedLoitering(g);
  const raw = db().raw;
  const del = raw.prepare(`DELETE FROM loitering_events WHERE id = ?`);
  let removed = 0;
  // Supprimer AVANT de mettre à jour : le nouveau start_ts peut être celui
  // d'une ligne du groupe (contrainte UNIQUE(mmsi, start_ts)).
  for (const r of stored) if (r.id !== keep.id) removed += Number(del.run(r.id).changes ?? 0);
  raw
    .prepare(
      `UPDATE loitering_events SET start_ts = ?, end_ts = ?, duration_h = ?,
         avg_speed_kn = ?, start_lat = ?, start_lon = ?, end_lat = ?, end_lon = ?,
         was_sanctioned = ?, detected_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      m.start, m.end, m.durationH, m.avgSpeed, m.startLat, m.startLon,
      m.endLat, m.endLon, m.sanctioned, m.detectedAt, m.updatedAt, keep.id,
    );
  return removed;
}

/**
 * Détection du passage courant : prolonge l'événement existant qui la
 * chevauche, sinon renvoie false (l'appelant insère une nouvelle ligne).
 */
export function mergeIntoExistingLoitering(fresh: LoiteringRecord): boolean {
  const overlapping = db()
    .raw.prepare(
      `SELECT ${LOIT_COLS} FROM loitering_events
       WHERE mmsi = ? AND start_ts <= ? AND end_ts >= ?
       ORDER BY start_ts`,
    )
    .all(fresh.mmsi, fresh.end_ts ?? fresh.start_ts, fresh.start_ts) as unknown as LoiteringRecord[];
  if (overlapping.length === 0) return false;
  applyLoiteringGroup([...overlapping, fresh]);
  return true;
}

/* ---------------- rencontres ---------------- */

export interface EncounterRecord extends Span {
  mmsi_a: number;
  mmsi_b: number;
  median_distance_m: number | null;
  chokepoint_id: string | null;
  start_lat: number | null;
  start_lon: number | null;
  was_sanctioned_a: number;
  was_sanctioned_b: number;
  detected_at: number;
  updated_at: number;
}

const ENC_COLS = `id, mmsi_a, mmsi_b, start_ts, end_ts, median_distance_m,
  chokepoint_id, start_lat, start_lon, was_sanctioned_a, was_sanctioned_b,
  detected_at, updated_at`;

function applyEncounterGroup(g: EncounterRecord[]): number {
  const stored = g.filter((r) => r.id > 0);
  if (stored.length === 0) return 0;
  const keep = earliest(stored);
  const first = earliest(g);
  const last = latest(g);
  const longest = g.reduce((a, b) => (spanMs(b) > spanMs(a) ? b : a));
  const start = first.start_ts;
  const end = last.end_ts ?? last.start_ts;
  const raw = db().raw;
  const del = raw.prepare(`DELETE FROM encounters WHERE id = ?`);
  let removed = 0;
  for (const r of stored) if (r.id !== keep.id) removed += Number(del.run(r.id).changes ?? 0);
  raw
    .prepare(
      `UPDATE encounters SET start_ts = ?, end_ts = ?, duration_h = ?,
         median_distance_m = ?, chokepoint_id = ?, start_lat = ?, start_lon = ?,
         was_sanctioned_a = ?, was_sanctioned_b = ?, detected_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      start,
      end,
      round1((end - start) / 3_600_000),
      longest.median_distance_m,
      first.chokepoint_id,
      first.start_lat,
      first.start_lon,
      g.some((r) => r.was_sanctioned_a === 1) ? 1 : 0,
      g.some((r) => r.was_sanctioned_b === 1) ? 1 : 0,
      Math.min(...g.map((r) => r.detected_at)),
      Math.max(...g.map((r) => r.updated_at)),
      keep.id,
    );
  return removed;
}

export function mergeIntoExistingEncounter(fresh: EncounterRecord): boolean {
  const overlapping = db()
    .raw.prepare(
      `SELECT ${ENC_COLS} FROM encounters
       WHERE mmsi_a = ? AND mmsi_b = ? AND start_ts <= ? AND end_ts >= ?
       ORDER BY start_ts`,
    )
    .all(
      fresh.mmsi_a,
      fresh.mmsi_b,
      fresh.end_ts ?? fresh.start_ts,
      fresh.start_ts,
    ) as unknown as EncounterRecord[];
  if (overlapping.length === 0) return false;
  applyEncounterGroup([...overlapping, fresh]);
  return true;
}

/* ---------------- nettoyage unique de l'historique ---------------- */

const JOB_NAME = "dedupe-events-2026-10";
const ROWS_PER_BATCH = 5_000;

/**
 * Parcourt chaque table par plages de navires (~5 000 lignes par lot) :
 * lecture + fusion + écriture d'un lot sont SYNCHRONES (aucun détecteur ne
 * peut s'intercaler au milieu d'un navire), puis on rend la main à la
 * boucle d'événements. Même principe que la purge des positions.
 */
async function dedupeTable<T extends Span>(opts: {
  table: string;
  keyCol: string;
  cols: string;
  sameKey: (a: T, b: T) => boolean;
  apply: (g: T[]) => number;
}): Promise<{ removed: number; batches: number }> {
  const raw = db().raw;
  const bound = raw.prepare(
    `SELECT ${opts.keyCol} AS k FROM ${opts.table}
     WHERE ${opts.keyCol} > ? ORDER BY ${opts.keyCol} LIMIT 1 OFFSET ?`,
  );
  const read = raw.prepare(
    `SELECT ${opts.cols} FROM ${opts.table}
     WHERE ${opts.keyCol} > ? AND ${opts.keyCol} <= ?
     ORDER BY ${opts.keyCol}, ${opts.keyCol === "mmsi_a" ? "mmsi_b, " : ""}start_ts`,
  );
  let lo = -1;
  let removed = 0;
  let batches = 0;
  for (;;) {
    const b = bound.get(lo, ROWS_PER_BATCH) as { k: number } | undefined;
    const hi = b ? b.k : Number.MAX_SAFE_INTEGER;
    for (let w = 0; raw.isTransaction && w < 600; w++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
    raw.exec("BEGIN");
    try {
      const rows = read.all(lo, hi) as unknown as T[];
      let i = 0;
      while (i < rows.length) {
        let j = i + 1;
        while (j < rows.length && opts.sameKey(rows[i], rows[j])) j++;
        for (const g of overlapGroups(rows.slice(i, j))) {
          if (g.length > 1) removed += opts.apply(g);
        }
        i = j;
      }
      raw.exec("COMMIT");
    } catch (err) {
      raw.exec("ROLLBACK");
      throw err;
    }
    batches++;
    if (!b) break;
    lo = hi;
    await yieldToEventLoop();
  }
  return { removed, batches };
}

export async function dedupeEventTables(): Promise<void> {
  const raw = db().raw;
  const done = raw
    .prepare(`SELECT done_at FROM maintenance_jobs WHERE name = ?`)
    .get(JOB_NAME);
  if (done) return;
  const t0 = Date.now();
  const loit = await dedupeTable<LoiteringRecord>({
    table: "loitering_events",
    keyCol: "mmsi",
    cols: LOIT_COLS,
    sameKey: (a, b) => a.mmsi === b.mmsi,
    apply: applyLoiteringGroup,
  });
  console.log(
    `[event-merge] loitering_events: removed=${loit.removed} batches=${loit.batches} in ${Date.now() - t0}ms`,
  );
  const t1 = Date.now();
  const enc = await dedupeTable<EncounterRecord>({
    table: "encounters",
    keyCol: "mmsi_a",
    cols: ENC_COLS,
    sameKey: (a, b) => a.mmsi_a === b.mmsi_a && a.mmsi_b === b.mmsi_b,
    apply: applyEncounterGroup,
  });
  console.log(
    `[event-merge] encounters: removed=${enc.removed} batches=${enc.batches} in ${Date.now() - t1}ms`,
  );
  raw
    .prepare(`INSERT OR REPLACE INTO maintenance_jobs (name, done_at, detail) VALUES (?, ?, ?)`)
    .run(JOB_NAME, Date.now(), JSON.stringify({ loitering: loit.removed, encounters: enc.removed }));
}

/** Nettoyage unique, 15 min après le démarrage (cache disque chaud, purge passée). */
export function scheduleEventDedupe(): void {
  setTimeout(() => {
    dedupeEventTables().catch((err) =>
      console.error("[event-merge] dedupe failed", err),
    );
  }, 15 * 60_000);
}
