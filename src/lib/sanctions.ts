/**
 * Pulls public sanctions lists (US OFAC SDN, UK OFSI) and indexes the
 * vessels they reference by IMO and MMSI. Refreshed daily.
 *
 * Free + public sources:
 *   - OFAC SDN: sanctionslistservice.ofac.treas.gov (CSV; the old
 *     treasury.gov URL is a ~13s redirect chain that kept timing out)
 *   - UK OFSI: ConList.csv (OFSI dropped the JSON format — ConList.json 404s)
 *
 * Note: matching by MMSI is not 100% reliable — sanctions lists historically
 * named vessels (IMO is the canonical id), MMSI is added when known.
 * We expose both lookups.
 */

const OFAC_CSV =
  "https://sanctionslistservice.ofac.treas.gov/api/download/sdn.csv";
const UK_OFSI_CSV =
  "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv";

interface SanctionEntry {
  source: "ofac" | "ofsi";
  list: string;
  name: string;
  imo?: number;
  mmsi?: number;
  reason?: string;
  url?: string;
}

interface SanctionsCache {
  entries: SanctionEntry[];
  byImo: Map<number, SanctionEntry[]>;
  byMmsi: Map<number, SanctionEntry[]>;
  fetchedAt: number;
  errors: string[];
}

const REFRESH_MS = 24 * 60 * 60 * 1000;

const KEY = "__rotterdamSanctions" as const;
type WithCache = typeof globalThis & { [KEY]?: SanctionsCache };

function emptyCache(): SanctionsCache {
  return {
    entries: [],
    byImo: new Map(),
    byMmsi: new Map(),
    fetchedAt: 0,
    errors: [],
  };
}

function getCache(): SanctionsCache {
  const g = globalThis as WithCache;
  if (!g[KEY]) g[KEY] = emptyCache();
  return g[KEY]!;
}

// Tolerant of the varied phrasings across lists: "IMO 9524475",
// "(IMO number):9524475", "IMO: 9524475" — allow a few non-digit chars
// between the keyword and the number.
const IMO_REGEX = /\bIMO[^0-9]{0,16}(\d{7})\b/i;
const MMSI_REGEX = /\bMMSI[^0-9]{0,16}(\d{9})\b/i;

function parseIdsFromText(text: string): { imo?: number; mmsi?: number } {
  const imoMatch = text.match(IMO_REGEX);
  const mmsiMatch = text.match(MMSI_REGEX);
  return {
    imo: imoMatch ? Number(imoMatch[1]) : undefined,
    mmsi: mmsiMatch ? Number(mmsiMatch[1]) : undefined,
  };
}

async function fetchOfac(): Promise<SanctionEntry[]> {
  const r = await fetch(OFAC_CSV, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`OFAC HTTP ${r.status}`);
  const text = await r.text();

  const entries: SanctionEntry[] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    const cells = parseCsvLine(line);
    if (cells.length < 3) continue;
    const [, name, sdnType, , , , , , , , , remarks] = cells;
    if (!name) continue;
    if (sdnType && sdnType.toLowerCase() !== "vessel") {
      const blob = `${name} ${remarks ?? ""}`;
      const ids = parseIdsFromText(blob);
      if (!ids.imo && !ids.mmsi) continue;
      entries.push({
        source: "ofac",
        list: "SDN",
        name: name.trim(),
        imo: ids.imo,
        mmsi: ids.mmsi,
        reason: (remarks ?? "").slice(0, 200),
      });
      continue;
    }
    const blob = `${name} ${remarks ?? ""}`;
    const ids = parseIdsFromText(blob);
    entries.push({
      source: "ofac",
      list: "SDN",
      name: name.trim(),
      imo: ids.imo,
      mmsi: ids.mmsi,
      reason: (remarks ?? "").slice(0, 200),
    });
  }
  return entries;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        q = !q;
      }
    } else if (c === "," && !q) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Whole-text CSV parser: unlike parseCsvLine, records are split on newlines
 * OUTSIDE quotes — the OFSI CSV embeds newlines inside quoted fields
 * ("Other Information" wraps), so line-by-line parsing shreds records.
 */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (q && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        q = !q;
      }
    } else if (c === "," && !q) {
      row.push(cur);
      cur = "";
    } else if ((c === "\n" || c === "\r") && !q) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      if (row.length > 1 || row[0] !== "") records.push(row);
      row = [];
      cur = "";
    } else {
      cur += c;
    }
  }
  if (cur !== "" || row.length > 0) {
    row.push(cur);
    records.push(row);
  }
  return records;
}

// ConList.csv layout: record 0 is a "Last Updated,<date>" metadata row,
// record 1 the 36-column header. Columns we use (0-based):
// 0 = Name 6 · 27 = Other Information (carries "(IMO number):NNNNNNN")
// · 31 = Regime.
const OFSI_COL_NAME = 0;
const OFSI_COL_OTHER_INFO = 27;
const OFSI_COL_REGIME = 31;

async function fetchOfsi(): Promise<SanctionEntry[]> {
  const r = await fetch(UK_OFSI_CSV, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`OFSI HTTP ${r.status}`);
  const text = await r.text();

  const entries: SanctionEntry[] = [];
  for (const cells of parseCsvRecords(text).slice(2)) {
    if (cells.length < 32) continue;
    const name = (cells[OFSI_COL_NAME] ?? "").trim();
    if (!name) continue;
    const other = cells[OFSI_COL_OTHER_INFO] ?? "";
    const ids = parseIdsFromText(`${name} ${other}`);
    if (!ids.imo && !ids.mmsi) continue;
    entries.push({
      source: "ofsi",
      list: (cells[OFSI_COL_REGIME] ?? "").trim() || "UK",
      name,
      imo: ids.imo,
      mmsi: ids.mmsi,
      reason: other.slice(0, 200),
    });
  }
  return entries;
}

let inflight: Promise<void> | null = null;

export async function refreshSanctions(force = false): Promise<void> {
  const cache = getCache();
  if (!force && cache.fetchedAt && Date.now() - cache.fetchedAt < REFRESH_MS) {
    return;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const errors: string[] = [];
    let ofacEntries: SanctionEntry[] | null = null;
    let ofsiEntries: SanctionEntry[] | null = null;
    try {
      ofacEntries = await fetchOfac();
    } catch (err) {
      errors.push(`ofac: ${(err as Error).message}`);
    }
    try {
      ofsiEntries = await fetchOfsi();
    } catch (err) {
      errors.push(`ofsi: ${(err as Error).message}`);
    }

    // Keep-last-good: a source that failed keeps its previous entries — a
    // stale sanctions list beats an empty one (screening going blank both
    // looks broken and silently stops flagging). fetchedAt only advances
    // when at least one source succeeded, so /api/health keeps reporting
    // the true staleness of what we're serving.
    if (ofacEntries === null && ofsiEntries === null) {
      cache.errors = errors;
      return;
    }
    const all = [
      ...(ofacEntries ?? cache.entries.filter((e) => e.source === "ofac")),
      ...(ofsiEntries ?? cache.entries.filter((e) => e.source === "ofsi")),
    ];
    cache.entries = all;
    cache.byImo = new Map();
    cache.byMmsi = new Map();
    for (const e of all) {
      if (e.imo) {
        const arr = cache.byImo.get(e.imo) ?? [];
        arr.push(e);
        cache.byImo.set(e.imo, arr);
      }
      if (e.mmsi) {
        const arr = cache.byMmsi.get(e.mmsi) ?? [];
        arr.push(e);
        cache.byMmsi.set(e.mmsi, arr);
      }
    }
    cache.fetchedAt = Date.now();
    cache.errors = errors;
  })();

  try {
    await inflight;
  } finally {
    inflight = null;
  }
}

export function checkSanctions(input: {
  mmsi?: number;
  imo?: number;
}): SanctionEntry[] {
  const cache = getCache();
  const out: SanctionEntry[] = [];
  if (input.imo) out.push(...(cache.byImo.get(input.imo) ?? []));
  if (input.mmsi) out.push(...(cache.byMmsi.get(input.mmsi) ?? []));
  return out;
}

export function sanctionsStatus() {
  const cache = getCache();
  return {
    fetchedAt: cache.fetchedAt,
    count: cache.entries.length,
    countByImo: cache.byImo.size,
    countByMmsi: cache.byMmsi.size,
    errors: cache.errors,
  };
}

export function startSanctionsRefresh() {
  refreshSanctions().catch((err) =>
    console.error("[sanctions] initial refresh failed", err),
  );
  setInterval(() => {
    refreshSanctions().catch((err) =>
      console.error("[sanctions] refresh failed", err),
    );
  }, REFRESH_MS);
}
