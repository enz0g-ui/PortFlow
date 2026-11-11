import { db } from "./db";
import { findPortByPosition, getPort, PORTS } from "./ports";
import { findChokepoint, loadChokepointsSync } from "./chokepoint-detector";
import { getVessels } from "./store";
import { flagFromMmsi, type MidFlag } from "./mid";

/**
 * Briefing : vue « lecture rapide » orientée compliance.
 *
 * Point de départ = les navires présents sur une liste de sanctions
 * (OFAC, UK, ONU…). Pour chacun on remonte les signaux déjà calculés par
 * les détecteurs (rapprochements STS, coupures AIS, stationnement en mer,
 * passages de détroits). Les volumes bruts de ces détecteurs sont trop
 * élevés pour être lus tels quels ; filtrés sur les navires sanctionnés,
 * ils deviennent une liste courte et actionnable.
 *
 * Tout est lu en SQL borné (index existants) puis mis en cache 5 min.
 */

export type BriefWindow = "24h" | "7d" | "30d";
export type SignalKind = "sts" | "dark" | "loiter" | "transit";

export const WINDOW_MS: Record<BriefWindow, number> = {
  "24h": 86_400_000,
  "7d": 7 * 86_400_000,
  "30d": 30 * 86_400_000,
};

export const SIGNAL_LABEL: Record<SignalKind, string> = {
  sts: "Ship-to-ship",
  dark: "AIS gap",
  loiter: "Loitering at sea",
  transit: "Chokepoint transit",
};

const SIGNAL_SEVERITY: Record<SignalKind, number> = {
  sts: 3,
  dark: 3,
  loiter: 2,
  transit: 1,
};

// Poids pour classer les navires (usage interne, non publié).
const SIGNAL_WEIGHT: Record<SignalKind, number> = {
  sts: 5,
  dark: 4,
  loiter: 2,
  transit: 1,
};

export interface Place {
  label: string;
  portId?: string;
  lat?: number;
  lon?: number;
}

export interface SanctionInfo {
  lists: string[]; // libellés courts : OFAC, UK, UN, EU
  name: string | null;
  imo: number | null;
  flag: string | null;
}

export interface BriefEvent {
  key: string;
  kind: SignalKind;
  severity: number;
  ts: number;
  endTs: number | null;
  durationH: number | null;
  mmsi: number;
  name: string | null;
  sanctioned: boolean;
  other?: { mmsi: number; name: string | null; sanctioned: boolean };
  place: Place;
  /** Rapprochements uniquement. */
  tier?: ContactTier;
  encounterId?: number;
}

export interface ConcernVessel {
  mmsi: number;
  imo: number | null;
  name: string | null;
  flag: string | null;
  cargoClass: string | null;
  lists: string[];
  counts: Record<SignalKind, number>;
  score: number;
  lastSeen: { ts: number; place: Place } | null;
}

export interface Brief {
  window: BriefWindow;
  generatedAt: number;
  totals: {
    activeSanctioned: number;
    sts: number;
    transfers: number;
    /** Rapprochements au port / terminal, écartés. */
    portContacts: number;
    dark: number;
    loiter: number;
    transit: number;
    listedVessels: number;
    newListings30d: number;
  };
  vessels: ConcernVessel[];
  events: BriefEvent[];
}

// ─── Libellés de lieux ───────────────────────────────────────────────────

// Grandes zones maritimes, pour éviter « 59.9°N 28.6°E » quand le navire
// n'est ni dans un port suivi ni dans un détroit. Boîtes grossières,
// testées dans l'ordre (les plus petites d'abord).
const SEA_AREAS: Array<{ name: string; s: number; w: number; n: number; e: number }> = [
  { name: "Gulf of Finland", s: 59.2, w: 22.5, n: 60.8, e: 30.5 },
  { name: "Black Sea", s: 40.8, w: 27.3, n: 47.0, e: 42.0 },
  { name: "Sea of Azov", s: 45.2, w: 34.8, n: 47.3, e: 39.4 },
  { name: "Persian Gulf", s: 23.5, w: 47.5, n: 30.5, e: 56.5 },
  { name: "Gulf of Oman", s: 22.0, w: 56.5, n: 26.0, e: 61.5 },
  { name: "Red Sea", s: 12.5, w: 32.0, n: 30.0, e: 43.5 },
  { name: "Baltic Sea", s: 53.5, w: 9.5, n: 66.0, e: 30.5 },
  { name: "North Sea", s: 51.0, w: -4.0, n: 61.0, e: 9.5 },
  { name: "English Channel", s: 48.5, w: -6.0, n: 51.2, e: 2.0 },
  { name: "Mediterranean", s: 30.0, w: -5.6, n: 46.0, e: 36.5 },
  { name: "Barents Sea", s: 66.0, w: 15.0, n: 80.0, e: 60.0 },
  { name: "Norwegian Sea", s: 61.0, w: -5.0, n: 72.0, e: 15.0 },
  { name: "South China Sea", s: 0.0, w: 99.0, n: 23.0, e: 121.0 },
  { name: "East China Sea", s: 23.0, w: 117.0, n: 33.0, e: 131.0 },
  { name: "Gulf of Mexico", s: 18.0, w: -98.0, n: 31.0, e: -80.5 },
  { name: "Arabian Sea", s: 5.0, w: 50.0, n: 25.0, e: 77.0 },
  { name: "Bay of Biscay", s: 43.3, w: -10.0, n: 48.5, e: -1.0 },
];

function fmtCoord(lat: number, lon: number): string {
  const la = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}`;
  const lo = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? "E" : "W"}`;
  return `${la} ${lo}`;
}

// Terminaux non suivis comme « ports » mais où des navires s'amarrent
// côte à côte tous les jours (chargement, attente à quai). Un
// rapprochement ici n'est pas un transbordement en mer.
const TERMINAL_AREAS: Array<{ name: string; s: number; w: number; n: number; e: number }> = [
  { name: "Vysotsk terminal", s: 60.55, w: 28.4, n: 60.68, e: 28.7 },
  { name: "Primorsk terminal", s: 60.28, w: 28.52, n: 60.4, e: 28.8 },
  { name: "Ust-Luga port", s: 59.62, w: 28.18, n: 59.82, e: 28.5 },
  { name: "St Petersburg port", s: 59.83, w: 29.55, n: 60.05, e: 30.35 },
];

function inBox(
  lat: number,
  lon: number,
  b: { s: number; w: number; n: number; e: number },
): boolean {
  return lat >= b.s && lat <= b.n && lon >= b.w && lon <= b.e;
}

/** Nom du port ou terminal qui contient le point, sinon null. */
export function portAreaName(lat: number | null, lon: number | null): string | null {
  if (lat == null || lon == null) return null;
  const port = findPortByPosition(lat, lon);
  if (port) return port.name;
  return TERMINAL_AREAS.find((t) => inBox(lat, lon, t))?.name ?? null;
}

export function placeFor(lat: number | null, lon: number | null): Place {
  if (lat == null || lon == null) return { label: "Unknown position" };
  const port = findPortByPosition(lat, lon);
  if (port) return { label: port.name, portId: port.id, lat, lon };
  const term = TERMINAL_AREAS.find((t) => inBox(lat, lon, t));
  if (term) return { label: term.name, lat, lon };
  const cp = findChokepoint(lat, lon);
  if (cp) return { label: cp.name, lat, lon };
  for (const a of SEA_AREAS) {
    if (inBox(lat, lon, a)) {
      return { label: `${a.name} · ${fmtCoord(lat, lon)}`, lat, lon };
    }
  }
  return { label: `At sea · ${fmtCoord(lat, lon)}`, lat, lon };
}

// ─── Niveaux de rapprochement ───────────────────────────────────────────

/**
 * transfer : long et très proche, hors port — compatible avec un
 *            transbordement ;
 * contact  : rapprochement en mer plus court ou plus lâche, à vérifier ;
 * port     : dans un port ou un terminal — navires amarrés au même quai,
 *            pas un signal.
 * Seuils internes, volontairement non publiés.
 */
export type ContactTier = "transfer" | "contact" | "port";

export const TIER_LABEL: Record<ContactTier, string> = {
  transfer: "Probable transfer",
  contact: "Contact at sea",
  port: "Same port area",
};

export function contactTier(
  lat: number | null,
  lon: number | null,
  distM: number | null,
  durH: number | null,
): ContactTier {
  if (portAreaName(lat, lon)) return "port";
  if (distM != null && distM <= 150 && (durH ?? 0) >= 3) return "transfer";
  return "contact";
}

export const TIER_RANK: Record<ContactTier, number> = { transfer: 2, contact: 1, port: 0 };

function chokepointName(id: string | null): string | null {
  if (!id) return null;
  const cp = loadChokepointsSync().find((c) => c.id === id);
  return cp?.name ?? id;
}

// ─── Index des navires sanctionnés ──────────────────────────────────────

const LIST_LABEL: Record<string, string> = {
  ofac: "OFAC",
  uksl: "UK",
  un_sc: "UN",
  eu: "EU",
};

export function listLabel(source: string): string {
  return LIST_LABEL[source] ?? source.toUpperCase();
}

/**
 * MMSI → informations de sanction. Croise la table des listes avec les
 * identités AIS (static_ships) par IMO puis par MMSI.
 */
let _sancCache: { ts: number; idx: Map<number, SanctionInfo> } | null = null;

/** Index mis en cache 5 min (lecture ~100 ms, appelée à chaque page). */
export function sanctionedIndex(): Map<number, SanctionInfo> {
  if (_sancCache && Date.now() - _sancCache.ts < 5 * 60_000) return _sancCache.idx;
  const idx = computeSanctionedIndex();
  _sancCache = { ts: Date.now(), idx };
  return idx;
}

function computeSanctionedIndex(): Map<number, SanctionInfo> {
  const rows = db()
    .raw.prepare(
      `SELECT s.mmsi AS mmsi, v.source AS source, v.ship_name AS name,
              v.imo AS imo, v.flag AS flag
       FROM static_ships s
       JOIN sanctioned_vessels v
         ON v.delisted_at IS NULL
        AND ((s.imo IS NOT NULL AND v.imo = s.imo) OR v.mmsi = s.mmsi)
       UNION
       SELECT mmsi, source, ship_name, imo, flag
       FROM sanctioned_vessels
       WHERE mmsi IS NOT NULL AND delisted_at IS NULL`,
    )
    .all() as unknown as Array<{
    mmsi: number;
    source: string;
    name: string | null;
    imo: number | null;
    flag: string | null;
  }>;
  const out = new Map<number, SanctionInfo>();
  for (const r of rows) {
    const cur = out.get(r.mmsi);
    const label = listLabel(r.source);
    if (!cur) {
      out.set(r.mmsi, {
        lists: [label],
        name: r.name,
        imo: r.imo,
        flag: r.flag,
      });
    } else {
      if (!cur.lists.includes(label)) cur.lists.push(label);
      cur.name ??= r.name;
      cur.imo ??= r.imo;
      cur.flag ??= r.flag;
    }
  }
  for (const v of out.values()) v.lists.sort();
  return out;
}

export interface StaticRow {
  mmsi: number;
  name: string | null;
  imo: number | null;
  cargo_class: string | null;
  ship_type: number | null;
  length_m: number | null;
  draught: number | null;
  destination: string | null;
  callsign: string | null;
}

export function staticFor(mmsis: number[]): Map<number, StaticRow> {
  const out = new Map<number, StaticRow>();
  const uniq = [...new Set(mmsis)];
  for (let i = 0; i < uniq.length; i += 500) {
    const chunk = uniq.slice(i, i + 500);
    const rows = db()
      .raw.prepare(
        `SELECT mmsi, name, imo, cargo_class, ship_type, length_m, draught,
                destination, callsign
         FROM static_ships WHERE mmsi IN (${chunk.map(() => "?").join(",")})`,
      )
      .all(...chunk) as unknown as StaticRow[];
    for (const r of rows) out.set(r.mmsi, r);
  }
  return out;
}

// ─── Rôle du navire ─────────────────────────────────────────────────────

const CARGO_ROLES = new Set([
  "crude", "product", "chemical", "lng", "lpg",
  "container", "dry-bulk", "general-cargo", "ro-ro",
]);

/**
 * « cargo » : navire capable d'un transbordement ; « service » :
 * remorqueur, pilote, pêche, passagers, petite unité — ils côtoient tout le
 * monde au quotidien, leurs rapprochements ne disent rien de la conformité.
 */
export function vesselRole(
  st: Pick<StaticRow, "cargo_class" | "ship_type" | "length_m"> | null | undefined,
): "cargo" | "service" | "unknown" {
  if (!st) return "unknown";
  if (st.cargo_class && CARGO_ROLES.has(st.cargo_class)) return "cargo";
  const t = st.ship_type ?? 0;
  if (t >= 70 && t <= 89) return "cargo";
  if (st.cargo_class === "tug" || st.cargo_class === "fishing" || st.cargo_class === "passenger") {
    return "service";
  }
  if (t >= 30 && t <= 69) return "service";
  if (st.length_m != null && st.length_m > 0) return st.length_m >= 80 ? "cargo" : "service";
  return "unknown";
}

export function placeholders(n: number): string {
  return Array.from({ length: n }, () => "?").join(",");
}

// ─── Briefing ───────────────────────────────────────────────────────────

const CACHE_MS = 5 * 60_000;
const KEY = "__portflowBrief" as const;
type WithCache = typeof globalThis & {
  [KEY]?: Map<BriefWindow, Brief>;
};

function cache(): Map<BriefWindow, Brief> {
  const g = globalThis as WithCache;
  g[KEY] ??= new Map();
  return g[KEY]!;
}

/**
 * Toujours servi depuis le cache quand il existe : un cache périmé est
 * rendu tel quel et rafraîchi juste après, hors du chemin de la requête.
 * Seul le tout premier appel (avant le pré-calcul) attend le calcul.
 */
export function getBrief(window: BriefWindow): Brief {
  const hit = cache().get(window);
  if (hit) {
    if (Date.now() - hit.generatedAt >= CACHE_MS) scheduleRefresh(window);
    return hit;
  }
  return refresh(window);
}

const _pending = new Set<BriefWindow>();

function scheduleRefresh(window: BriefWindow): void {
  if (_pending.has(window)) return;
  _pending.add(window);
  setTimeout(() => {
    try {
      refresh(window);
    } catch (err) {
      console.error("[brief] refresh failed", err);
    } finally {
      _pending.delete(window);
    }
  }, 0);
}

function refresh(window: BriefWindow): Brief {
  const t0 = Date.now();
  const brief = computeBrief(window);
  cache().set(window, brief);
  const ms = Date.now() - t0;
  if (ms > 2000) console.log(`[brief] ${window} computed in ${ms} ms`);
  return brief;
}

/** Pré-calcul au démarrage puis toutes les 5 min, fenêtres espacées. */
export function startBriefWarmer(): void {
  const windows: BriefWindow[] = ["7d", "24h", "30d"];
  const run = () =>
    windows.forEach((w, i) =>
      setTimeout(() => {
        try {
          refresh(w);
        } catch (err) {
          console.error("[brief] warm failed", err);
        }
      }, i * 20_000),
    );
  setTimeout(run, 120_000);
  setInterval(run, CACHE_MS);
}

function computeBrief(window: BriefWindow): Brief {
  const now = Date.now();
  const since = now - WINDOW_MS[window];
  const sanc = sanctionedIndex();
  const sancMmsis = [...sanc.keys()];
  const raw = db().raw;

  const events: BriefEvent[] = [];

  // Rapprochements navire-à-navire impliquant un navire sanctionné.
  const enc = raw
    .prepare(
      `SELECT id, mmsi_a, mmsi_b, start_ts, end_ts, duration_h,
              chokepoint_id, start_lat, start_lon, median_distance_m,
              was_sanctioned_a, was_sanctioned_b
       FROM encounters
       WHERE start_ts >= ? AND (was_sanctioned_a = 1 OR was_sanctioned_b = 1)
       ORDER BY start_ts DESC LIMIT 1000`,
    )
    .all(since) as unknown as Array<{
    id: number;
    mmsi_a: number;
    mmsi_b: number;
    start_ts: number;
    end_ts: number | null;
    duration_h: number | null;
    chokepoint_id: string | null;
    start_lat: number;
    start_lon: number;
    median_distance_m: number | null;
    was_sanctioned_a: number;
    was_sanctioned_b: number;
  }>;
  const encStat = staticFor(enc.flatMap((r) => [r.mmsi_a, r.mmsi_b]));
  let portContacts = 0;
  for (const r of enc) {
    // Le navire « principal » est le sanctionné.
    const aFirst = r.was_sanctioned_a === 1 || sanc.has(r.mmsi_a);
    const main = aFirst ? r.mmsi_a : r.mmsi_b;
    const other = aFirst ? r.mmsi_b : r.mmsi_a;
    // Remorqueurs, pilotes… : contact de routine, pas un signal.
    if (!sanc.has(other) && vesselRole(encStat.get(other)) === "service") continue;
    const tier = contactTier(r.start_lat, r.start_lon, r.median_distance_m, r.duration_h);
    // Amarrés au même terminal : pas un signal.
    if (tier === "port") {
      portContacts++;
      continue;
    }
    const place = placeFor(r.start_lat, r.start_lon);
    events.push({
      key: `sts-${r.id}`,
      kind: "sts",
      tier,
      encounterId: r.id,
      severity: tier === "transfer" ? 4 : SIGNAL_SEVERITY.sts,
      ts: r.start_ts,
      endTs: r.end_ts,
      durationH: r.duration_h,
      mmsi: main,
      name: null,
      sanctioned: true,
      other: {
        mmsi: other,
        name: null,
        sanctioned:
          sanc.has(other) ||
          (aFirst ? r.was_sanctioned_b === 1 : r.was_sanctioned_a === 1),
      },
      place,
    });
  }

  // Coupures AIS de navires sanctionnés.
  if (sancMmsis.length > 0) {
    const dark = raw
      .prepare(
        `SELECT id, mmsi, start_ts, end_ts, duration_hours, start_lat, start_lon
         FROM dark_events
         WHERE start_ts >= ? AND mmsi IN (${placeholders(sancMmsis.length)})
         ORDER BY start_ts DESC LIMIT 1000`,
      )
      .all(since, ...sancMmsis) as unknown as Array<{
      id: number;
      mmsi: number;
      start_ts: number;
      end_ts: number | null;
      duration_hours: number | null;
      start_lat: number;
      start_lon: number;
    }>;
    for (const r of dark) {
      events.push({
        key: `dark-${r.id}`,
        kind: "dark",
        severity: SIGNAL_SEVERITY.dark,
        ts: r.start_ts,
        endTs: r.end_ts,
        durationH:
          r.duration_hours ??
          (r.end_ts ? null : (now - r.start_ts) / 3_600_000),
        mmsi: r.mmsi,
        name: null,
        sanctioned: true,
        place: placeFor(r.start_lat, r.start_lon),
      });
    }
  }

  // Stationnement prolongé en mer.
  const loit = raw
    .prepare(
      `SELECT id, mmsi, start_ts, end_ts, duration_h, start_lat, start_lon
       FROM loitering_events
       WHERE was_sanctioned = 1 AND start_ts >= ?
       ORDER BY start_ts DESC LIMIT 2000`,
    )
    .all(since) as unknown as Array<{
    id: number;
    mmsi: number;
    start_ts: number;
    end_ts: number | null;
    duration_h: number | null;
    start_lat: number;
    start_lon: number;
  }>;
  for (const r of loit) {
    events.push({
      key: `loiter-${r.id}`,
      kind: "loiter",
      severity: SIGNAL_SEVERITY.loiter,
      ts: r.start_ts,
      endTs: r.end_ts,
      durationH: r.duration_h,
      mmsi: r.mmsi,
      name: null,
      sanctioned: true,
      place: placeFor(r.start_lat, r.start_lon),
    });
  }

  // Passages de détroits.
  const tr = raw
    .prepare(
      `SELECT id, mmsi, chokepoint_id, entered_at, exited_at, entry_lat, entry_lon
       FROM chokepoint_transits
       WHERE entered_at >= ? AND was_sanctioned = 1
       ORDER BY entered_at DESC LIMIT 3000`,
    )
    .all(since) as unknown as Array<{
    id: number;
    mmsi: number;
    chokepoint_id: string;
    entered_at: number;
    exited_at: number | null;
    entry_lat: number;
    entry_lon: number;
  }>;
  for (const r of tr) {
    events.push({
      key: `transit-${r.id}`,
      kind: "transit",
      severity: SIGNAL_SEVERITY.transit,
      ts: r.entered_at,
      endTs: r.exited_at,
      durationH: r.exited_at ? (r.exited_at - r.entered_at) / 3_600_000 : null,
      mmsi: r.mmsi,
      name: null,
      sanctioned: true,
      place: { label: chokepointName(r.chokepoint_id) ?? "Chokepoint" },
    });
  }

  // Dernière position connue (24 h de positions = requête rapide).
  const lastSeen = new Map<number, { ts: number; lat: number; lon: number }>();
  if (sancMmsis.length > 0) {
    const rows = raw
      .prepare(
        `SELECT mmsi, MAX(ts) AS ts, lat, lon
         FROM positions
         WHERE ts >= ? AND mmsi IN (${placeholders(sancMmsis.length)})
         GROUP BY mmsi`,
      )
      .all(now - 86_400_000, ...sancMmsis) as unknown as Array<{
      mmsi: number;
      ts: number;
      lat: number;
      lon: number;
    }>;
    for (const r of rows) lastSeen.set(r.mmsi, r);
  }

  // Identités AIS (noms, type) pour tous les navires cités.
  const cited = new Set<number>();
  for (const e of events) {
    cited.add(e.mmsi);
    if (e.other) cited.add(e.other.mmsi);
  }
  for (const m of lastSeen.keys()) cited.add(m);
  const stat = staticFor([...cited]);
  const nameOf = (m: number) =>
    stat.get(m)?.name?.trim() || sanc.get(m)?.name || null;
  for (const e of events) {
    e.name = nameOf(e.mmsi);
    if (e.other) e.other.name = nameOf(e.other.mmsi);
  }

  // Agrégation par navire.
  const byVessel = new Map<number, ConcernVessel>();
  const ensure = (m: number): ConcernVessel => {
    let v = byVessel.get(m);
    if (!v) {
      const s = sanc.get(m);
      const st = stat.get(m);
      v = {
        mmsi: m,
        imo: st?.imo ?? s?.imo ?? null,
        name: nameOf(m),
        flag: s?.flag ?? null,
        cargoClass: st?.cargo_class ?? null,
        lists: s?.lists ?? ["Listed"],
        counts: { sts: 0, dark: 0, loiter: 0, transit: 0 },
        score: 0,
        lastSeen: null,
      };
      byVessel.set(m, v);
    }
    return v;
  };
  for (const e of events) {
    const v = ensure(e.mmsi);
    v.counts[e.kind]++;
    if (!v.lastSeen || e.ts > v.lastSeen.ts) {
      v.lastSeen = { ts: e.endTs ?? e.ts, place: e.place };
    }
    // L'autre navire d'un STS, s'il est lui-même sanctionné, compte aussi.
    if (e.other?.sanctioned) {
      const o = ensure(e.other.mmsi);
      o.counts.sts++;
    }
  }
  // Navires sanctionnés vus dans les dernières 24 h, même sans signal.
  for (const [m, p] of lastSeen) {
    const v = ensure(m);
    if (!v.lastSeen || p.ts >= v.lastSeen.ts) {
      v.lastSeen = { ts: p.ts, place: placeFor(p.lat, p.lon) };
    }
  }
  for (const v of byVessel.values()) {
    v.score =
      v.counts.sts * SIGNAL_WEIGHT.sts +
      v.counts.dark * SIGNAL_WEIGHT.dark +
      Math.min(v.counts.loiter, 10) * SIGNAL_WEIGHT.loiter +
      Math.min(v.counts.transit, 10) * SIGNAL_WEIGHT.transit +
      (lastSeen.has(v.mmsi) ? 1 : 0);
  }

  const vessels = [...byVessel.values()].sort(
    (a, b) =>
      b.score - a.score || (b.lastSeen?.ts ?? 0) - (a.lastSeen?.ts ?? 0),
  );
  events.sort((a, b) => b.ts - a.ts);

  const listed = raw
    .prepare(
      `SELECT COUNT(*) AS n,
              SUM(CASE WHEN first_seen_at >= ? THEN 1 ELSE 0 END) AS fresh
       FROM sanctioned_vessels WHERE delisted_at IS NULL`,
    )
    .get(now - WINDOW_MS["30d"]) as unknown as { n: number; fresh: number };

  const count = (k: SignalKind) => events.filter((e) => e.kind === k).length;

  return {
    window,
    generatedAt: now,
    totals: {
      activeSanctioned: byVessel.size,
      sts: count("sts"),
      transfers: events.filter((e) => e.tier === "transfer").length,
      portContacts,
      dark: count("dark"),
      loiter: count("loiter"),
      transit: count("transit"),
      listedVessels: listed.n,
      newListings30d: listed.fresh ?? 0,
    },
    vessels,
    events,
  };
}

// ─── Fiche navire ───────────────────────────────────────────────────────

export interface VesselSanction {
  list: string;
  regime: string | null;
  listedOn: number | null;
  reason: string | null;
  name: string | null;
}

export interface VesselCounterpart {
  mmsi: number;
  name: string | null;
  identified: boolean;
  sanctioned: boolean;
  lists: string[];
  cargoClass: string | null;
  meetings: number;
  totalHours: number;
  lastTs: number;
  best: ContactTier;
  lastEncounterId: number;
}

export interface VesselPortCall {
  portId: string;
  portName: string;
  calls: number;
  lastArrived: number | null;
}

export interface TimelineItem {
  key: string;
  kind: SignalKind | "port";
  ts: number;
  endTs: number | null;
  durationH: number | null;
  place: Place;
  other?: { mmsi: number; name: string | null; sanctioned: boolean };
  tier?: ContactTier;
  encounterId?: number;
}

/**
 * listed     : sur une liste
 * exposed    : identifié, capable de transborder, rapproché en mer d'un listé
 * clear      : identifié, rien de tel
 * service    : remorqueur / pilote / petite unité — non évalué
 * unassessed : identité incomplète (ni nom ni IMO, ou type inconnu)
 */
export type Exposure = "listed" | "exposed" | "clear" | "service" | "unassessed";

export interface VesselSheet {
  mmsi: number;
  name: string | null;
  imo: number | null;
  identified: boolean;
  callsign: string | null;
  flag: string | null;
  midFlag: MidFlag | null;
  cargoClass: string | null;
  lengthM: number | null;
  draught: number | null;
  destination: string | null;
  sanctions: VesselSanction[];
  lastSeen: { ts: number; place: Place; sog: number | null } | null;
  counts: {
    contacts: number;
    transfers: number;
    contactShips: number;
    dark: number;
    loiter: number;
    transit: number;
    port: number;
  };
  counterparts: VesselCounterpart[];
  listedContacts: VesselCounterpart[];
  portContacts: number;
  serviceContacts: number;
  ports: VesselPortCall[];
  timeline: TimelineItem[];
  windowDays: number;
  generatedAt: number;
  role: "cargo" | "service" | "unknown";
  exposure: Exposure;
}

export const WINDOW_DAYS = [30, 90, 180] as const;

export function getVesselSheet(mmsi: number, windowDays = 90): VesselSheet | null {
  const raw = db().raw;
  const since = Date.now() - windowDays * 86_400_000;
  const st = staticFor([mmsi]).get(mmsi) ?? null;

  const sancRows = raw
    .prepare(
      `SELECT source, ship_name, imo, flag, regime, listed_on, reason
       FROM sanctioned_vessels
       WHERE delisted_at IS NULL
         AND (mmsi = ? ${st?.imo ? "OR imo = ?" : ""})
       ORDER BY listed_on DESC`,
    )
    .all(...(st?.imo ? [mmsi, st.imo] : [mmsi])) as unknown as Array<{
    source: string;
    ship_name: string | null;
    imo: number | null;
    flag: string | null;
    regime: string | null;
    listed_on: number | null;
    reason: string | null;
  }>;

  const encAll = raw
    .prepare(
      `SELECT id, mmsi_a, mmsi_b, start_ts, end_ts, duration_h, start_lat,
              start_lon, median_distance_m, was_sanctioned_a, was_sanctioned_b
       FROM encounters
       WHERE (mmsi_a = ? OR mmsi_b = ?) AND start_ts >= ?
       ORDER BY start_ts DESC LIMIT 1000`,
    )
    .all(mmsi, mmsi, since) as unknown as Array<{
    id: number;
    mmsi_a: number;
    mmsi_b: number;
    start_ts: number;
    end_ts: number | null;
    duration_h: number | null;
    start_lat: number;
    start_lon: number;
    median_distance_m: number | null;
    was_sanctioned_a: number;
    was_sanctioned_b: number;
  }>;
  const dark = raw
    .prepare(
      `SELECT id, start_ts, end_ts, duration_hours, start_lat, start_lon
       FROM dark_events WHERE mmsi = ? AND start_ts >= ?
       ORDER BY start_ts DESC LIMIT 500`,
    )
    .all(mmsi, since) as unknown as Array<{
    id: number;
    start_ts: number;
    end_ts: number | null;
    duration_hours: number | null;
    start_lat: number;
    start_lon: number;
  }>;
  const loit = raw
    .prepare(
      `SELECT id, start_ts, end_ts, duration_h, start_lat, start_lon
       FROM loitering_events WHERE mmsi = ? AND start_ts >= ?
       ORDER BY start_ts DESC LIMIT 1000`,
    )
    .all(mmsi, since) as unknown as Array<{
    id: number;
    start_ts: number;
    end_ts: number | null;
    duration_h: number | null;
    start_lat: number;
    start_lon: number;
  }>;
  const tr = raw
    .prepare(
      `SELECT id, chokepoint_id, entered_at, exited_at, entry_lat, entry_lon
       FROM chokepoint_transits WHERE mmsi = ? AND entered_at >= ?
       ORDER BY entered_at DESC LIMIT 1000`,
    )
    .all(mmsi, since) as unknown as Array<{
    id: number;
    chokepoint_id: string;
    entered_at: number;
    exited_at: number | null;
    entry_lat: number;
    entry_lon: number;
  }>;
  const voy = raw
    .prepare(
      `SELECT voyage_id, port, start_ts, arrived_ts, departed_ts
       FROM voyages WHERE mmsi = ? AND start_ts >= ?
       ORDER BY start_ts DESC LIMIT 300`,
    )
    .all(mmsi, since) as unknown as Array<{
    voyage_id: string;
    port: string;
    start_ts: number;
    arrived_ts: number | null;
    departed_ts: number | null;
  }>;

  // MMSI inconnu de partout.
  if (
    !st &&
    sancRows.length === 0 &&
    encAll.length + dark.length + loit.length + tr.length + voy.length === 0
  ) {
    return null;
  }

  const sanc = sanctionedIndex();
  const otherOf = (r: { mmsi_a: number; mmsi_b: number }) =>
    r.mmsi_a === mmsi ? r.mmsi_b : r.mmsi_a;
  const otherStat = staticFor(encAll.map(otherOf));
  const otherName = (m: number) =>
    otherStat.get(m)?.name?.trim() || sanc.get(m)?.name || null;

  const timeline: TimelineItem[] = [];
  const counterparts = new Map<number, VesselCounterpart>();
  let serviceContacts = 0;
  let portContacts = 0;
  let contacts = 0;
  let transfers = 0;
  const serviceSeen = new Set<number>();

  for (const r of encAll) {
    const o = otherOf(r);
    const isA = r.mmsi_a === mmsi;
    const oSanc =
      sanc.has(o) || (isA ? r.was_sanctioned_b === 1 : r.was_sanctioned_a === 1);
    const oSt = otherStat.get(o);
    // Remorqueurs, pilotes… : routine, écartés.
    if (!oSanc && vesselRole(oSt) === "service") {
      if (!serviceSeen.has(o)) {
        serviceSeen.add(o);
        serviceContacts++;
      }
      continue;
    }
    const tier = contactTier(r.start_lat, r.start_lon, r.median_distance_m, r.duration_h);
    timeline.push({
      key: `sts-${r.id}`,
      kind: "sts",
      ts: r.start_ts,
      endTs: r.end_ts,
      durationH: r.duration_h,
      place: placeFor(r.start_lat, r.start_lon),
      other: { mmsi: o, name: otherName(o), sanctioned: oSanc },
      tier,
      encounterId: r.id,
    });
    if (tier === "port") {
      portContacts++;
      continue;
    }
    contacts++;
    if (tier === "transfer") transfers++;
    const c = counterparts.get(o) ?? {
      mmsi: o,
      name: otherName(o),
      identified: Boolean(oSt?.name?.trim() || oSt?.imo || sanc.get(o)?.name),
      sanctioned: oSanc,
      lists: sanc.get(o)?.lists ?? (oSanc ? ["Listed"] : []),
      cargoClass: oSt?.cargo_class ?? null,
      meetings: 0,
      totalHours: 0,
      lastTs: 0,
      best: tier,
      lastEncounterId: r.id,
    };
    c.meetings++;
    c.totalHours += r.duration_h ?? 0;
    if (r.start_ts > c.lastTs) {
      c.lastTs = r.start_ts;
      c.lastEncounterId = r.id;
    }
    if (TIER_RANK[tier] > TIER_RANK[c.best]) c.best = tier;
    counterparts.set(o, c);
  }
  for (const r of dark) {
    timeline.push({
      key: `dark-${r.id}`,
      kind: "dark",
      ts: r.start_ts,
      endTs: r.end_ts,
      durationH: r.duration_hours,
      place: placeFor(r.start_lat, r.start_lon),
    });
  }
  for (const r of loit) {
    timeline.push({
      key: `loiter-${r.id}`,
      kind: "loiter",
      ts: r.start_ts,
      endTs: r.end_ts,
      durationH: r.duration_h,
      place: placeFor(r.start_lat, r.start_lon),
    });
  }
  for (const r of tr) {
    const name = chokepointName(r.chokepoint_id) ?? "Chokepoint";
    timeline.push({
      key: `transit-${r.id}`,
      kind: "transit",
      ts: r.entered_at,
      endTs: r.exited_at,
      durationH: r.exited_at ? (r.exited_at - r.entered_at) / 3_600_000 : null,
      place: { label: name, lat: r.entry_lat, lon: r.entry_lon },
    });
  }
  const portCalls = new Map<string, VesselPortCall>();
  for (const r of voy) {
    const p = getPort(r.port);
    if (r.arrived_ts) {
      timeline.push({
        key: `port-${r.voyage_id}`,
        kind: "port",
        ts: r.arrived_ts,
        endTs: r.departed_ts,
        durationH: r.departed_ts ? (r.departed_ts - r.arrived_ts) / 3_600_000 : null,
        place: { label: p?.name ?? r.port, portId: r.port },
      });
    }
    const c = portCalls.get(r.port) ?? {
      portId: r.port,
      portName: p?.name ?? r.port,
      calls: 0,
      lastArrived: null,
    };
    if (r.arrived_ts) {
      c.calls++;
      c.lastArrived = Math.max(c.lastArrived ?? 0, r.arrived_ts);
    }
    portCalls.set(r.port, c);
  }
  timeline.sort((a, b) => b.ts - a.ts);

  // Dernière position : mémoire live, puis 6 h de positions, puis dernier
  // événement daté.
  let lastSeen: VesselSheet["lastSeen"] = null;
  for (const p of PORTS) {
    const v = getVessels(p.id).find((x) => x.mmsi === mmsi);
    if (v && (!lastSeen || v.lastUpdate > lastSeen.ts)) {
      lastSeen = { ts: v.lastUpdate, place: placeFor(v.latitude, v.longitude), sog: v.sog };
    }
  }
  if (!lastSeen) {
    const pos = raw
      .prepare(
        `SELECT ts, lat, lon, sog FROM positions
         WHERE mmsi = ? AND ts >= ? ORDER BY ts DESC LIMIT 1`,
      )
      .get(mmsi, Date.now() - 6 * 3_600_000) as unknown as
      | { ts: number; lat: number; lon: number; sog: number | null }
      | undefined;
    if (pos) lastSeen = { ts: pos.ts, place: placeFor(pos.lat, pos.lon), sog: pos.sog };
  }
  if (!lastSeen && timeline.length > 0) {
    const t = timeline[0];
    lastSeen = { ts: t.endTs ?? t.ts, place: t.place, sog: null };
  }

  const first = sancRows[0];
  const name = st?.name?.trim() || first?.ship_name || null;
  const imo = st?.imo ?? first?.imo ?? null;
  const identified = Boolean(name || imo);
  const role = vesselRole(st);
  const cps = [...counterparts.values()].sort(
    (a, b) =>
      Number(b.sanctioned) - Number(a.sanctioned) ||
      TIER_RANK[b.best] - TIER_RANK[a.best] ||
      b.lastTs - a.lastTs,
  );
  const listedContacts = cps.filter((c) => c.sanctioned);

  const exposure: Exposure =
    sancRows.length > 0
      ? "listed"
      : role === "service"
        ? "service"
        : !identified || role === "unknown"
          ? "unassessed"
          : listedContacts.length > 0
            ? "exposed"
            : "clear";

  return {
    mmsi,
    name,
    imo,
    identified,
    callsign: st?.callsign ?? null,
    flag: sancRows.find((r) => r.flag)?.flag ?? null,
    midFlag: flagFromMmsi(mmsi),
    cargoClass: st?.cargo_class ?? null,
    lengthM: st?.length_m ?? null,
    draught: st?.draught ?? null,
    destination: st?.destination?.trim() || null,
    sanctions: sancRows.map((r) => ({
      list: listLabel(r.source),
      regime: r.regime,
      listedOn: r.listed_on,
      reason: r.reason,
      name: r.ship_name,
    })),
    lastSeen,
    counts: {
      contacts,
      transfers,
      contactShips: counterparts.size,
      dark: dark.length,
      loiter: loit.length,
      transit: tr.length,
      port: [...portCalls.values()].reduce((s, c) => s + c.calls, 0),
    },
    counterparts: cps,
    listedContacts,
    portContacts,
    serviceContacts,
    ports: [...portCalls.values()]
      .filter((c) => c.calls > 0)
      .sort((a, b) => (b.lastArrived ?? 0) - (a.lastArrived ?? 0)),
    timeline,
    windowDays,
    generatedAt: Date.now(),
    role,
    exposure,
  };
}

// ─── Phrase de conclusion ───────────────────────────────────────────────

function d2(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}`;
}

function hrs(h: number): string {
  return h < 10 ? `${h.toFixed(1)} h` : `${Math.round(h)} h`;
}

function listedWith(c: VesselCounterpart): string {
  return `${c.name ?? `MMSI ${c.mmsi}`} (${c.lists.join("/")} list)`;
}

/**
 * Une phrase qui dit l'essentiel, à copier dans un dossier. N'affirme que
 * ce que les données montrent.
 */
export function summarize(v: VesselSheet, twoStepListed = 0): string {
  const parts: string[] = [];

  if (v.exposure === "listed") {
    const lists = [...new Set(v.sanctions.map((s) => s.list))].join(", ");
    const since = v.sanctions
      .map((s) => s.listedOn)
      .filter((x): x is number => x != null)
      .sort((a, b) => a - b)[0];
    parts.push(
      `On the ${lists} sanctions list${v.sanctions.length > 1 ? "s" : ""}${since ? ` since ${new Date(since).getUTCFullYear()}` : ""}.`,
    );
  } else if (v.exposure === "unassessed") {
    parts.push(
      `Unidentified vessel: no name or IMO broadcast${v.midFlag ? `; transponder registered to ${v.midFlag.country}` : ""}. Exposure not assessed.`,
    );
  } else if (v.exposure === "service") {
    parts.push(
      "Not listed. Harbour or service craft: routine contacts with other ships are not scored.",
    );
  } else {
    parts.push("Not listed.");
  }

  const lc = v.listedContacts;
  if (lc.length > 0) {
    const top = lc[0];
    const kind = top.best === "transfer" ? "Probable transfer" : "Contact at sea";
    parts.push(
      `${kind} with ${listedWith(top)}: ${hrs(top.totalHours)} side by side, last on ${d2(top.lastTs)}.`,
    );
    if (lc.length > 1) {
      parts.push(
        `Also met ${lc.length - 1} other listed ship${lc.length > 2 ? "s" : ""} at sea (${lc
          .slice(1, 3)
          .map((c) => c.name ?? `MMSI ${c.mmsi}`)
          .join(", ")}${lc.length > 3 ? "…" : ""}).`,
      );
    }
  } else if (v.exposure === "clear") {
    parts.push(`No contact at sea with a listed ship in the last ${v.windowDays} days.`);
  }
  if (v.exposure === "listed" && v.counts.contacts > 0 && lc.length === 0) {
    parts.push(
      `${v.counts.contacts} contact${v.counts.contacts > 1 ? "s" : ""} at sea with ${v.counts.contactShips} ship${v.counts.contactShips > 1 ? "s" : ""}${v.counts.transfers > 0 ? `, incl. ${v.counts.transfers} probable transfer${v.counts.transfers > 1 ? "s" : ""}` : ""}.`,
    );
  }
  if (twoStepListed > 0 && v.exposure !== "listed") {
    parts.push(
      `${twoStepListed} more listed ship${twoStepListed > 1 ? "s" : ""} two steps away.`,
    );
  }
  if (v.counts.dark > 0) {
    parts.push(`${v.counts.dark} AIS gap${v.counts.dark > 1 ? "s" : ""} while underway.`);
  }
  if (v.lastSeen) {
    parts.push(`Last seen ${v.lastSeen.place.label.split(" · ")[0]} on ${d2(v.lastSeen.ts)}.`);
  }
  return parts.join(" ");
}
