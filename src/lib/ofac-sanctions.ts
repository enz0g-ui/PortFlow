import { db } from "./db";
import { invalidateSanctionedIndex } from "./uk-sanctions";

/**
 * OFAC SDN ingestor — vessel-only filter.
 *
 * Source: US Treasury Office of Foreign Assets Control (OFAC) Specially
 * Designated Nationals (SDN) List.
 *
 * URL: https://www.treasury.gov/ofac/downloads/sdn.csv
 * Spec: https://www.treasury.gov/ofac/downloads/data_spec.txt
 *
 * License: US Government work, public domain (17 USC §105).
 * Free reuse and redistribution permitted.
 *
 * The SDN CSV is a fixed-column format (no header row). For vessels we
 * filter by SDN_Type = "vessel" and extract IMO numbers from the Remarks
 * field via regex (the basic SDN feed has IMOs only as free text — the
 * structured `sdn_advanced.xml` is ~150 MB and overkill for our needs).
 *
 * Coverage: Iran, Russia, Venezuela, Cuba, North Korea shadow-fleet
 * tankers — the largest source of sanctioned-vessel data globally.
 */

const OFAC_CSV_URL =
  process.env.OFAC_SDN_CSV_URL ??
  "https://www.treasury.gov/ofac/downloads/sdn.csv";
const FETCH_TIMEOUT_MS = 60_000;

interface IngestResult {
  ok: boolean;
  totalRows: number;
  vesselRows: number;
  inserted: number;
  url: string;
  error?: string;
}

// Per data_spec.txt, the columns of sdn.csv (no header in the file):
const COLS = [
  "ent_num",
  "sdn_name",
  "sdn_type",
  "program",
  "title",
  "call_sign",
  "vess_type",
  "tonnage",
  "grt",
  "vess_flag",
  "vess_owner",
  "remarks",
] as const;
type Col = (typeof COLS)[number];
type OfacRow = Partial<Record<Col, string>>;

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

function clean(v?: string): string | null {
  if (!v) return null;
  // OFAC uses "-0-" for empty fields.
  const t = v.trim();
  if (!t || t === "-0-") return null;
  return t;
}

function parseFloatSafe(v?: string | null): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Extracts the first 7-digit IMO number from a Remarks string. OFAC
 * remarks typically contain things like "Vessel Registration Identification
 * IMO 9123456;" or just "IMO 9123456".
 */
function extractImo(remarks: string | null): number | null {
  if (!remarks) return null;
  const m = remarks.match(/\bIMO\b[^\d]{0,15}(\d{7})\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Extracts the first 9-digit MMSI from a Remarks string. Less common
 * than IMO but occasionally present.
 */
function extractMmsi(remarks: string | null): number | null {
  if (!remarks) return null;
  const m = remarks.match(/\bMMSI\b[^\d]{0,10}(\d{9})\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

export async function fetchOfac(): Promise<IngestResult> {
  const url = OFAC_CSV_URL;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": "Octopode-PortFlow/1.0 (compliance ingest)" },
    });
    if (!res.ok) {
      return {
        ok: false,
        totalRows: 0,
        vesselRows: 0,
        inserted: 0,
        url,
        error: `HTTP ${res.status}`,
      };
    }
    const text = await res.text();
    const grid = parseCsv(text);
    if (grid.length < 1) {
      return {
        ok: false,
        totalRows: 0,
        vesselRows: 0,
        inserted: 0,
        url,
        error: "empty CSV",
      };
    }
    const rows: OfacRow[] = grid.map((arr) => {
      const obj: OfacRow = {};
      for (let i = 0; i < COLS.length && i < arr.length; i++) {
        obj[COLS[i]] = arr[i];
      }
      return obj;
    });

    const vessels = rows.filter(
      (r) => (r.sdn_type ?? "").trim().toLowerCase() === "vessel",
    );

    const insert = db().raw.prepare(
      `INSERT OR REPLACE INTO sanctioned_vessels
         (source, source_id, ship_name, alt_names, imo, mmsi, flag,
          vessel_type, tonnage, built_year, owner, operator, regime,
          listed_on, reason, raw_json, ingested_at)
       VALUES ('ofac', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    let inserted = 0;
    const now = Date.now();
    db().raw.exec("BEGIN");
    try {
      for (const r of vessels) {
        const id = clean(r.ent_num);
        if (!id) continue;
        const remarks = clean(r.remarks);
        const imo = extractImo(remarks);
        const mmsi = extractMmsi(remarks);
        const tonnage = parseFloatSafe(r.tonnage) ?? parseFloatSafe(r.grt);
        insert.run(
          id,
          clean(r.sdn_name),
          null,                       // alt_names — fed via alt.csv (future)
          imo,
          mmsi,
          clean(r.vess_flag),
          clean(r.vess_type),
          tonnage,
          null,                       // built_year not in basic SDN feed
          clean(r.vess_owner),
          null,                       // operator not in basic SDN feed
          clean(r.program),           // e.g. "IRAN" "RUSSIA-EO14024" "VENEZUELA"
          null,                       // listed_on not in basic SDN feed
          remarks,
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

    invalidateSanctionedIndex();

    return {
      ok: true,
      totalRows: rows.length,
      vesselRows: vessels.length,
      inserted,
      url,
    };
  } catch (err) {
    return {
      ok: false,
      totalRows: 0,
      vesselRows: 0,
      inserted: 0,
      url,
      error: (err as Error).message,
    };
  }
}

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastResult: IngestResult | null = null;

export function startOfacScanner(): void {
  if (_intervalId) return;
  // Initial fetch deferred 2 min after boot (after UKSL which is at 90 s).
  setTimeout(async () => {
    try {
      _lastResult = await fetchOfac();
      if (_lastResult.ok) {
        console.log(
          `[ofac] initial fetch: vessels=${_lastResult.vesselRows} inserted=${_lastResult.inserted}`,
        );
      } else {
        console.error(`[ofac] initial fetch failed: ${_lastResult.error}`);
      }
    } catch (err) {
      console.error("[ofac] initial fetch crashed", err);
    }
  }, 120_000);

  _intervalId = setInterval(
    async () => {
      try {
        _lastResult = await fetchOfac();
        if (_lastResult.ok) {
          console.log(
            `[ofac] tick: vessels=${_lastResult.vesselRows} inserted=${_lastResult.inserted}`,
          );
        }
      } catch (err) {
        console.error("[ofac] tick crashed", err);
      }
    },
    24 * 3_600_000,
  );
}

export function getOfacStatus() {
  return {
    started: _intervalId !== null,
    lastResult: _lastResult,
  };
}
