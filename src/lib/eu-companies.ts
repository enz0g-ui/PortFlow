import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "./db";

/**
 * Sociétés sanctionnées par l'UE — fichier consolidé FSF de la Commission.
 *
 * Le fichier ne contient aucun navire, mais des armateurs, gestionnaires et
 * sociétés de soutage (avec, pour certaines, leur n° IMO de société). On le
 * croise avec les sociétés que les autres listes relient à un navire.
 *
 * Source : EU_FSF_XML_URL si un accès complet est obtenu (téléchargement
 * automatique), sinon data/eu_fsf.xml déposé à la main (téléchargé depuis
 * https://webgate.ec.europa.eu/fsd/fsf). Rechargé quand le fichier change.
 */

const LOCAL_FILE = resolve(process.cwd(), "data", "eu_fsf.xml");

const LEGAL_FORMS = new Set([
  "LIMITED", "LTD", "LLC", "FZ", "FZE", "FZCO", "CO", "COMPANY", "CORP", "CORPORATION",
  "INC", "SPC", "JSC", "PJSC", "OJSC", "PTE", "PRIVATE", "SA", "THE",
]);

/** Nom de société normalisé : majuscules, sans forme juridique ni ponctuation. */
export function normCompany(s: string): string {
  return s
    .toUpperCase()
    .replace(/&AMP;/g, "&")
    .replace(/\bSHPG\b/g, "SHIPPING")
    .replace(/[.,;:()'"’]/g, " ")
    .split(/[\s\-–/]+/)
    .filter((w) => w && !LEGAL_FORMS.has(w))
    .join("")
    .replace(/[^A-Z0-9Ѐ-ӿ]/g, "");
}

const MARITIME =
  /ship|maritime|marine|tanker|navigation|fleet|vessel|bunker|freight|ocean|nefteflot/i;

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m
    ? m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    : null;
}

export interface EuCompaniesResult {
  ok: boolean;
  source: string;
  companies?: number;
  maritime?: number;
  fileDate?: string | null;
  skipped?: boolean;
  error?: string;
}

export function ingestEuFsfXml(xml: string, source: string): EuCompaniesResult {
  const fileDate = (xml.slice(0, 2000).match(/generationDate="([^"]*)"/) ?? [])[1] ?? null;
  const blocks = xml.split("<sanctionEntity ").slice(1);
  if (blocks.length < 500) {
    return { ok: false, source, error: `too few entities (${blocks.length})` };
  }

  const raw = db().raw;
  const now = Date.now();
  const insCo = raw.prepare(
    `INSERT OR REPLACE INTO eu_companies
       (logical_id, eu_ref, name, programme, listed_on, company_imo, maritime, file_date, ingested_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insName = raw.prepare(
    `INSERT OR IGNORE INTO eu_company_names (norm, logical_id) VALUES (?, ?)`,
  );
  let companies = 0;
  let maritime = 0;
  raw.exec("BEGIN");
  try {
    raw.exec("DELETE FROM eu_company_names; DELETE FROM eu_companies;");
    for (const b of blocks) {
      if (!/<subjectType code="enterprise"/.test(b)) continue;
      const head = b.slice(0, b.indexOf(">") + 1);
      const logicalId = Number(attr(head, "logicalId"));
      if (!Number.isFinite(logicalId)) continue;
      const names = [...b.matchAll(/<nameAlias [^>]*>/g)]
        .map((m) => attr(m[0], "wholeName"))
        .filter((n): n is string => !!n && n.trim().length > 1);
      if (names.length === 0) continue;
      const reg = b.match(/<regulation [^>]*>/)?.[0] ?? "";
      const pub = attr(reg, "publicationDate");
      const imoTag = b.match(/<identification [^>]*identificationTypeCode="imo"[^>]*>/)?.[0];
      const companyImo = imoTag ? attr(imoTag, "number") : null;
      const isMar = Boolean(companyImo) || names.some((n) => MARITIME.test(n));
      insCo.run(
        logicalId,
        attr(head, "euReferenceNumber"),
        names[0].trim(),
        attr(reg, "programme"),
        pub ? Date.parse(pub) || null : null,
        companyImo,
        isMar ? 1 : 0,
        fileDate,
        now,
      );
      for (const n of new Set(names.map(normCompany))) {
        if (n.length >= 4) insName.run(n, logicalId);
      }
      companies++;
      if (isMar) maritime++;
    }
    raw.exec("COMMIT");
  } catch (err) {
    raw.exec("ROLLBACK");
    return { ok: false, source, error: (err as Error).message };
  }
  return { ok: true, source, companies, maritime, fileDate };
}

let _lastMtime = 0;

export async function refreshEuCompanies(): Promise<EuCompaniesResult> {
  const url = process.env.EU_FSF_XML_URL;
  if (url) {
    try {
      const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(120_000) });
      if (r.ok) return ingestEuFsfXml(await r.text(), "url");
    } catch {
      /* repli sur le fichier local */
    }
  }
  if (!existsSync(LOCAL_FILE)) return { ok: false, source: "file", error: "no data/eu_fsf.xml" };
  const mtime = statSync(LOCAL_FILE).mtimeMs;
  if (mtime === _lastMtime) return { ok: true, source: "file", skipped: true };
  const res = ingestEuFsfXml(readFileSync(LOCAL_FILE, "utf8"), "file");
  if (res.ok) _lastMtime = mtime;
  return res;
}

export interface EuCompanyHit {
  name: string;
  euRef: string | null;
  programme: string | null;
  listedOn: number | null;
  fileDate: string | null;
}

export function euCompanyFor(name: string): EuCompanyHit | null {
  const n = normCompany(name);
  if (n.length < 4) return null;
  try {
    const r = db()
      .raw.prepare(
        `SELECT c.name, c.eu_ref, c.programme, c.listed_on, c.file_date
         FROM eu_company_names n JOIN eu_companies c ON c.logical_id = n.logical_id
         WHERE n.norm = ? LIMIT 1`,
      )
      .get(n) as
      | {
          name: string;
          eu_ref: string | null;
          programme: string | null;
          listed_on: number | null;
          file_date: string | null;
        }
      | undefined;
    return r
      ? { name: r.name, euRef: r.eu_ref, programme: r.programme, listedOn: r.listed_on, fileDate: r.file_date }
      : null;
  } catch {
    return null; // table absente avant la migration 0023
  }
}

let _timer: ReturnType<typeof setInterval> | null = null;

export function startEuCompanies(): void {
  if (_timer) return;
  const run = async () => {
    try {
      const r = await refreshEuCompanies();
      if (r.ok && !r.skipped) {
        console.log(
          `[eu-companies] loaded ${r.companies} companies (${r.maritime} maritime) from ${r.source}, file ${r.fileDate}`,
        );
      } else if (!r.ok) {
        console.warn(`[eu-companies] ${r.error}`);
      }
    } catch (err) {
      console.error("[eu-companies] crashed", err);
    }
  };
  setTimeout(() => void run(), 180_000);
  _timer = setInterval(() => void run(), 6 * 3_600_000);
}
