import { db } from "./db";
import { listLabel } from "./brief";
import { euCompanyFor, type EuCompanyHit } from "./eu-companies";
import { flagFromMmsi } from "./mid";

/**
 * Sociétés liées et contrôles d'identité d'un navire.
 *
 * - Sociétés liées : ce que disent les listes elles-mêmes (OFAC « Linked To »,
 *   colonnes owner / operator). Pas de base de propriété achetée : on montre
 *   seulement ce qui est publié, et les autres navires listés sous la même
 *   société.
 * - Contrôles d'identité : écarts entre ce que le transpondeur diffuse et ce
 *   que disent les listes ou les autres transpondeurs (même IMO sous
 *   plusieurs MMSI, nom diffusé différent du nom listé, pavillon du MMSI
 *   différent de celui de la liste, changements de nom observés).
 */

export interface LinkedVessel {
  imo: number | null;
  mmsi: number | null;
  name: string | null;
  lists: string[];
}

export interface LinkedCompany {
  name: string;
  /** D'où vient le lien : « OFAC » (Linked To), « owner », « operator ». */
  via: string;
  siblings: LinkedVessel[];
  siblingCount: number;
  /** La société figure aussi sur la liste UE des sociétés sanctionnées. */
  eu: EuCompanyHit | null;
}

export type IdentityCheckKind =
  | "multi_mmsi"
  | "name_mismatch"
  | "flag_mismatch"
  | "aliases"
  | "renamed";

export interface IdentityCheck {
  kind: IdentityCheckKind;
  /** true = écart qui mérite une vérification ; false = information. */
  warn: boolean;
  text: string;
  mmsis?: Array<{ mmsi: number; name: string | null }>;
}

// ─── Index société → navires listés ────────────────────────────────────

interface CompanyRow {
  imo: number | null;
  mmsi: number | null;
  name: string | null;
  source: string;
}

let _companyCache: { ts: number; idx: Map<string, CompanyRow[]> } | null = null;

const normCo = (s: string) =>
  s
    .toUpperCase()
    .replace(/[.,;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function parseLinkedTo(reason: string | null): string[] {
  if (!reason) return [];
  const out: string[] = [];
  const re = /Linked To:\s*([^;]+?)\s*(?:;|\.\s*$|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reason))) {
    const n = normCo(m[1]);
    if (n.length >= 3) out.push(n);
  }
  return out;
}

function companyIndex(): Map<string, CompanyRow[]> {
  if (_companyCache && Date.now() - _companyCache.ts < 10 * 60_000) return _companyCache.idx;
  const rows = db()
    .raw.prepare(
      `SELECT source, imo, mmsi, ship_name, owner, operator, reason
       FROM sanctioned_vessels WHERE delisted_at IS NULL`,
    )
    .all() as unknown as Array<{
    source: string;
    imo: number | null;
    mmsi: number | null;
    ship_name: string | null;
    owner: string | null;
    operator: string | null;
    reason: string | null;
  }>;
  const idx = new Map<string, CompanyRow[]>();
  for (const r of rows) {
    const cos = new Set<string>(parseLinkedTo(r.reason));
    if (r.owner) cos.add(normCo(r.owner));
    if (r.operator) cos.add(normCo(r.operator));
    for (const c of cos) {
      const arr = idx.get(c) ?? [];
      arr.push({ imo: r.imo, mmsi: r.mmsi, name: r.ship_name, source: r.source });
      idx.set(c, arr);
    }
  }
  _companyCache = { ts: Date.now(), idx };
  return idx;
}

export function linkedCompanies(mmsi: number, imo: number | null): LinkedCompany[] {
  const raw = db().raw;
  const rows = raw
    .prepare(
      `SELECT source, owner, operator, reason FROM sanctioned_vessels
       WHERE delisted_at IS NULL AND (mmsi = ? ${imo ? "OR imo = ?" : ""})`,
    )
    .all(...(imo ? [mmsi, imo] : [mmsi])) as unknown as Array<{
    source: string;
    owner: string | null;
    operator: string | null;
    reason: string | null;
  }>;
  const found = new Map<string, string>();
  for (const r of rows) {
    for (const c of parseLinkedTo(r.reason)) if (!found.has(c)) found.set(c, listLabel(r.source));
    if (r.owner && !found.has(normCo(r.owner))) found.set(normCo(r.owner), "owner");
    if (r.operator && !found.has(normCo(r.operator))) found.set(normCo(r.operator), "operator");
  }
  if (found.size === 0) return [];

  const idx = companyIndex();
  const mmsiByImo = raw.prepare(
    `SELECT mmsi FROM static_ships WHERE imo = ? ORDER BY updated_at DESC LIMIT 1`,
  );
  const out: LinkedCompany[] = [];
  for (const [name, via] of found) {
    const all = idx.get(name) ?? [];
    // Un même navire peut figurer sur plusieurs listes : regrouper par IMO.
    const byKey = new Map<string, LinkedVessel>();
    for (const s of all) {
      if ((imo && s.imo === imo) || s.mmsi === mmsi) continue;
      const key = s.imo ? `i${s.imo}` : `m${s.mmsi}`;
      const cur = byKey.get(key);
      const label = listLabel(s.source);
      if (cur) {
        if (!cur.lists.includes(label)) cur.lists.push(label);
      } else {
        byKey.set(key, { imo: s.imo, mmsi: s.mmsi, name: s.name, lists: [label] });
      }
    }
    const siblings = [...byKey.values()];
    for (const s of siblings.slice(0, 12)) {
      if (!s.mmsi && s.imo) {
        const r = mmsiByImo.get(s.imo) as { mmsi: number } | undefined;
        if (r) s.mmsi = r.mmsi;
      }
    }
    out.push({
      name,
      via,
      siblings: siblings.slice(0, 12),
      siblingCount: siblings.length,
      eu: euCompanyFor(name),
    });
  }
  return out.sort((a, b) => b.siblingCount - a.siblingCount);
}

// ─── Contrôles d'identité ──────────────────────────────────────────────

const normName = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

function listedNames(shipName: string | null, alt: string | null): string[] {
  const out: string[] = [];
  const push = (s: string | null | undefined) => {
    if (!s) return;
    const t = s.trim();
    if (!t || /^IMO\s*\d+$/i.test(t)) return;
    out.push(t);
  };
  if (shipName) {
    // UKSL : « IMO 9246621 (PORTOVYY) » — garder le nom entre parenthèses.
    const par = shipName.match(/\(\s*['‘’"]?([^'‘’")]+)['‘’"]?\s*\)/);
    push(par ? par[1] : shipName.replace(/^IMO\s*\d+\s*/i, ""));
  }
  for (const a of (alt ?? "").split("|")) push(a);
  return [...new Set(out)];
}

const normCountry = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export function identityChecks(input: {
  mmsi: number;
  imo: number | null;
  aisName: string | null;
}): IdentityCheck[] {
  const raw = db().raw;
  const out: IdentityCheck[] = [];
  const { mmsi, imo, aisName } = input;

  // Même IMO diffusé par d'autres transpondeurs.
  if (imo) {
    const others = raw
      .prepare(
        `SELECT mmsi, name FROM static_ships WHERE imo = ? AND mmsi <> ?
         ORDER BY updated_at DESC LIMIT 6`,
      )
      .all(imo, mmsi) as unknown as Array<{ mmsi: number; name: string | null }>;
    if (others.length > 0) {
      out.push({
        kind: "multi_mmsi",
        warn: true,
        text: `IMO ${imo} is also broadcast by ${others.length} other transponder${others.length > 1 ? "s" : ""} — re-flag, or identity being shared`,
        mmsis: others.map((o) => ({ mmsi: o.mmsi, name: o.name?.trim() || null })),
      });
    }
  }

  const sanc = raw
    .prepare(
      `SELECT ship_name, alt_names, flag FROM sanctioned_vessels
       WHERE delisted_at IS NULL AND (mmsi = ? ${imo ? "OR imo = ?" : ""})`,
    )
    .all(...(imo ? [mmsi, imo] : [mmsi])) as unknown as Array<{
    ship_name: string | null;
    alt_names: string | null;
    flag: string | null;
  }>;

  if (sanc.length > 0) {
    const names = [...new Set(sanc.flatMap((s) => listedNames(s.ship_name, s.alt_names)))];
    // Noms principaux (un par liste) et vrais alias (alt_names) séparés.
    const seenP = new Set<string>();
    const primary = sanc
      .flatMap((s) => listedNames(s.ship_name, null))
      .filter((x) => {
        const k = normName(x);
        if (seenP.has(k)) return false;
        seenP.add(k);
        return true;
      });
    const primaryN = new Set(primary.map(normName));
    if (aisName && names.length > 0) {
      const n = normName(aisName);
      const match = names.some((l) => {
        const m = normName(l);
        return m === n || (m.length >= 4 && (n.includes(m) || m.includes(n)));
      });
      if (!match && n.length >= 2) {
        out.push({
          kind: "name_mismatch",
          warn: true,
          text: `Broadcasting as “${aisName.trim()}”, listed as ${(primary.length ? primary : names)
            .slice(0, 3)
            .map((x) => `“${x}”`)
            .join(" / ")}`,
        });
      }
    }
    const aliases = names.filter((x) => !primaryN.has(normName(x)));
    if (aliases.length > 0) {
      out.push({
        kind: "aliases",
        warn: false,
        text: `Also listed as: ${aliases.slice(0, 6).join(", ")}${aliases.length > 6 ? "…" : ""}`,
      });
    }
    const listFlags = [...new Set(sanc.map((s) => s.flag).filter((f): f is string => !!f))];
    const mid = flagFromMmsi(mmsi);
    if (mid && listFlags.length > 0) {
      const midN = normCountry(mid.country);
      const same = listFlags.some((f) => {
        const fN = normCountry(f);
        return fN.slice(0, 5) === midN.slice(0, 5) || fN.includes(midN) || midN.includes(fN);
      });
      if (!same) {
        out.push({
          kind: "flag_mismatch",
          warn: true,
          text: `Listed under ${listFlags.join(" / ")} flag; transponder now registered to ${mid.country}`,
        });
      }
    }
  }

  // Changements de nom / indicatif / IMO observés par nos récepteurs.
  try {
    const hist = raw
      .prepare(
        `SELECT changed_at, old_name, new_name, old_callsign, new_callsign, old_imo, new_imo
         FROM static_identity_history WHERE mmsi = ? ORDER BY changed_at DESC LIMIT 5`,
      )
      .all(mmsi) as unknown as Array<{
      changed_at: number;
      old_name: string | null;
      new_name: string | null;
      old_callsign: string | null;
      new_callsign: string | null;
      old_imo: number | null;
      new_imo: number | null;
    }>;
    for (const h of hist) {
      const parts: string[] = [];
      if (h.old_name && h.new_name && normName(h.old_name) !== normName(h.new_name))
        parts.push(`name “${h.old_name.trim()}” → “${h.new_name.trim()}”`);
      if (h.old_callsign && h.new_callsign && normName(h.old_callsign) !== normName(h.new_callsign))
        parts.push(`call sign ${h.old_callsign.trim()} → ${h.new_callsign.trim()}`);
      if (h.old_imo && h.new_imo && h.old_imo !== h.new_imo) parts.push(`IMO ${h.old_imo} → ${h.new_imo}`);
      if (parts.length === 0) continue;
      const d = new Date(h.changed_at);
      const dd = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
      out.push({ kind: "renamed", warn: true, text: `Changed ${parts.join(", ")} on ${dd}` });
    }
  } catch {
    // Table absente tant que la migration 0021 n'est pas passée.
  }

  return out;
}
