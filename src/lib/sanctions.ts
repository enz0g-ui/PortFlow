/**
 * Pulls public sanctions lists (US OFAC SDN, UK OFSI) and indexes the
 * vessels they reference by IMO and MMSI. Refreshed daily.
 *
 * Free + public sources:
 *   - OFAC SDN: https://www.treasury.gov/ofac/downloads/sdn.csv (alt list also)
 *   - UK OFSI: https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.json
 *
 * Note: matching by MMSI is not 100% reliable — sanctions lists historically
 * named vessels (IMO is the canonical id), MMSI is added when known.
 * We expose both lookups.
 */

const OFAC_CSV = "https://www.treasury.gov/ofac/downloads/sdn.csv";
const UK_OFSI_JSON =
  "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.json";

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

const IMO_REGEX = /\bIMO[\s:#-]*(\d{7})\b/i;
const MMSI_REGEX = /\bMMSI[\s:#-]*(\d{9})\b/i;

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
    signal: AbortSignal.timeout(20_000),
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

async function fetchOfsi(): Promise<SanctionEntry[]> {
  const r = await fetch(UK_OFSI_JSON, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`OFSI HTTP ${r.status}`);
  const json = (await r.json()) as {
    Designations?: Array<{
      Name?: { Name6?: string };
      OtherInformation?: string;
      RegimeName?: string;
      Names?: Array<{ Name6?: string }>;
    }>;
  };

  const entries: SanctionEntry[] = [];
  for (const d of json.Designations ?? []) {
    const name = d.Name?.Name6 ?? d.Names?.[0]?.Name6 ?? "";
    if (!name) continue;
    const blob = `${name} ${d.OtherInformation ?? ""}`;
    const ids = parseIdsFromText(blob);
    if (!ids.imo && !ids.mmsi) continue;
    entries.push({
      source: "ofsi",
      list: d.RegimeName ?? "UK",
      name: name.trim(),
      imo: ids.imo,
      mmsi: ids.mmsi,
      reason: (d.OtherInformation ?? "").slice(0, 200),
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
    const all: SanctionEntry[] = [];
    try {
      all.push(...(await fetchOfac()));
    } catch (err) {
      errors.push(`ofac: ${(err as Error).message}`);
    }
    try {
      all.push(...(await fetchOfsi()));
    } catch (err) {
      errors.push(`ofsi: ${(err as Error).message}`);
    }
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
