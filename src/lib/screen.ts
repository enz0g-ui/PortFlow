import { db } from "./db";
import { getPort, PORTS } from "./ports";
import { getVessels } from "./store";
import {
  contactTier,
  listLabel,
  placeFor,
  sanctionedIndex,
  staticFor,
  TIER_RANK,
  vesselRole,
  type ContactTier,
  type Place,
} from "./brief";
import { flagFromMmsi, type MidFlag } from "./mid";

/**
 * Vérification de flotte : le visiteur tape ou colle des noms, IMO ou
 * MMSI ; chaque ligne reçoit un verdict.
 *
 *   sanctioned — sur une liste (OFAC, UK, ONU)
 *   exposed    — pas listé, mais a rencontré en mer un navire listé
 *   clear      — vu par nos récepteurs, ni listé ni contact listé
 *   unassessed — vu, mais identité incomplète : exposition non évaluée
 *   unseen     — identifié, mais hors de notre couverture AIS récente
 *   unknown    — identifiant introuvable
 *
 * L'« exposition par contact » est ce que les listes officielles ne disent
 * pas : elle vient de nos propres détections de rencontres navire-à-navire.
 */

export type Verdict =
  | "sanctioned"
  | "exposed"
  | "clear"
  | "unassessed"
  | "unseen"
  | "unknown";

export const EXPOSURE_DAYS = 90;
const MAX_LINES = 50;

export interface Contact {
  mmsi: number;
  name: string | null;
  lists: string[];
  meetings: number;
  hours: number;
  lastTs: number;
  best: ContactTier;
  lastEncounterId: number;
}

export interface ScreenRow {
  input: string;
  mmsi: number | null;
  imo: number | null;
  name: string | null;
  cargoClass: string | null;
  verdict: Verdict;
  lists: string[];
  contacts: Contact[];
  lastSeen: { ts: number; place: Place } | null;
  homonyms: number;
  /** Unité de service (remorqueur, pilote…) : exposition non évaluée. */
  service: boolean;
  midFlag: MidFlag | null;
}

export function isValidImo(n: number): boolean {
  const s = String(n);
  if (!/^\d{7}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += Number(s[i]) * (7 - i);
  return sum % 10 === Number(s[6]);
}

/** Découpe la saisie : lignes, virgules, points-virgules, tabulations. */
export function parseQuery(q: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of q.split(/[\n\r,;\t]+/)) {
    const t = part.trim().replace(/^IMO\s*/i, "").replace(/\s+/g, " ");
    if (!t || t.length > 60) continue;
    const key = t.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= MAX_LINES) break;
  }
  return out;
}

interface Ident {
  mmsi: number | null;
  imo: number | null;
  name: string | null;
  cargoClass: string | null;
  updatedAt: number | null;
  homonyms: number;
}

function resolve(input: string): Ident | null {
  const raw = db().raw;
  const digits = /^\d+$/.test(input) ? Number(input) : null;

  type Row = {
    mmsi: number;
    name: string | null;
    imo: number | null;
    cargo_class: string | null;
    updated_at: number | null;
  };
  let rows: Row[] = [];
  if (digits !== null && input.length === 7) {
    rows = raw
      .prepare(
        `SELECT mmsi, name, imo, cargo_class, updated_at FROM static_ships
         WHERE imo = ? ORDER BY updated_at DESC LIMIT 5`,
      )
      .all(digits) as unknown as Row[];
  } else if (digits !== null && input.length === 9) {
    rows = raw
      .prepare(
        `SELECT mmsi, name, imo, cargo_class, updated_at FROM static_ships
         WHERE mmsi = ?`,
      )
      .all(digits) as unknown as Row[];
  } else if (digits === null) {
    rows = raw
      .prepare(
        `SELECT mmsi, name, imo, cargo_class, updated_at FROM static_ships
         WHERE UPPER(TRIM(name)) = ? ORDER BY updated_at DESC LIMIT 10`,
      )
      .all(input.toUpperCase()) as unknown as Row[];
  }
  if (rows.length > 0) {
    const r = rows[0];
    return {
      mmsi: r.mmsi,
      imo: r.imo,
      name: r.name?.trim() || null,
      cargoClass: r.cargo_class,
      updatedAt: r.updated_at,
      homonyms: rows.length - 1,
    };
  }

  // Pas dans nos identités AIS : on cherche directement dans les listes.
  type SRow = { mmsi: number | null; imo: number | null; ship_name: string | null };
  let s: SRow | undefined;
  if (digits !== null && input.length === 7) {
    s = raw
      .prepare(
        `SELECT mmsi, imo, ship_name FROM sanctioned_vessels
         WHERE imo = ? AND delisted_at IS NULL LIMIT 1`,
      )
      .get(digits) as unknown as SRow | undefined;
    if (!s && isValidImo(digits)) {
      return { mmsi: null, imo: digits, name: null, cargoClass: null, updatedAt: null, homonyms: 0 };
    }
  } else if (digits !== null && input.length === 9) {
    s = raw
      .prepare(
        `SELECT mmsi, imo, ship_name FROM sanctioned_vessels
         WHERE mmsi = ? AND delisted_at IS NULL LIMIT 1`,
      )
      .get(digits) as unknown as SRow | undefined;
  } else if (digits === null) {
    const up = input.toUpperCase();
    s = raw
      .prepare(
        `SELECT mmsi, imo, ship_name FROM sanctioned_vessels
         WHERE delisted_at IS NULL
           AND (UPPER(ship_name) = ? OR UPPER(alt_names) LIKE ?)
         LIMIT 1`,
      )
      .get(up, `%${up}%`) as unknown as SRow | undefined;
  }
  if (s) {
    return {
      mmsi: s.mmsi,
      imo: s.imo,
      name: s.ship_name,
      cargoClass: null,
      updatedAt: null,
      homonyms: 0,
    };
  }

  // MMSI sans identité diffusée mais présent dans nos détections : on le
  // garde (navire non identifié) plutôt que de répondre « introuvable ».
  if (digits !== null && input.length === 9 && digits >= 100_000_000) {
    const seen = raw
      .prepare(
        `SELECT 1 FROM encounters WHERE mmsi_a = ?1 OR mmsi_b = ?1
         UNION ALL SELECT 1 FROM voyages WHERE mmsi = ?1
         UNION ALL SELECT 1 FROM loitering_events WHERE mmsi = ?1
         UNION ALL SELECT 1 FROM chokepoint_transits WHERE mmsi = ?1
         LIMIT 1`,
      )
      .get(digits);
    if (seen) {
      return { mmsi: digits, imo: null, name: null, cargoClass: null, updatedAt: null, homonyms: 0 };
    }
  }
  return null;
}

function listsFor(id: Ident): string[] {
  const where: string[] = [];
  const params: number[] = [];
  if (id.imo) {
    where.push("imo = ?");
    params.push(id.imo);
  }
  if (id.mmsi) {
    where.push("mmsi = ?");
    params.push(id.mmsi);
  }
  if (where.length === 0) return [];
  const rows = db()
    .raw.prepare(
      `SELECT DISTINCT source FROM sanctioned_vessels
       WHERE delisted_at IS NULL AND (${where.join(" OR ")})`,
    )
    .all(...params) as unknown as Array<{ source: string }>;
  return [...new Set(rows.map((r) => listLabel(r.source)))].sort();
}

/**
 * Navires listés rencontrés en mer sur la fenêtre. Les rapprochements au
 * port ou au terminal sont écartés (amarrés au même quai).
 */
export function sanctionedContacts(mmsi: number, days = EXPOSURE_DAYS): Contact[] {
  const since = Date.now() - days * 86_400_000;
  const rows = db()
    .raw.prepare(
      `SELECT id, mmsi_a, mmsi_b, start_ts, duration_h, start_lat, start_lon,
              median_distance_m, was_sanctioned_a, was_sanctioned_b
       FROM encounters
       WHERE (mmsi_a = ? OR mmsi_b = ?) AND start_ts >= ?
       ORDER BY start_ts DESC LIMIT 1000`,
    )
    .all(mmsi, mmsi, since) as unknown as Array<{
    id: number;
    mmsi_a: number;
    mmsi_b: number;
    start_ts: number;
    duration_h: number | null;
    start_lat: number;
    start_lon: number;
    median_distance_m: number | null;
    was_sanctioned_a: number;
    was_sanctioned_b: number;
  }>;
  const sanc = sanctionedIndex();
  const out = new Map<number, Contact>();
  for (const r of rows) {
    const isA = r.mmsi_a === mmsi;
    const o = isA ? r.mmsi_b : r.mmsi_a;
    const flagged = isA ? r.was_sanctioned_b === 1 : r.was_sanctioned_a === 1;
    const info = sanc.get(o);
    if (!info && !flagged) continue;
    const tier = contactTier(r.start_lat, r.start_lon, r.median_distance_m, r.duration_h);
    if (tier === "port") continue;
    const c = out.get(o) ?? {
      mmsi: o,
      name: null,
      lists: info?.lists ?? ["Listed"],
      meetings: 0,
      hours: 0,
      lastTs: 0,
      best: tier,
      lastEncounterId: r.id,
    };
    c.meetings++;
    c.hours += r.duration_h ?? 0;
    if (r.start_ts > c.lastTs) {
      c.lastTs = r.start_ts;
      c.lastEncounterId = r.id;
    }
    if (TIER_RANK[tier] > TIER_RANK[c.best]) c.best = tier;
    out.set(o, c);
  }
  const contacts = [...out.values()];
  const stat = staticFor(contacts.map((c) => c.mmsi));
  for (const c of contacts) {
    c.name = stat.get(c.mmsi)?.name?.trim() || sanc.get(c.mmsi)?.name || null;
  }
  return contacts.sort(
    (a, b) => TIER_RANK[b.best] - TIER_RANK[a.best] || b.lastTs - a.lastTs,
  );
}

// Positions live (ports suivis), construites une fois par vérification.
function liveIndex(): Map<number, { ts: number; lat: number; lon: number }> {
  const m = new Map<number, { ts: number; lat: number; lon: number }>();
  for (const p of PORTS) {
    for (const v of getVessels(p.id)) {
      const cur = m.get(v.mmsi);
      if (!cur || v.lastUpdate > cur.ts) {
        m.set(v.mmsi, { ts: v.lastUpdate, lat: v.latitude, lon: v.longitude });
      }
    }
  }
  return m;
}

/** Dernier événement connu en base (détroit, stationnement, escale). */
function lastEvent(mmsi: number): { ts: number; place: Place } | null {
  const raw = db().raw;
  const cands: Array<{ ts: number; place: Place }> = [];
  const tr = raw
    .prepare(
      `SELECT entered_at AS ts, exited_at AS te, entry_lat AS lat, entry_lon AS lon
       FROM chokepoint_transits WHERE mmsi = ? ORDER BY entered_at DESC LIMIT 1`,
    )
    .get(mmsi) as unknown as
    | { ts: number; te: number | null; lat: number; lon: number }
    | undefined;
  if (tr) cands.push({ ts: tr.te ?? tr.ts, place: placeFor(tr.lat, tr.lon) });
  const lo = raw
    .prepare(
      `SELECT start_ts AS ts, end_ts AS te, start_lat AS lat, start_lon AS lon
       FROM loitering_events WHERE mmsi = ? ORDER BY start_ts DESC LIMIT 1`,
    )
    .get(mmsi) as unknown as
    | { ts: number; te: number | null; lat: number; lon: number }
    | undefined;
  if (lo) cands.push({ ts: lo.te ?? lo.ts, place: placeFor(lo.lat, lo.lon) });
  const vo = raw
    .prepare(
      `SELECT port, arrived_ts, departed_ts FROM voyages
       WHERE mmsi = ? AND arrived_ts IS NOT NULL
       ORDER BY arrived_ts DESC LIMIT 1`,
    )
    .get(mmsi) as unknown as
    | { port: string; arrived_ts: number; departed_ts: number | null }
    | undefined;
  if (vo) {
    cands.push({
      ts: vo.departed_ts ?? vo.arrived_ts,
      place: { label: getPort(vo.port)?.name ?? vo.port, portId: vo.port },
    });
  }
  cands.sort((a, b) => b.ts - a.ts);
  return cands[0] ?? null;
}

export function screenVessels(inputs: string[]): { rows: ScreenRow[]; at: number } {
  return { rows: screenRows(inputs), at: Date.now() };
}

function screenRows(inputs: string[]): ScreenRow[] {
  const live = liveIndex();
  const horizon = Date.now() - EXPOSURE_DAYS * 86_400_000;
  return inputs.map((input) => {
    const id = resolve(input);
    if (!id) {
      return {
        input,
        mmsi: null,
        imo: null,
        name: null,
        cargoClass: null,
        verdict: "unknown",
        lists: [],
        contacts: [],
        lastSeen: null,
        homonyms: 0,
        service: false,
        midFlag: null,
      };
    }
    const lists = listsFor(id);
    const role = id.mmsi ? vesselRole(staticFor([id.mmsi]).get(id.mmsi)) : "unknown";
    const service = role === "service";
    const contacts = id.mmsi && !service ? sanctionedContacts(id.mmsi) : [];

    let lastSeen: ScreenRow["lastSeen"] = null;
    if (id.mmsi) {
      const l = live.get(id.mmsi);
      if (l) lastSeen = { ts: l.ts, place: placeFor(l.lat, l.lon) };
      else lastSeen = lastEvent(id.mmsi);
    }
    const seen =
      (lastSeen && lastSeen.ts >= horizon) ||
      (id.updatedAt != null && id.updatedAt >= horizon);
    const identified = Boolean(id.name || id.imo);

    const verdict: Verdict =
      lists.length > 0
        ? "sanctioned"
        : !seen
          ? "unseen"
          : service
            ? "clear"
            : !identified || role === "unknown"
              ? "unassessed"
              : contacts.length > 0
                ? "exposed"
                : "clear";

    return {
      input,
      mmsi: id.mmsi,
      imo: id.imo,
      name: id.name,
      cargoClass: id.cargoClass,
      verdict,
      lists,
      contacts,
      lastSeen,
      homonyms: id.homonyms,
      service,
      midFlag: flagFromMmsi(id.mmsi),
    };
  });
}

// ─── Toile de relations ─────────────────────────────────────────────────

export interface NetNode {
  id: string;
  kind: "center" | "vessel" | "port";
  ring: 0 | 1 | 2;
  parent?: string;
  mmsi?: number;
  portId?: string;
  label: string;
  identified: boolean;
  sanctioned: boolean;
  lists: string[];
  cargoClass: string | null;
  flagCode: string | null;
  weight: number;
  hours: number;
  lastTs: number;
  best: ContactTier | null;
}

export interface NetEdge {
  from: string;
  to: string;
  weight: number;
  kind: "sts" | "port";
  best: ContactTier | null;
  /** Pour ouvrir la preuve : les deux navires du lien. */
  pair?: [number, number];
}

export interface Network {
  nodes: NetNode[];
  edges: NetEdge[];
  hiddenContacts: number;
  serviceHidden: number;
  portHidden: number;
  /** Navires listés au second cercle (contacts de contacts). */
  twoStepListed: number;
}

interface PairStat {
  meetings: number;
  hours: number;
  lastTs: number;
  best: ContactTier;
}

/**
 * Le navire au centre ; autour, les navires rencontrés en mer et les ports
 * touchés ; au second cercle, les navires que ces contacts ont eux-mêmes
 * rencontrés en mer. Rapprochements au port et unités de service écartés.
 */
export function getNetwork(mmsi: number, days = EXPOSURE_DAYS): Network {
  const raw = db().raw;
  const since = Date.now() - days * 86_400_000;
  const sanc = sanctionedIndex();

  type Enc = {
    mmsi_a: number;
    mmsi_b: number;
    start_ts: number;
    duration_h: number | null;
    start_lat: number;
    start_lon: number;
    median_distance_m: number | null;
  };
  const stmt = raw.prepare(
    `SELECT mmsi_a, mmsi_b, start_ts, duration_h, start_lat, start_lon, median_distance_m
     FROM encounters
     WHERE (mmsi_a = ? OR mmsi_b = ?) AND start_ts >= ?
     ORDER BY start_ts DESC LIMIT ?`,
  );
  let portHidden = 0;
  // Contacts en mer d'un navire, agrégés par autre navire.
  const contactsOf = (m: number, limit: number, countPort: boolean) => {
    const out = new Map<number, PairStat>();
    for (const r of stmt.all(m, m, since, limit) as unknown as Enc[]) {
      const tier = contactTier(r.start_lat, r.start_lon, r.median_distance_m, r.duration_h);
      if (tier === "port") {
        if (countPort) portHidden++;
        continue;
      }
      const o = r.mmsi_a === m ? r.mmsi_b : r.mmsi_a;
      const c = out.get(o) ?? { meetings: 0, hours: 0, lastTs: 0, best: tier };
      c.meetings++;
      c.hours += r.duration_h ?? 0;
      c.lastTs = Math.max(c.lastTs, r.start_ts);
      if (TIER_RANK[tier] > TIER_RANK[c.best]) c.best = tier;
      out.set(o, c);
    }
    return out;
  };

  const direct = contactsOf(mmsi, 1000, true);
  const directStat = staticFor([...direct.keys()]);
  let serviceHidden = 0;
  for (const m of [...direct.keys()]) {
    if (!sanc.has(m) && vesselRole(directStat.get(m)) === "service") {
      direct.delete(m);
      serviceHidden++;
    }
  }
  const ring1 = [...direct.entries()]
    .sort(
      (a, b) =>
        Number(sanc.has(b[0])) - Number(sanc.has(a[0])) ||
        TIER_RANK[b[1].best] - TIER_RANK[a[1].best] ||
        b[1].meetings - a[1].meetings ||
        b[1].lastTs - a[1].lastTs,
    )
    .slice(0, 10);

  // Second cercle : 3 contacts au plus par navire du premier cercle.
  const ring1Set = new Set(ring1.map(([m]) => m));
  const ring2: Array<{ mmsi: number; parent: number; stat: PairStat }> = [];
  const ring2Seen = new Set<number>();
  for (const [m] of ring1) {
    const cs = contactsOf(m, 300, false);
    for (const o of [...cs.keys()]) {
      if (o === mmsi || ring1Set.has(o) || ring2Seen.has(o)) cs.delete(o);
    }
    const cStat = staticFor([...cs.keys()]);
    for (const o of [...cs.keys()]) {
      if (!sanc.has(o) && vesselRole(cStat.get(o)) === "service") cs.delete(o);
    }
    const top = [...cs.entries()]
      .sort(
        (a, b) =>
          Number(sanc.has(b[0])) - Number(sanc.has(a[0])) ||
          TIER_RANK[b[1].best] - TIER_RANK[a[1].best] ||
          b[1].meetings - a[1].meetings,
      )
      .slice(0, 3);
    for (const [o, s] of top) {
      ring2Seen.add(o);
      ring2.push({ mmsi: o, parent: m, stat: s });
    }
  }

  const ports = raw
    .prepare(
      `SELECT port, COUNT(*) AS n, MAX(arrived_ts) AS last FROM voyages
       WHERE mmsi = ? AND arrived_ts IS NOT NULL AND arrived_ts >= ?
       GROUP BY port ORDER BY n DESC LIMIT 4`,
    )
    .all(mmsi, since) as unknown as Array<{ port: string; n: number; last: number }>;

  const allMmsi = [mmsi, ...ring1.map(([m]) => m), ...ring2.map((r) => r.mmsi)];
  const stat = staticFor(allMmsi);
  const vesselNode = (
    m: number,
    ring: 0 | 1 | 2,
    s: PairStat | null,
    parent?: number,
  ): NetNode => {
    const st = stat.get(m);
    const name = st?.name?.trim() || sanc.get(m)?.name || null;
    const flag = flagFromMmsi(m);
    return {
      id: `v${m}`,
      kind: ring === 0 ? "center" : "vessel",
      ring,
      parent: parent ? `v${parent}` : undefined,
      mmsi: m,
      label: name ?? `Unidentified${flag ? ` · ${flag.code}` : ""}`,
      identified: Boolean(name || st?.imo),
      sanctioned: sanc.has(m),
      lists: sanc.get(m)?.lists ?? [],
      cargoClass: st?.cargo_class ?? null,
      flagCode: flag?.code ?? null,
      weight: s?.meetings ?? 1,
      hours: s?.hours ?? 0,
      lastTs: s?.lastTs ?? 0,
      best: s?.best ?? null,
    };
  };

  const nodes: NetNode[] = [vesselNode(mmsi, 0, null)];
  const edges: NetEdge[] = [];
  for (const [m, s] of ring1) {
    nodes.push(vesselNode(m, 1, s));
    edges.push({
      from: `v${mmsi}`,
      to: `v${m}`,
      weight: s.meetings,
      kind: "sts",
      best: s.best,
      pair: [mmsi, m],
    });
  }
  for (const p of ports) {
    nodes.push({
      id: `p${p.port}`,
      kind: "port",
      ring: 1,
      portId: p.port,
      label: getPort(p.port)?.name ?? p.port,
      identified: true,
      sanctioned: false,
      lists: [],
      cargoClass: null,
      flagCode: null,
      weight: p.n,
      hours: 0,
      lastTs: p.last,
      best: null,
    });
    edges.push({ from: `v${mmsi}`, to: `p${p.port}`, weight: p.n, kind: "port", best: null });
  }
  for (const r of ring2) {
    nodes.push(vesselNode(r.mmsi, 2, r.stat, r.parent));
    edges.push({
      from: `v${r.parent}`,
      to: `v${r.mmsi}`,
      weight: r.stat.meetings,
      kind: "sts",
      best: r.stat.best,
      pair: [r.parent, r.mmsi],
    });
  }

  return {
    nodes,
    edges,
    hiddenContacts: Math.max(0, direct.size - ring1.length),
    serviceHidden,
    portHidden,
    twoStepListed: ring2.filter((r) => sanc.has(r.mmsi)).length,
  };
}

// ─── Preuve d'un rapprochement ──────────────────────────────────────────

export interface EncounterEvidence {
  id: number;
  a: number;
  b: number;
  startTs: number;
  endTs: number | null;
  durationH: number | null;
  medianDistanceM: number | null;
  lat: number;
  lon: number;
  place: Place;
  tier: ContactTier;
}

export interface PairEvidence {
  a: { mmsi: number; name: string | null; lists: string[]; cargoClass: string | null; flag: string | null };
  b: { mmsi: number; name: string | null; lists: string[]; cargoClass: string | null; flag: string | null };
  encounters: EncounterEvidence[];
  selected: EncounterEvidence | null;
  tracks: Array<{ mmsi: number; points: Array<[number, number, number]> }>;
}

/** Tous les rapprochements entre deux navires, et les traces du choisi. */
export function getPairEvidence(a: number, b: number, encId?: number): PairEvidence {
  const raw = db().raw;
  const sanc = sanctionedIndex();
  const rows = raw
    .prepare(
      `SELECT id, mmsi_a, mmsi_b, start_ts, end_ts, duration_h, median_distance_m,
              start_lat, start_lon
       FROM encounters
       WHERE (mmsi_a = ? AND mmsi_b = ?) OR (mmsi_a = ? AND mmsi_b = ?)
       ORDER BY start_ts DESC LIMIT 200`,
    )
    .all(a, b, b, a) as unknown as Array<{
    id: number;
    mmsi_a: number;
    mmsi_b: number;
    start_ts: number;
    end_ts: number | null;
    duration_h: number | null;
    median_distance_m: number | null;
    start_lat: number;
    start_lon: number;
  }>;
  const encounters: EncounterEvidence[] = rows.map((r) => ({
    id: r.id,
    a: r.mmsi_a,
    b: r.mmsi_b,
    startTs: r.start_ts,
    endTs: r.end_ts,
    durationH: r.duration_h,
    medianDistanceM: r.median_distance_m,
    lat: r.start_lat,
    lon: r.start_lon,
    place: placeFor(r.start_lat, r.start_lon),
    tier: contactTier(r.start_lat, r.start_lon, r.median_distance_m, r.duration_h),
  }));
  const selected =
    encounters.find((e) => e.id === encId) ??
    encounters.find((e) => e.tier !== "port") ??
    encounters[0] ??
    null;

  // Traces des deux navires autour du rapprochement (2 h avant, 2 h après).
  const tracks: PairEvidence["tracks"] = [];
  if (selected) {
    const t0 = selected.startTs - 2 * 3_600_000;
    const t1 = Math.min(
      (selected.endTs ?? selected.startTs + 6 * 3_600_000) + 2 * 3_600_000,
      t0 + 24 * 3_600_000,
    );
    const pts = raw
      .prepare(
        `SELECT mmsi, ts, lat, lon FROM positions
         WHERE ts BETWEEN ? AND ? AND mmsi IN (?, ?)
         ORDER BY ts ASC LIMIT 6000`,
      )
      .all(t0, t1, a, b) as unknown as Array<{
      mmsi: number;
      ts: number;
      lat: number;
      lon: number;
    }>;
    for (const m of [a, b]) {
      tracks.push({
        mmsi: m,
        points: pts.filter((p) => p.mmsi === m).map((p) => [p.lon, p.lat, p.ts]),
      });
    }
  }

  const stat = staticFor([a, b]);
  const who = (m: number) => {
    const st = stat.get(m);
    return {
      mmsi: m,
      name: st?.name?.trim() || sanc.get(m)?.name || null,
      lists: sanc.get(m)?.lists ?? [],
      cargoClass: st?.cargo_class ?? null,
      flag: flagFromMmsi(m)?.country ?? null,
    };
  };
  return { a: who(a), b: who(b), encounters, selected, tracks };
}

// ─── Exemples cliquables (tirés des données du moment) ──────────────────

export interface ScreenExample {
  label: string;
  q: string;
}

let _exCache: { ts: number; ex: ScreenExample[] } | null = null;

/**
 * Exemples pour le champ de vérification : un navire listé, un navire
 * « exposé » (non listé, rapproché en mer d'un listé), un navire sans
 * alerte, et une « flotte » qui mélange les trois. Tirés des données du
 * moment pour ne jamais pointer vers un cas périmé.
 */
export function screenExamples(
  stsEvents: Array<{ mmsi: number; other?: { mmsi: number; sanctioned: boolean } }>,
): ScreenExample[] {
  if (_exCache && Date.now() - _exCache.ts < 10 * 60_000) return _exCache.ex;
  const ex = computeExamples(stsEvents);
  _exCache = { ts: Date.now(), ex };
  return ex;
}

function computeExamples(
  stsEvents: Array<{ mmsi: number; other?: { mmsi: number; sanctioned: boolean } }>,
): ScreenExample[] {
  const sanc = sanctionedIndex();
  const stat = (m: number) => staticFor([m]).get(m);
  const ident = (m: number) => {
    const s = stat(m);
    return s?.imo ? String(s.imo) : String(m);
  };
  const nameOf = (m: number) => stat(m)?.name?.trim() || null;

  const listed: number[] = [];
  const exposed: number[] = [];
  for (const e of stsEvents) {
    if (!listed.includes(e.mmsi) && nameOf(e.mmsi)) listed.push(e.mmsi);
    if (
      e.other &&
      !e.other.sanctioned &&
      !exposed.includes(e.other.mmsi) &&
      nameOf(e.other.mmsi) &&
      vesselRole(stat(e.other.mmsi)) === "cargo"
    ) {
      exposed.push(e.other.mmsi);
    }
  }

  const clear: number[] = [];
  for (const p of ["rotterdam", "antwerp", "singapore", "houston"]) {
    for (const v of getVessels(p)) {
      if (clear.length >= 6) break;
      if (sanc.has(v.mmsi) || !v.name?.trim()) continue;
      if (!["crude", "product", "chemical", "lng", "lpg"].includes(v.cargoClass ?? "")) continue;
      if (sanctionedContacts(v.mmsi).length > 0) continue;
      clear.push(v.mmsi);
    }
  }

  const out: ScreenExample[] = [];
  if (listed[0]) out.push({ label: nameOf(listed[0])!, q: ident(listed[0]) });
  if (exposed[0]) out.push({ label: nameOf(exposed[0])!, q: ident(exposed[0]) });
  if (clear[0]) out.push({ label: nameOf(clear[0])!, q: ident(clear[0]) });
  const fleet = [
    ...clear.slice(1, 5),
    ...exposed.slice(0, 2),
    ...listed.slice(0, 2),
    ...clear.slice(5, 6),
  ];
  if (fleet.length >= 4) {
    out.push({ label: `A fleet of ${fleet.length}`, q: fleet.map(ident).join("\n") });
  }
  return out;
}
