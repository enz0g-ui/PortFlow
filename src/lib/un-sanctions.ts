import { db } from "./db";
import { invalidateSanctionedIndex } from "./uk-sanctions";

/**
 * UN Security Council Consolidated Sanctions List ingestor — vessel filter.
 *
 * Source: https://scsanctions.un.org/resources/xml/en/consolidated.xml
 * License: UN public information, free reuse permitted with attribution.
 *
 * Coverage: DPRK shadow-fleet tankers, Libya, Iran (sanctioned 2006-2015),
 * Somalia, ISIL/Al-Qaida finance ships. Smaller list than OFAC/UKSL but
 * has unique entries (especially DPRK).
 *
 * Schema (simplified — UN uses INDIVIDUAL and ENTITY blocks):
 *   <CONSOLIDATED_LIST>
 *     <ENTITIES>
 *       <ENTITY>
 *         <DATAID>...</DATAID>
 *         <FIRST_NAME>SHIP NAME</FIRST_NAME>
 *         <UN_LIST_TYPE>DPRK</UN_LIST_TYPE>
 *         <LISTED_ON>...</LISTED_ON>
 *         <COMMENTS1>... IMO Number: 9123456 ...</COMMENTS1>
 *         ...
 *
 * Vessel detection: ENTITY blocks whose COMMENTS1 mentions "vessel" /
 * "tanker" / "IMO" — UN doesn't explicitly mark a ship type. We filter
 * generously and persist anything with an extractable IMO.
 */

const UN_XML_URL =
  process.env.UN_SC_XML_URL ??
  "https://scsanctions.un.org/resources/xml/en/consolidated.xml";
const FETCH_TIMEOUT_MS = 60_000;

interface IngestResult {
  ok: boolean;
  totalEntities: number;
  vesselEntries: number;
  inserted: number;
  url: string;
  error?: string;
}

/**
 * Lightweight tag-content extractor (regex). Returns the inner text of
 * the FIRST matching tag, decoded for the common XML entities. Sufficient
 * for the UN feed which doesn't nest tag names.
 */
function pick(block: string, tag: string): string | null {
  const m = block.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
  );
  if (!m) return null;
  const decoded = m[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
  return decoded || null;
}

function extractImo(text: string | null): number | null {
  if (!text) return null;
  const m = text.match(/\bIMO\b[^\d]{0,15}(\d{7})\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function parseDate(v: string | null): number | null {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

export async function fetchUnSc(): Promise<IngestResult> {
  const url = UN_XML_URL;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": "Octopode-PortFlow/1.0 (compliance ingest)" },
    });
    if (!res.ok) {
      return {
        ok: false,
        totalEntities: 0,
        vesselEntries: 0,
        inserted: 0,
        url,
        error: `HTTP ${res.status}`,
      };
    }
    const xml = await res.text();

    // Split on </ENTITY> — every block before is one ENTITY record.
    // Vessels can also appear in the INDIVIDUALS section occasionally
    // (rare), but the bulk are in ENTITIES.
    // Bug fix (May 2026): the previous `lastIndexOf("<ENTITY")` matched
    // sub-elements like `<ENTITY_ALIAS>` and `<ENTITY_ADDRESS>` inside the
    // ENTITY block, slicing from the wrong position and dropping the
    // COMMENTS1 field that holds the IMO. Use the exact opening tag
    // `<ENTITY>` (no attributes per the actual XSD) to anchor.
    const entityBlocks = xml
      .split(/<\/ENTITY>/i)
      .map((b) => {
        const start = b.lastIndexOf("<ENTITY>");
        return start >= 0 ? b.slice(start) : null;
      })
      .filter((b): b is string => b !== null);

    let vesselEntries = 0;
    let inserted = 0;
    const now = Date.now();

    const insert = db().raw.prepare(
      `INSERT OR REPLACE INTO sanctioned_vessels
         (source, source_id, ship_name, alt_names, imo, mmsi, flag,
          vessel_type, tonnage, built_year, owner, operator, regime,
          listed_on, reason, raw_json, ingested_at)
       VALUES ('un_sc', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    db().raw.exec("BEGIN");
    try {
      for (const block of entityBlocks) {
        const dataid = pick(block, "DATAID");
        if (!dataid) continue;
        const comments1 = pick(block, "COMMENTS1");
        const c1Lower = (comments1 ?? "").toLowerCase();
        const looksLikeVessel =
          /\b(vessel|tanker|cargo ship|m\/?v |m\/?t |imo number)\b/.test(
            c1Lower,
          );
        const imo = extractImo(comments1);
        if (!looksLikeVessel && imo === null) continue;
        vesselEntries++;
        insert.run(
          dataid,
          pick(block, "FIRST_NAME") ?? pick(block, "NAME_ORIGINAL_SCRIPT"),
          null,
          imo,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          pick(block, "UN_LIST_TYPE"),
          parseDate(pick(block, "LISTED_ON")),
          comments1,
          JSON.stringify({ block: block.slice(0, 5000) }), // truncate for safety
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
      totalEntities: entityBlocks.length,
      vesselEntries,
      inserted,
      url,
    };
  } catch (err) {
    return {
      ok: false,
      totalEntities: 0,
      vesselEntries: 0,
      inserted: 0,
      url,
      error: (err as Error).message,
    };
  }
}

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastResult: IngestResult | null = null;

export function startUnScScanner(): void {
  if (_intervalId) return;
  // Defer 150 s after boot (after UKSL at 90 s, OFAC at 120 s).
  setTimeout(async () => {
    try {
      _lastResult = await fetchUnSc();
      if (_lastResult.ok) {
        console.log(
          `[un-sc] initial fetch: vessels=${_lastResult.vesselEntries} inserted=${_lastResult.inserted}`,
        );
      } else {
        console.error(`[un-sc] initial fetch failed: ${_lastResult.error}`);
      }
    } catch (err) {
      console.error("[un-sc] initial fetch crashed", err);
    }
  }, 150_000);

  _intervalId = setInterval(
    async () => {
      try {
        _lastResult = await fetchUnSc();
        if (_lastResult.ok) {
          console.log(
            `[un-sc] tick: vessels=${_lastResult.vesselEntries} inserted=${_lastResult.inserted}`,
          );
        }
      } catch (err) {
        console.error("[un-sc] tick crashed", err);
      }
    },
    24 * 3_600_000,
  );
}

export function getUnScStatus() {
  return {
    started: _intervalId !== null,
    lastResult: _lastResult,
  };
}
