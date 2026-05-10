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
 * RFC-4180 CSV parser as a streaming generator. Yields one row at a time,
 * memory stays at O(row size) regardless of file size. Used for UKSL,
 * which has grown to ~50MB / 57k rows in 2026 and was previously
 * blowing up the heap to 1.4GB when loaded eagerly.
 *
 * Caller feeds chunks of text via the controller pattern: build a
 * buffer, then call `parseCsvLine(line)` for each complete line.
 */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
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
        out.push(field);
        field = "";
      } else if (ch !== "\r") {
        field += ch;
      }
    }
  }
  out.push(field);
  return out;
}

/**
 * Stream the body of `response` line by line as Uint8Array → string.
 * Yields complete CSV lines (handles multiline fields by tracking quote
 * state across reads). Memory: ~bufferSize + currentLine.
 */
async function* streamCsvLines(
  response: Response,
): AsyncGenerator<string, void, unknown> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let inQuotes = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let lineStart = 0;
    for (let i = 0; i < buffer.length; i++) {
      const ch = buffer[i];
      if (ch === '"') {
        // Track if we're inside a quoted field that might span newlines.
        // RFC-4180: doubled quotes inside quoted fields are escapes.
        if (inQuotes && buffer[i + 1] === '"') {
          i++; // skip the escape pair
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "\n" && !inQuotes) {
        yield buffer.slice(lineStart, i);
        lineStart = i + 1;
      }
    }
    buffer = buffer.slice(lineStart);
  }
  buffer += decoder.decode();
  if (buffer.length > 0) yield buffer;
}

/**
 * UKSL ship detection. As of May 2026 the CSV no longer has a "Group Type"
 * column; instead ships are detectable by the presence of ship-specific
 * fields (IMO number, Type of ship, Tonnage of ship) being non-empty.
 *
 * We accept any row that has either a 7-digit IMO or a non-empty
 * "Type of ship".
 */
function isShipRow(r: UkslRow): boolean {
  const imo = (r["IMO number"] ?? r["IMO Number"] ?? "").replace(/\D/g, "");
  if (imo.length === 7) return true;
  const type = (r["Type of ship"] ?? r["Vessel Type"] ?? "").trim();
  if (type) return true;
  // Legacy detection (older UKSL format) — still works if "Group Type"
  // ever returns.
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

    // Stream the body line by line. Memory stays bounded — never load the
    // 50 MB file into a single string. Pre-2026 fix: eager parseCsv would
    // allocate ~1.4 GB of intermediate string arrays, OOM-killing the
    // process via PM2 max_memory_restart.
    let headers: string[] | null = null;
    let totalRows = 0;
    let shipRows = 0;
    const byId = new Map<string, UkslRow>();
    const aliasesById = new Map<string, Set<string>>();

    const score = (x: UkslRow) =>
      ["IMO number", "IMO Number", "Type of ship", "Tonnage of ship", "Current believed flag of ship"]
        .map((k) => (x[k] && x[k]!.trim() ? 1 : 0))
        .reduce<number>((a, b) => a + b, 0);

    let lineIdx = 0;
    for await (const line of streamCsvLines(res)) {
      lineIdx++;
      if (!line || line.trim() === "") continue;

      // Skip the metadata first line, e.g. "Report Date: 05-May-2026"
      // (the May 2026 UKSL CSV format added a preamble line).
      if (lineIdx === 1 && /^Report Date:/i.test(line)) {
        continue;
      }

      const fields = parseCsvLine(line);
      if (!headers) {
        headers = fields.map((h) => h.trim());
        continue;
      }

      // Build the row object only for the columns we actually care about.
      // Avoids allocating a full 70-key object × 57 k rows.
      const row: UkslRow = {};
      for (let i = 0; i < headers.length; i++) {
        const h = headers[i];
        if (
          h === "Unique ID" ||
          h === "OFSI Group ID" ||
          h === "Name 6" ||
          h === "Name 1" ||
          h === "Name" ||
          h === "Regime Name" ||
          h === "Regime" ||
          h === "Listed On" ||
          h === "Last Updated" ||
          h === "UK Statement of Reasons" ||
          h === "Statement of Reasons" ||
          h === "Other Information" ||
          h === "IMO number" ||
          h === "IMO Number" ||
          h === "Type of ship" ||
          h === "Tonnage of ship" ||
          h === "Length of ship" ||
          h === "Year built" ||
          h === "Build Year" ||
          h === "Current believed flag of ship" ||
          h === "Vessel Flag" ||
          h === "Vessel Type" ||
          h === "Vessel Owner" ||
          h === "Vessel Operator" ||
          h === "Group Type"
        ) {
          row[h] = fields[i];
        }
      }
      totalRows++;

      if (!isShipRow(row)) continue;
      shipRows++;

      const id = (row["Unique ID"] ?? row["OFSI Group ID"] ?? "").trim();
      if (!id) continue;

      // Track aliases (names) — small Set per id, bounded by <10 names.
      const name = pickString(row["Name 6"], row["Name 1"], row["Name"]);
      if (name) {
        if (!aliasesById.has(id)) aliasesById.set(id, new Set());
        aliasesById.get(id)!.add(name);
      }

      // Keep the richest row per id. ~1-2k ships max.
      const existing = byId.get(id);
      if (!existing || score(row) > score(existing)) {
        byId.set(id, row);
      }
    }

    if (!headers) {
      return {
        ok: false,
        totalRows: 0,
        shipRows: 0,
        uniqueShips: 0,
        inserted: 0,
        url,
        error: "no header row found",
      };
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
        const aliases = aliasesById.get(id) ?? new Set<string>();
        const primaryName = pickString(r["Name 6"], r["Name 1"], r["Name"]);
        if (primaryName) aliases.delete(primaryName);

        const imo = parseImo(r["IMO number"] ?? r["IMO Number"]);
        const tonnage =
          parseFloatSafe(r["Tonnage of ship"]) ??
          parseFloatSafe(r["Tonnage"]) ??
          parseFloatSafe(r["Gross Registered Tonnage"]);
        insert.run(
          id,
          primaryName,
          aliases.size > 0 ? Array.from(aliases).join(" | ") : null,
          imo,
          null, // MMSI rarely in UKSL
          pickString(r["Current believed flag of ship"], r["Vessel Flag"]),
          pickString(r["Type of ship"], r["Vessel Type"]),
          tonnage,
          parseIntSafe(r["Year built"] ?? r["Build Year"]),
          pickString(r["Vessel Owner"]),
          pickString(r["Vessel Operator"]),
          pickString(r["Regime Name"], r["Regime"]),
          parseDate(r["Listed On"] ?? r["Last Updated"]),
          pickString(r["UK Statement of Reasons"], r["Statement of Reasons"], r["Other Information"]),
          // Don't dump the full row to raw_json — it can be very large
          // since UKSL has ~70 columns. Keep a compact projection.
          JSON.stringify({
            id,
            name: primaryName,
            imo,
            type: r["Type of ship"],
            flag: r["Current believed flag of ship"],
            regime: r["Regime Name"],
          }),
          now,
        );
        inserted++;
      }
      db().raw.exec("COMMIT");
    } catch (err) {
      db().raw.exec("ROLLBACK");
      throw err;
    }

    invalidateSanctionedIndex();

    return {
      ok: true,
      totalRows,
      shipRows,
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

// ─── In-memory sanctioned index (refreshed every 5 min) ───
// Used by the hot path (vessel API responses, AIS worker per-position
// updates) to flag sanctioned vessels in O(1) without hitting SQLite for
// every check.
let _sanctionedCache: {
  ts: number;
  mmsis: Set<number>;
  imos: Set<number>;
} | null = null;
const SANCTIONED_CACHE_TTL_MS = 5 * 60_000;

function loadSanctionedIndex(): { mmsis: Set<number>; imos: Set<number> } {
  const now = Date.now();
  if (
    _sanctionedCache &&
    now - _sanctionedCache.ts < SANCTIONED_CACHE_TTL_MS
  ) {
    return { mmsis: _sanctionedCache.mmsis, imos: _sanctionedCache.imos };
  }
  const rows = db()
    .raw.prepare(
      `SELECT imo, mmsi FROM sanctioned_vessels
       WHERE imo IS NOT NULL OR mmsi IS NOT NULL`,
    )
    .all() as Array<{ imo: number | null; mmsi: number | null }>;
  const mmsis = new Set<number>();
  const imos = new Set<number>();
  for (const r of rows) {
    if (r.imo) imos.add(r.imo);
    if (r.mmsi) mmsis.add(r.mmsi);
  }
  _sanctionedCache = { ts: now, mmsis, imos };
  return { mmsis, imos };
}

/**
 * O(1) check whether a vessel is in any sanctions list, given any of its
 * identifiers. Cheaper than findSanctionsForVessel — returns just a
 * boolean. Use this on the hot path (vessel listing API). Use
 * findSanctionsForVessel when you need the full match details.
 */
export function isVesselSanctioned(opts: {
  imo?: number | null;
  mmsi?: number | null;
}): boolean {
  const idx = loadSanctionedIndex();
  if (opts.imo && idx.imos.has(opts.imo)) return true;
  if (opts.mmsi && idx.mmsis.has(opts.mmsi)) return true;
  return false;
}

/** Forces a reload of the in-memory index — call after a UKSL fetch. */
export function invalidateSanctionedIndex(): void {
  _sanctionedCache = null;
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
