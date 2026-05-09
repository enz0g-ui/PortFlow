import { db } from "./db";

/**
 * UK Sanctions List (UKSL) ingestor — vessel-only filter.
 *
 * Source: FCDO publication https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv
 *
 * Background: the OFSI Consolidated List was discontinued on 28 Jan 2026.
 * UKSL is now the single canonical UK source for sanctions targets,
 * including "specified ships" (mostly Russia + Iran regimes).
 *
 * License: Open Government Licence v3.0 — full commercial reuse with
 * attribution to "OFSI / HM Treasury" or "FCDO" required.
 *
 * Schema reference (XSD): SanctionsListSchema-4.33.3
 * Format guide: https://www.gov.uk/guidance/format-guide-for-the-uk-sanctions-list
 *
 * The CSV is denormalised — one row per name/alias — so a single ship may
 * appear in several rows. We dedup by Unique ID, prefer the row with the
 * most filled fields.
 */

const UKSL_CSV_URL =
  process.env.UKSL_CSV_URL ??
  "https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv";
const FETCH_TIMEOUT_MS = 60_000;

interface UkslRow {
  // Common columns we care about (column names are case-sensitive in UKSL CSV)
  "Unique ID"?: string;
  "Group Type"?: string;
  "Regime"?: string;
  "Listed On"?: string;
  "UK Statement of Reasons"?: string;
  "Statement of Reasons"?: string;
  "Name 6"?: string;
  Name?: string;
  // Ship-specific columns (per the format guide)
  "Vessel Type"?: string;
  "IMO Number"?: string;
  "Vessel Flag"?: string;
  "Vessel Owner"?: string;
  "Vessel Operator"?: string;
  "Build Year"?: string;
  "Tonnage"?: string;
  "Gross Registered Tonnage"?: string;
  // Generic — the format guide has dozens of columns; we accept whatever
  // comes through and persist the raw row to raw_json for forensic
  // debugging.
  [key: string]: string | undefined;
}

interface IngestResult {
  ok: boolean;
  totalRows: number;
  shipRows: number;
  uniqueShips: number;
  inserted: number;
  url: string;
  error?: string;
}

/**
 * Minimal RFC-4180 CSV parser sufficient for UKSL. Handles quoted fields,
 * embedded commas, escaped double-quotes ("" inside a quoted field).
 * Lazy line-by-line parsing would be ideal for a 50 MB file but UKSL is
 * <10 MB so loading it whole is fine.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch !== "\r") {
        field += ch;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function isShipRow(r: UkslRow): boolean {
  const gt = (r["Group Type"] ?? "").toLowerCase();
  return gt.includes("ship") || gt.includes("vessel");
}

function pickString(...vals: Array<string | undefined>): string | null {
  for (const v of vals) {
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function parseImo(v?: string): number | null {
  if (!v) return null;
  const digits = v.replace(/[^\d]/g, "");
  if (digits.length !== 7) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

function parseDate(v?: string): number | null {
  if (!v) return null;
  // UKSL "Listed On" is typically "DD/MM/YYYY"
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return Date.UTC(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  }
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

function parseFloatSafe(v?: string): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseIntSafe(v?: string): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export async function fetchUksl(): Promise<IngestResult> {
  const url = UKSL_CSV_URL;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return {
        ok: false,
        totalRows: 0,
        shipRows: 0,
        uniqueShips: 0,
        inserted: 0,
        url,
        error: `HTTP ${res.status}`,
      };
    }
    const text = await res.text();
    const grid = parseCsv(text);
    if (grid.length < 2) {
      return {
        ok: false,
        totalRows: 0,
        shipRows: 0,
        uniqueShips: 0,
        inserted: 0,
        url,
        error: "empty or malformed CSV",
      };
    }
    const headers = grid[0].map((h) => h.trim());
    const rows: UkslRow[] = grid.slice(1).map((arr) => {
      const obj: UkslRow = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = arr[i];
      }
      return obj;
    });

    // Filter to ship rows + dedup by Unique ID, picking the "richest" row
    // (most non-empty ship-relevant fields).
    const shipRows = rows.filter(isShipRow);
    const byId = new Map<string, UkslRow>();
    for (const r of shipRows) {
      const id = (r["Unique ID"] ?? "").trim();
      if (!id) continue;
      const existing = byId.get(id);
      if (!existing) {
        byId.set(id, r);
        continue;
      }
      // Score by non-empty count of ship-relevant fields.
      const score = (x: UkslRow) =>
        ["IMO Number", "Vessel Flag", "Vessel Owner", "Vessel Type", "Tonnage"]
          .map((k) => (x[k] && x[k]!.trim() ? 1 : 0))
          .reduce<number>((a, b) => a + b, 0);
      if (score(r) > score(existing)) byId.set(id, r);
    }

    const insert = db().raw.prepare(
      `INSERT OR REPLACE INTO sanctioned_vessels
         (source, source_id, ship_name, alt_names, imo, mmsi, flag,
          vessel_type, tonnage, built_year, owner, operator, regime,
          listed_on, reason, raw_json, ingested_at)
       VALUES ('uksl', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    let inserted = 0;
    const now = Date.now();
    db().raw.exec("BEGIN");
    try {
      for (const [id, r] of byId) {
        // Aggregate aliases by collecting all rows sharing this Unique ID.
        const allRowsForId = shipRows.filter((x) => x["Unique ID"] === id);
        const aliases = new Set<string>();
        let primaryName: string | null = null;
        for (const ar of allRowsForId) {
          const n = pickString(ar["Name 6"], ar.Name);
          if (n) {
            if (!primaryName) primaryName = n;
            aliases.add(n);
          }
        }
        if (primaryName) aliases.delete(primaryName);

        const imo = parseImo(r["IMO Number"]);
        const tonnage =
          parseFloatSafe(r["Tonnage"]) ??
          parseFloatSafe(r["Gross Registered Tonnage"]);
        insert.run(
          id,
          primaryName,
          aliases.size > 0 ? Array.from(aliases).join(" | ") : null,
          imo,
          null, // MMSI rarely in UKSL — left for future EU OJ ingest
          pickString(r["Vessel Flag"]),
          pickString(r["Vessel Type"]),
          tonnage,
          parseIntSafe(r["Build Year"]),
          pickString(r["Vessel Owner"]),
          pickString(r["Vessel Operator"]),
          pickString(r.Regime),
          parseDate(r["Listed On"]),
          pickString(r["UK Statement of Reasons"], r["Statement of Reasons"]),
          JSON.stringify(r),
          now,
        );
        inserted++;
      }
      db().raw.exec("COMMIT");
    } catch (err) {
      db().raw.exec("ROLLBACK");
      throw err;
    }

    return {
      ok: true,
      totalRows: rows.length,
      shipRows: shipRows.length,
      uniqueShips: byId.size,
      inserted,
      url,
    };
  } catch (err) {
    return {
      ok: false,
      totalRows: 0,
      shipRows: 0,
      uniqueShips: 0,
      inserted: 0,
      url,
      error: (err as Error).message,
    };
  }
}

// ─── Cross-reference helpers (called from AIS worker, voyages, dark-events) ───

export interface SanctionedVessel {
  id: number;
  source: string;
  sourceId: string;
  shipName: string | null;
  altNames: string | null;
  imo: number | null;
  mmsi: number | null;
  flag: string | null;
  regime: string | null;
  listedOn: number | null;
  reason: string | null;
}

/**
 * Returns sanctions matches for a vessel given any of its identifiers.
 * Prefers IMO match (more authoritative), falls back to MMSI. Returns
 * an empty array if no match.
 *
 * Used by the AIS worker and dark-events scanner to flag sanctioned
 * vessels in real time.
 */
export function findSanctionsForVessel(opts: {
  imo?: number | null;
  mmsi?: number | null;
}): SanctionedVessel[] {
  const where: string[] = [];
  const params: number[] = [];
  if (opts.imo) {
    where.push("imo = ?");
    params.push(opts.imo);
  }
  if (opts.mmsi) {
    where.push("mmsi = ?");
    params.push(opts.mmsi);
  }
  if (where.length === 0) return [];
  const rows = db()
    .raw.prepare(
      `SELECT id, source, source_id, ship_name, alt_names, imo, mmsi, flag,
              regime, listed_on, reason
       FROM sanctioned_vessels
       WHERE ${where.join(" OR ")}`,
    )
    .all(...params) as unknown as Array<{
    id: number;
    source: string;
    source_id: string;
    ship_name: string | null;
    alt_names: string | null;
    imo: number | null;
    mmsi: number | null;
    flag: string | null;
    regime: string | null;
    listed_on: number | null;
    reason: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    sourceId: r.source_id,
    shipName: r.ship_name,
    altNames: r.alt_names,
    imo: r.imo,
    mmsi: r.mmsi,
    flag: r.flag,
    regime: r.regime,
    listedOn: r.listed_on,
    reason: r.reason,
  }));
}

export function listSanctionedVessels(opts: {
  regime?: string;
  source?: string;
  limit?: number;
}): SanctionedVessel[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.regime) {
    where.push("regime = ?");
    params.push(opts.regime);
  }
  if (opts.source) {
    where.push("source = ?");
    params.push(opts.source);
  }
  const limit = Math.max(1, Math.min(2000, opts.limit ?? 500));
  params.push(limit);
  const rows = db()
    .raw.prepare(
      `SELECT id, source, source_id, ship_name, alt_names, imo, mmsi, flag,
              regime, listed_on, reason
       FROM sanctioned_vessels
       ${where.length > 0 ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY listed_on DESC NULLS LAST, ship_name ASC
       LIMIT ?`,
    )
    .all(...params) as unknown as Array<{
    id: number;
    source: string;
    source_id: string;
    ship_name: string | null;
    alt_names: string | null;
    imo: number | null;
    mmsi: number | null;
    flag: string | null;
    regime: string | null;
    listed_on: number | null;
    reason: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    sourceId: r.source_id,
    shipName: r.ship_name,
    altNames: r.alt_names,
    imo: r.imo,
    mmsi: r.mmsi,
    flag: r.flag,
    regime: r.regime,
    listedOn: r.listed_on,
    reason: r.reason,
  }));
}

// ─── Scheduler ───

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastResult: IngestResult | null = null;

export function startUkslScanner(): void {
  if (_intervalId) return;
  // Initial fetch deferred 90 s after boot.
  setTimeout(async () => {
    try {
      _lastResult = await fetchUksl();
      if (_lastResult.ok) {
        console.log(
          `[uksl] initial fetch: ships=${_lastResult.uniqueShips} inserted=${_lastResult.inserted}`,
        );
      } else {
        console.error(`[uksl] initial fetch failed: ${_lastResult.error}`);
      }
    } catch (err) {
      console.error("[uksl] initial fetch crashed", err);
    }
  }, 90_000);

  _intervalId = setInterval(
    async () => {
      try {
        _lastResult = await fetchUksl();
        if (_lastResult.ok) {
          console.log(
            `[uksl] tick: ships=${_lastResult.uniqueShips} inserted=${_lastResult.inserted}`,
          );
        }
      } catch (err) {
        console.error("[uksl] tick crashed", err);
      }
    },
    24 * 3_600_000,
  );
}

export function getUkslStatus() {
  return {
    started: _intervalId !== null,
    lastResult: _lastResult,
  };
}
