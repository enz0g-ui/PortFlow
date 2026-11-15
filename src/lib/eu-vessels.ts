import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { invalidateSanctionedIndex } from "./uk-sanctions";
import {
  finishIngest,
  recordFailedFetch,
  sha256Hex,
  type SanctionedEntry,
} from "./sanctions-versions";

/**
 * Liste UE des navires sanctionnés — importeur.
 *
 * Contenu : navires désignés par l'UE
 *  - Russie : interdiction d'accès aux ports, art. 3s du règlement 833/2014
 *    (annexe XLII, « flotte fantôme ») ;
 *  - Corée du Nord : gel, saisie, radiation, interdiction d'entrée au port
 *    (règlement 2017/1509).
 *
 * Source : fichier d'import publié par l'autorité maritime danoise (DMA),
 * reprise fidèle des annexes du Journal officiel, mise à jour à chaque
 * paquet de sanctions. EUR-Lex (texte faisant foi) refuse les robots.
 *
 * Adresse : le nom du fichier change à chaque mise à jour. On essaie :
 *  1. la page DMA (lien « ImportversionList…csv ») — souvent refusée aux
 *     adresses de serveurs ;
 *  2. data/eu_vessels_url.txt (mise à jour manuelle quand la veille sur
 *     KARL signale un nouveau fichier, cf. scripts/eu-vessels-watch.sh) ;
 *  3. EU_VESSELS_CSV_URL, puis la dernière adresse connue ci-dessous.
 */

const DMA_PAGE =
  "https://www.dma.dk/growth-and-framework-conditions/maritime-sanctions/general-information/eu-vessel-designations";
const CDN_BASE = "https://cdn2.gopublic.dk/soefartsstyrelsen";
const LAST_KNOWN =
  `${CDN_BASE}/Media/639204766104358805/ImportversionListOfEUDesignatedVessels240726.csv`;
const URL_FILE = resolve(process.cwd(), "data", "eu_vessels_url.txt");
const FETCH_TIMEOUT_MS = 60_000;
const UA = "Mozilla/5.0 (compatible; PortFlow sanctions ingest; +https://portflow.uk/sources)";

export interface EuVesselsResult {
  ok: boolean;
  url: string;
  rows: number;
  vessels: number;
  inserted: number;
  delisted?: number;
  unchanged?: boolean;
  error?: string;
}

async function discoverUrl(): Promise<string> {
  try {
    const r = await fetch(DMA_PAGE, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": UA, accept: "text/html" },
    });
    if (r.ok) {
      const html = await r.text();
      const m = html.match(/\/Media\/\d+\/ImportversionList[A-Za-z0-9_%.-]*\.csv/);
      if (m) return `${CDN_BASE}${m[0]}`;
    }
  } catch {
    /* page refusée : on passe aux adresses connues */
  }
  try {
    if (existsSync(URL_FILE)) {
      const u = readFileSync(URL_FILE, "utf8").trim();
      if (/^https:\/\/\S+\.csv$/i.test(u)) return u;
    }
  } catch {
    /* ignore */
  }
  return process.env.EU_VESSELS_CSV_URL || LAST_KNOWN;
}

/** Découpe une ligne CSV « ; » avec guillemets. */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ";") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** « Kavya (formerly Hana; Andromeda Star) » → nom + anciens noms. */
export function splitName(raw: string): { name: string; former: string[] } {
  const m = raw.match(/^(.*?)\s*\((?:formerly|ex\.?|f\/k\/a)\s*([^)]*)\)\s*$/i);
  if (!m) return { name: raw.trim(), former: [] };
  return {
    name: m[1].trim(),
    former: m[2]
      .split(/[;,/]/)
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function parseDate(v: string): number | null {
  const m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function regimeFor(subject: string): string {
  if (/833\/2014/.test(subject)) return "Russia — port access ban, Art. 3s Reg. (EU) 833/2014";
  if (/2017\/1509/.test(subject)) {
    const measure = subject.replace(/\s*\(.*\)\s*$/, "").trim();
    return `DPRK — ${measure}, Reg. (EU) 2017/1509`;
  }
  return subject;
}

export function parseEuVesselsCsv(text: string): SanctionedEntry[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const byId = new Map<string, SanctionedEntry>();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [rawName, rawImo, rawDate, subject] = splitCsv(line);
    if (!rawName || !subject) continue;
    const imo = /^\d{7}$/.test(rawImo ?? "") ? Number(rawImo) : null;
    const { name, former } = splitName(rawName);
    const sourceId = imo ? `imo:${imo}` : `name:${name.toUpperCase()}`;
    const regime = regimeFor(subject);
    const cur = byId.get(sourceId);
    if (cur) {
      // Même navire sur deux lignes (deux mesures) : on fusionne.
      if (cur.regime && !cur.regime.includes(regime)) cur.regime = `${cur.regime}; ${regime}`;
      const alts = new Set([...(cur.altNames?.split("|") ?? []), ...former]);
      cur.altNames = alts.size ? [...alts].join("|") : null;
      continue;
    }
    byId.set(sourceId, {
      sourceId,
      shipName: name,
      altNames: former.length ? former.join("|") : null,
      imo,
      mmsi: null,
      flag: null,
      vesselType: null,
      tonnage: null,
      builtYear: null,
      owner: null,
      operator: null,
      regime,
      listedOn: parseDate(rawDate ?? ""),
      reason: `${subject}. Listed by the Council of the European Union.`,
      rawJson: JSON.stringify({ line }),
    });
  }
  return [...byId.values()];
}

export async function fetchEuVessels(): Promise<EuVesselsResult> {
  const url = await discoverUrl();
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": UA },
    });
    if (!res.ok) {
      try {
        recordFailedFetch({ source: "eu_vessels", url }, `HTTP ${res.status}`);
      } catch {
        /* le journal ne doit pas masquer l'erreur */
      }
      return { ok: false, url, rows: 0, vessels: 0, inserted: 0, error: `HTTP ${res.status}` };
    }
    const text = await res.text();
    // Garde-fou : un fichier tronqué ou une page d'erreur ne doit pas
    // radier toute la liste.
    if (!/Vessel name/i.test(text.slice(0, 200))) {
      recordFailedFetch({ source: "eu_vessels", url }, "unexpected content");
      return { ok: false, url, rows: 0, vessels: 0, inserted: 0, error: "unexpected content" };
    }
    const entries = parseEuVesselsCsv(text);
    if (entries.length < 300) {
      recordFailedFetch({ source: "eu_vessels", url }, `too few rows (${entries.length})`);
      return { ok: false, url, rows: entries.length, vessels: 0, inserted: 0, error: "too few rows" };
    }
    const fin = finishIngest({
      meta: {
        source: "eu_vessels",
        url,
        etag: res.headers.get("etag"),
        lastModified: res.headers.get("last-modified"),
        sha256: sha256Hex(text),
        byteSize: Buffer.byteLength(text),
      },
      entries,
    });
    if (!fin.unchanged) invalidateSanctionedIndex();
    return {
      ok: true,
      url,
      rows: entries.length,
      vessels: entries.filter((e) => e.imo).length,
      inserted: fin.inserted,
      delisted: fin.delisted,
      unchanged: fin.unchanged,
    };
  } catch (err) {
    try {
      recordFailedFetch({ source: "eu_vessels", url }, (err as Error).message);
    } catch {
      /* idem */
    }
    return { ok: false, url, rows: 0, vessels: 0, inserted: 0, error: (err as Error).message };
  }
}

let _timer: ReturnType<typeof setInterval> | null = null;
let _last: EuVesselsResult | null = null;

export function startEuVesselsScanner(): void {
  if (_timer) return;
  const run = async (label: string) => {
    try {
      _last = await fetchEuVessels();
      if (_last.ok) {
        console.log(
          `[eu-vessels] ${label}: rows=${_last.rows} imo=${_last.vessels} inserted=${_last.inserted} delisted=${_last.delisted ?? 0}${_last.unchanged ? " (unchanged)" : ""}`,
        );
      } else {
        console.error(`[eu-vessels] ${label} failed: ${_last.error} (${_last.url})`);
      }
    } catch (err) {
      console.error(`[eu-vessels] ${label} crashed`, err);
    }
  };
  // Après UKSL (90 s), OFAC (120 s), UN (150 s).
  setTimeout(() => void run("initial fetch"), 170_000);
  _timer = setInterval(() => void run("tick"), 24 * 3_600_000);
}

export function getEuVesselsStatus() {
  return { started: _timer !== null, lastResult: _last };
}
