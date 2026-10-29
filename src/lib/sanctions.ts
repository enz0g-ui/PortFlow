import { db } from "./db";

/**
 * Pulls public sanctions lists (US OFAC SDN, UK Sanctions List) and indexes the
 * vessels they reference by IMO and MMSI. Refreshed daily.
 *
 * Free + public sources:
 *   - OFAC SDN: sanctionslistservice.ofac.treas.gov (CSV; the old
 *     treasury.gov URL is a ~13s redirect chain that kept timing out)
 *   - UK: UK Sanctions List (FCDO), read from the sanctioned_vessels table
 *     filled by uk-sanctions.ts (the OFSI ConList was retired 28/01/2026)
 *
 * Note: matching by MMSI is not 100% reliable — sanctions lists historically
 * named vessels (IMO is the canonical id), MMSI is added when known.
 * We expose both lookups.
 */

const OFAC_CSV =
  "https://sanctionslistservice.ofac.treas.gov/api/download/sdn.csv";

interface SanctionEntry {
  source: "ofac" | "uksl";
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
    // 5,7 Mo via une redirection S3 : 30 s ne suffisait pas les jours lents.
    signal: AbortSignal.timeout(120_000),
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
 * UK : l'OFSI Consolidated List a été retirée le 28/01/2026 (son stockage
 * Azure refuse l'accès public depuis le 27/10/2026). La source britannique
 * officielle est désormais la UK Sanctions List (FCDO), déjà ingérée chaque
 * jour en base par uk-sanctions.ts — on relit cette table plutôt que de
 * télécharger une seconde fois un fichier de ~50 Mo.
 */
function loadUkFromDb(): SanctionEntry[] {
  const rows = db()
    .raw.prepare(
      `SELECT ship_name, imo, mmsi, regime, reason
       FROM sanctioned_vessels
       WHERE source = 'uksl' AND delisted_at IS NULL`,
    )
    .all() as unknown as Array<{
    ship_name: string | null;
    imo: number | null;
    mmsi: number | null;
    regime: string | null;
    reason: string | null;
  }>;
  if (rows.length === 0) throw new Error("UKSL table empty");
  return rows.map((r) => ({
    source: "uksl" as const,
    list: r.regime?.trim() || "UK",
    name: (r.ship_name ?? "").trim(),
    imo: r.imo ?? undefined,
    mmsi: r.mmsi ?? undefined,
    reason: (r.reason ?? "").slice(0, 200),
  }));
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
    let ukEntries: SanctionEntry[] | null = null;
    try {
      ofacEntries = await fetchOfac();
    } catch (err) {
      errors.push(`ofac: ${(err as Error).message}`);
    }
    try {
      ukEntries = loadUkFromDb();
    } catch (err) {
      errors.push(`uksl: ${(err as Error).message}`);
    }

    // Keep-last-good: a source that failed keeps its previous entries — a
    // stale sanctions list beats an empty one (screening going blank both
    // looks broken and silently stops flagging). fetchedAt only advances
    // when at least one source succeeded, so /api/health keeps reporting
    // the true staleness of what we're serving.
    if (ofacEntries === null && ukEntries === null) {
      cache.errors = errors;
      return;
    }
    const all = [
      ...(ofacEntries ?? cache.entries.filter((e) => e.source === "ofac")),
      ...(ukEntries ?? cache.entries.filter((e) => e.source === "uksl")),
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

// Vérification HORAIRE, rafraîchissement quand la liste a vieilli de
// REFRESH_MS. Avant : setInterval(REFRESH_MS) + garde « âge < REFRESH_MS »
// → le tick tombait quelques secondes AVANT l'échéance et était sauté, d'où
// un rafraîchissement réel toutes les 48 h (sonde /api/health en 503 au-delà
// de 36 h). Un échec (source en panne) est aussi retenté l'heure suivante
// au lieu d'attendre un jour.
const CHECK_EVERY_MS = 60 * 60_000;
let _lastAttemptHadErrors = false;

async function refreshTick(label: string): Promise<void> {
  const cache = getCache();
  const age = Date.now() - cache.fetchedAt;
  const due = !cache.fetchedAt || age >= REFRESH_MS - CHECK_EVERY_MS;
  // Pas de garde d'âge sur la reprise : fetchedAt est posé quelques secondes
  // APRÈS le tick, donc « âge >= 1 h » sautait le tick suivant et une source
  // tombée au démarrage restait absente 2 h au lieu d'1.
  const retry = _lastAttemptHadErrors;
  if (!due && !retry) return;
  try {
    await refreshSanctions(true);
    const after = getCache();
    _lastAttemptHadErrors = after.errors.length > 0;
    if (_lastAttemptHadErrors) {
      console.error(`[sanctions] ${label}: partial/failed — ${after.errors.join(" | ")}`);
    }
  } catch (err) {
    _lastAttemptHadErrors = true;
    console.error(`[sanctions] ${label} refresh failed`, err);
  }
}

export function startSanctionsRefresh() {
  void refreshTick("initial");
  setInterval(() => {
    void refreshTick("tick");
  }, CHECK_EVERY_MS);
}
