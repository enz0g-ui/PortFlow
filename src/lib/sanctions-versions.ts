import { createHash } from "node:crypto";
import { db } from "./db";

/**
 * Versionnement des listes de sanctions (prérequis « dossier navire »).
 *
 * Chaque récupération d'une liste (UKSL / OFAC / UN / EU) est journalisée
 * dans `sanctions_list_versions` avec l'empreinte SHA-256 du fichier source
 * brut, les en-têtes HTTP de version (ETag / Last-Modified) et le compte
 * d'entrées — c'est ce qui permet à un dossier d'attester « liste X,
 * version du JJ/MM, empreinte Y ».
 *
 * L'ingestion passe par un diff, plus jamais par un INSERT OR REPLACE
 * aveugle : `first_seen_at` est préservé, une entrée disparue de la liste
 * est marquée `delisted_at` (et réactivée si elle revient). Les lecteurs
 * « statut courant » filtrent `delisted_at IS NULL` ; le dossier lit tout.
 */

// NB : la valeur EU réellement écrite en base est "eu_consolidated"
// (cf. eu-sanctions.ts), pas le "eu_fsf" du commentaire de la migration 0012.
export type SanctionsSource = "uksl" | "ofac" | "un_sc" | "eu_consolidated";

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Hasheur incrémental pour les sources streamées (UKSL ~50 Mo). */
export function createStreamHasher() {
  const hash = createHash("sha256");
  let bytes = 0;
  return {
    update(chunk: Uint8Array) {
      hash.update(chunk);
      bytes += chunk.byteLength;
    },
    digestHex(): string {
      return hash.digest("hex");
    },
    get bytes() {
      return bytes;
    },
  };
}

export interface ListFetchMeta {
  source: SanctionsSource;
  url: string;
  etag?: string | null;
  lastModified?: string | null;
  sha256?: string | null;
  byteSize?: number | null;
}

export function lastGoodVersion(
  source: SanctionsSource,
): { id: number; sha256: string | null } | null {
  const row = db()
    .raw.prepare(
      `SELECT id, sha256 FROM sanctions_list_versions
       WHERE source = ? AND ok = 1
       ORDER BY fetched_at DESC, id DESC LIMIT 1`,
    )
    .get(source) as { id: number; sha256: string | null } | undefined;
  return row ?? null;
}

function insertVersionRow(opts: {
  meta: ListFetchMeta;
  rowCount: number | null;
  ok: boolean;
  unchanged: boolean;
  error: string | null;
  now: number;
}): number {
  const r = db()
    .raw.prepare(
      `INSERT INTO sanctions_list_versions
         (source, url, fetched_at, http_etag, http_last_modified, sha256,
          byte_size, row_count, ok, unchanged, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      opts.meta.source,
      opts.meta.url,
      opts.now,
      opts.meta.etag ?? null,
      opts.meta.lastModified ?? null,
      opts.meta.sha256 ?? null,
      opts.meta.byteSize ?? null,
      opts.rowCount,
      opts.ok ? 1 : 0,
      opts.unchanged ? 1 : 0,
      opts.error,
    );
  return Number(r.lastInsertRowid);
}

/** Journalise une récupération en échec (HTTP non-200, parse KO, réseau…). */
export function recordFailedFetch(meta: ListFetchMeta, error: string): number {
  return insertVersionRow({
    meta,
    rowCount: null,
    ok: false,
    unchanged: false,
    error,
    now: Date.now(),
  });
}

export interface SanctionedEntry {
  sourceId: string;
  shipName: string | null;
  altNames: string | null;
  imo: number | null;
  mmsi: number | null;
  flag: string | null;
  vesselType: string | null;
  tonnage: number | null;
  builtYear: number | null;
  owner: string | null;
  operator: string | null;
  regime: string | null;
  listedOn: number | null;
  reason: string | null;
  rawJson: string | null;
}

export interface FinishResult {
  versionId: number;
  inserted: number;
  delisted: number;
  unchanged: boolean;
  /** Vrai si le délistage a été sauté par le garde-fou anti-rétrécissement. */
  delistSkipped: boolean;
}

// Si la liste rétrécit de plus de moitié d'un coup (source tronquée, format
// cassé mais parsable…), on n'ose PAS délister en masse : on garde l'état,
// on le note dans le journal de versions, un humain tranchera.
const DELIST_SHRINK_GUARD = 0.5;
const DELIST_GUARD_MIN_ACTIVE = 20;

/**
 * Clôt une ingestion réussie : journalise la version, applique le diff
 * (upsert préservant first_seen_at, réactivation des revenus, délistage des
 * disparus). Si le sha256 est identique à la dernière version ok, ne réécrit
 * rien (version journalisée `unchanged`).
 */
export function finishIngest(opts: {
  meta: ListFetchMeta;
  entries: SanctionedEntry[];
}): FinishResult {
  const { meta, entries } = opts;
  const now = Date.now();
  const raw = db().raw;

  const last = lastGoodVersion(meta.source);
  if (meta.sha256 && last?.sha256 && last.sha256 === meta.sha256) {
    const versionId = insertVersionRow({
      meta,
      rowCount: entries.length,
      ok: true,
      unchanged: true,
      error: null,
      now,
    });
    return { versionId, inserted: 0, delisted: 0, unchanged: true, delistSkipped: false };
  }

  const activeBefore = (
    raw
      .prepare(
        `SELECT COUNT(*) AS n FROM sanctioned_vessels WHERE source = ? AND delisted_at IS NULL`,
      )
      .get(meta.source) as { n: number }
  ).n;
  const delistSkipped =
    activeBefore > DELIST_GUARD_MIN_ACTIVE &&
    entries.length < activeBefore * DELIST_SHRINK_GUARD;

  const versionId = insertVersionRow({
    meta,
    rowCount: entries.length,
    ok: true,
    unchanged: false,
    error: delistSkipped
      ? `delist skipped: list shrank ${activeBefore} -> ${entries.length} (guard)`
      : null,
    now,
  });

  const upsert = raw.prepare(
    `INSERT INTO sanctioned_vessels
       (source, source_id, ship_name, alt_names, imo, mmsi, flag,
        vessel_type, tonnage, built_year, owner, operator, regime,
        listed_on, reason, raw_json, ingested_at,
        version_id, first_seen_at, delisted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(source, source_id) DO UPDATE SET
       ship_name = excluded.ship_name,
       alt_names = excluded.alt_names,
       imo = excluded.imo,
       mmsi = excluded.mmsi,
       flag = excluded.flag,
       vessel_type = excluded.vessel_type,
       tonnage = excluded.tonnage,
       built_year = excluded.built_year,
       owner = excluded.owner,
       operator = excluded.operator,
       regime = excluded.regime,
       listed_on = excluded.listed_on,
       reason = excluded.reason,
       raw_json = excluded.raw_json,
       ingested_at = excluded.ingested_at,
       version_id = excluded.version_id,
       delisted_at = NULL`,
    // first_seen_at volontairement ABSENT du DO UPDATE : préservé.
  );

  let inserted = 0;
  let delisted = 0;
  raw.exec("BEGIN");
  try {
    for (const e of entries) {
      upsert.run(
        meta.source,
        e.sourceId,
        e.shipName,
        e.altNames,
        e.imo,
        e.mmsi,
        e.flag,
        e.vesselType,
        e.tonnage,
        e.builtYear,
        e.owner,
        e.operator,
        e.regime,
        e.listedOn,
        e.reason,
        e.rawJson,
        now,
        versionId,
        now, // first_seen_at (chemin insert uniquement)
      );
      inserted++;
    }

    if (!delistSkipped) {
      raw.exec(`CREATE TEMP TABLE IF NOT EXISTS _sv_seen (id TEXT PRIMARY KEY)`);
      raw.exec(`DELETE FROM _sv_seen`);
      const seen = raw.prepare(`INSERT OR IGNORE INTO _sv_seen (id) VALUES (?)`);
      for (const e of entries) seen.run(e.sourceId);
      const r = raw
        .prepare(
          `UPDATE sanctioned_vessels SET delisted_at = ?
           WHERE source = ? AND delisted_at IS NULL
             AND source_id NOT IN (SELECT id FROM _sv_seen)`,
        )
        .run(now, meta.source);
      delisted = Number(r.changes ?? 0);
      raw.exec(`DELETE FROM _sv_seen`);
    }

    raw.exec("COMMIT");
  } catch (err) {
    raw.exec("ROLLBACK");
    throw err;
  }

  return { versionId, inserted, delisted, unchanged: false, delistSkipped };
}
