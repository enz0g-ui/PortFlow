import { invalidateSanctionedIndex } from "./uk-sanctions";
import {
  finishIngest,
  recordFailedFetch,
  sha256Hex,
  type SanctionedEntry,
} from "./sanctions-versions";

/**
 * EU Consolidated Financial Sanctions List ingestor — vessel-only filter.
 *
 * Source: EU Financial Sanctions File (FSF), maintained by the European
 * Commission. The XML feed requires an EU Login token — register at
 * https://webgate.ec.europa.eu/europeaid/online-services/index.cfm?ADSSChck=1
 * then set EU_FSF_XML_URL to the resulting authenticated URL in .env.local.
 *
 * If EU_FSF_XML_URL is not set the scanner is a no-op (logs once).
 *
 * License: Reuse permitted under the EC Reuse Decision 2011/833/EU
 * (CC-BY-equivalent) with attribution.
 *
 * Coverage: Russia post-2022 shadow-fleet tankers (the EU lists ~70+
 * vessels not on UKSL or US OFAC), Belarus, Syria, Myanmar.
 *
 * Schema (simplified — EU uses ENTITY/SUBJECT blocks):
 *   <export>
 *     <sanctionEntity ...>
 *       <subjectType code="V" classificationCode="VESSEL"/>
 *       <nameAlias firstName="" wholeName="SHIP NAME" .../>
 *       <identification identificationTypeCode="imo" number="9123456"/>
 *       <regulation programme="..." regulationType="..."/>
 *       <remark>...</remark>
 *
 * We filter entities whose subjectType code is "V" (vessel).
 */

const EU_XML_URL = process.env.EU_FSF_XML_URL;
const FETCH_TIMEOUT_MS = 60_000;

interface IngestResult {
  ok: boolean;
  totalEntities: number;
  vesselEntries: number;
  inserted: number;
  url: string;
  error?: string;
  versionId?: number;
  unchanged?: boolean;
  delisted?: number;
}

function pick(block: string, tag: string): string | null {
  const m = block.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
  );
  if (!m) return null;
  return m[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim() || null;
}

function pickAttr(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*"([^"]*)"`, "i");
  const m = block.match(re);
  return m ? m[1].trim() || null : null;
}

function pickAllAttr(block: string, tag: string, attr: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*"([^"]*)"`, "gi");
  const out: string[] = [];
  for (const m of block.matchAll(re)) {
    if (m[1]) out.push(m[1].trim());
  }
  return out;
}

function isVesselEntity(block: string): boolean {
  // <subjectType code="V" .../> or <subjectType .../> with vessel-ish
  // classificationCode. Both patterns appear in the EU feed.
  return /<subjectType[^>]*\b(?:code\s*=\s*"V"|classificationCode\s*=\s*"VESSEL")/i.test(
    block,
  );
}

function extractImoFromIdentification(block: string): number | null {
  // <identification ... identificationTypeCode="imo" number="9123456" />
  const re =
    /<identification\b[^>]*\bidentificationTypeCode\s*=\s*"imo"[^>]*\bnumber\s*=\s*"(\d+)"/i;
  const m = block.match(re);
  if (!m) return null;
  const digits = m[1].replace(/\D/g, "");
  if (digits.length !== 7) return null;
  return parseInt(digits, 10);
}

export async function fetchEu(): Promise<IngestResult> {
  if (!EU_XML_URL) {
    return {
      ok: false,
      totalEntities: 0,
      vesselEntries: 0,
      inserted: 0,
      url: "",
      error:
        "EU_FSF_XML_URL not set — register at EU webgate to obtain a token",
    };
  }
  const url = EU_XML_URL;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": "Octopode-PortFlow/1.0 (compliance ingest)" },
    });
    if (!res.ok) {
      try {
        recordFailedFetch({ source: "eu_consolidated", url }, `HTTP ${res.status}`);
      } catch { /* le journal ne doit jamais masquer l'erreur d'origine */ }
      return {
        ok: false,
        totalEntities: 0,
        vesselEntries: 0,
        inserted: 0,
        url,
        error: `HTTP ${res.status}`,
      };
    }
    const etag = res.headers.get("etag");
    const lastModified = res.headers.get("last-modified");
    const xml = await res.text();
    const sha256 = sha256Hex(xml);

    const entityBlocks = xml
      .split(/<\/sanctionEntity>/i)
      .map((b) => {
        const start = b.lastIndexOf("<sanctionEntity");
        return start >= 0 ? b.slice(start) : null;
      })
      .filter((b): b is string => b !== null);

    let vesselEntries = 0;
    const entries: SanctionedEntry[] = [];
    for (const block of entityBlocks) {
      if (!isVesselEntity(block)) continue;
      vesselEntries++;
      const logicalId =
        pickAttr(block, "sanctionEntity", "logicalId") ??
        pickAttr(block, "sanctionEntity", "euReferenceNumber") ??
        // fallback to a hash of the block
        `eu-${Buffer.from(block).toString("base64").slice(0, 24)}`;

      const aliases = pickAllAttr(block, "nameAlias", "wholeName");
      const primaryName = aliases[0] ?? null;
      const altNames =
        aliases.length > 1 ? aliases.slice(1).join(" | ") : null;

      entries.push({
        sourceId: logicalId,
        shipName: primaryName,
        altNames,
        imo: extractImoFromIdentification(block),
        mmsi: null,
        flag:
          pickAttr(block, "citizenship", "country") ??
          pickAttr(block, "address", "countryDescription"),
        vesselType: null,
        tonnage: null,
        builtYear: null,
        owner: null,
        operator: null,
        regime: pickAttr(block, "regulation", "programme"),
        listedOn: null,
        reason: pick(block, "remark"),
        rawJson: JSON.stringify({ block: block.slice(0, 5000) }),
      });
    }

    const fin = finishIngest({
      meta: {
        source: "eu_consolidated",
        url,
        etag,
        lastModified,
        sha256,
        byteSize: Buffer.byteLength(xml),
      },
      entries,
    });

    if (!fin.unchanged) invalidateSanctionedIndex();

    return {
      ok: true,
      totalEntities: entityBlocks.length,
      vesselEntries,
      inserted: fin.inserted,
      versionId: fin.versionId,
      unchanged: fin.unchanged,
      delisted: fin.delisted,
      url,
    };
  } catch (err) {
    try {
      recordFailedFetch({ source: "eu_consolidated", url }, (err as Error).message);
    } catch { /* idem */ }
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
let _euConfigWarned = false;

export function startEuScanner(): void {
  if (_intervalId) return;
  if (!EU_XML_URL) {
    if (!_euConfigWarned) {
      console.warn(
        "[eu] EU_FSF_XML_URL not set — register at EU webgate and add the URL to .env.local to enable EU sanctions ingest",
      );
      _euConfigWarned = true;
    }
    return;
  }
  // Defer 180 s after boot.
  setTimeout(async () => {
    try {
      _lastResult = await fetchEu();
      if (_lastResult.ok) {
        console.log(
          `[eu] initial fetch: vessels=${_lastResult.vesselEntries} inserted=${_lastResult.inserted}`,
        );
      } else {
        console.error(`[eu] initial fetch failed: ${_lastResult.error}`);
      }
    } catch (err) {
      console.error("[eu] initial fetch crashed", err);
    }
  }, 180_000);

  _intervalId = setInterval(
    async () => {
      try {
        _lastResult = await fetchEu();
        if (_lastResult.ok) {
          console.log(
            `[eu] tick: vessels=${_lastResult.vesselEntries} inserted=${_lastResult.inserted}`,
          );
        }
      } catch (err) {
        console.error("[eu] tick crashed", err);
      }
    },
    24 * 3_600_000,
  );
}

export function getEuStatus() {
  return {
    started: _intervalId !== null,
    configured: Boolean(EU_XML_URL),
    lastResult: _lastResult,
  };
}
