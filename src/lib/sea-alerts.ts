import { db } from "./db";
import { fireVesselEvent } from "./alerts";
import {
  contactTier,
  placeFor,
  sanctionedIndex,
  staticFor,
  TIER_LABEL,
  vesselRole,
} from "./brief";
import { log } from "./log";

/**
 * Alertes « contact en mer » et « coupure AIS ».
 *
 * Toutes les 10 min, relit les rencontres et coupures AIS détectées depuis
 * 6 h et déclenche les alertes des utilisateurs :
 *  - alerte « watchlist » : tout contact en mer / coupure d'un navire suivi ;
 *  - alerte « tous navires » : seulement si un navire listé est en jeu.
 * Les contacts au port / terminal et ceux des remorqueurs et pilotes sont
 * écartés, comme sur la fiche navire. Déduplication par événement
 * (table alert_event_fired), donc relire 6 h ne renvoie rien deux fois.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://portflow.uk";
const LOOKBACK_MS = 6 * 3_600_000;
let started = false;

async function scanOnce(): Promise<{ contacts: number; gaps: number }> {
  const raw = db().raw;
  const since = Date.now() - LOOKBACK_MS;
  const sanc = sanctionedIndex();
  let contacts = 0;
  let gaps = 0;

  const enc = raw
    .prepare(
      `SELECT id, mmsi_a, mmsi_b, start_ts, duration_h, median_distance_m, start_lat, start_lon
       FROM encounters WHERE detected_at >= ? ORDER BY detected_at ASC LIMIT 500`,
    )
    .all(since) as unknown as Array<{
    id: number;
    mmsi_a: number;
    mmsi_b: number;
    start_ts: number;
    duration_h: number | null;
    median_distance_m: number | null;
    start_lat: number;
    start_lon: number;
  }>;
  const stat = staticFor(enc.flatMap((e) => [e.mmsi_a, e.mmsi_b]));
  for (const e of enc) {
    const tier = contactTier(e.start_lat, e.start_lon, e.median_distance_m ?? 9_999, e.duration_h ?? 0);
    if (tier === "port") continue;
    const sa = stat.get(e.mmsi_a);
    const sb = stat.get(e.mmsi_b);
    if (vesselRole(sa ?? null) === "service" || vesselRole(sb ?? null) === "service") continue;
    const place = placeFor(e.start_lat, e.start_lon);
    for (const [self, other, so] of [
      [e.mmsi_a, e.mmsi_b, sb],
      [e.mmsi_b, e.mmsi_a, sa],
    ] as const) {
      const ss = self === e.mmsi_a ? sa : sb;
      const oListed = sanc.get(other);
      const oName = so?.name?.trim() || oListed?.name || `MMSI ${other}`;
      const detail = `${TIER_LABEL[tier].toLowerCase()} with ${oName}${oListed ? ` (${oListed.lists.join("/")} list)` : ""}`;
      contacts += await fireVesselEvent(
        "vessel.sea_contact",
        {
          mmsi: self,
          vesselName: ss?.name?.trim() || sanc.get(self)?.name || `MMSI ${self}`,
          port: "",
          portName: place.label,
          cargoClass: ss?.cargo_class ?? null,
          ts: e.start_ts,
          detail,
          ref: `enc-${e.id}-${self}`,
          link: `${SITE}/brief/contact/${self}/${other}?e=${e.id}`,
        },
        { broad: Boolean(oListed) },
      );
    }
  }

  const dark = raw
    .prepare(
      `SELECT id, mmsi, start_ts, start_lat, start_lon, duration_hours
       FROM dark_events WHERE detected_at >= ? ORDER BY detected_at ASC LIMIT 500`,
    )
    .all(since) as unknown as Array<{
    id: number;
    mmsi: number;
    start_ts: number;
    start_lat: number;
    start_lon: number;
    duration_hours: number | null;
  }>;
  const dstat = staticFor(dark.map((d) => d.mmsi));
  for (const d of dark) {
    // Une coupure au port ou au terminal n'est pas un signal.
    if (contactTier(d.start_lat, d.start_lon, 9_999, 0) === "port") continue;
    const st = dstat.get(d.mmsi);
    if (vesselRole(st ?? null) === "service") continue;
    const listed = sanc.get(d.mmsi);
    gaps += await fireVesselEvent(
      "vessel.ais_gap",
      {
        mmsi: d.mmsi,
        vesselName: st?.name?.trim() || listed?.name || `MMSI ${d.mmsi}`,
        port: "",
        portName: placeFor(d.start_lat, d.start_lon).label,
        cargoClass: st?.cargo_class ?? null,
        ts: d.start_ts,
        detail: listed ? `${listed.lists.join("/")} listed` : undefined,
        ref: `dark-${d.id}`,
        link: `${SITE}/brief/vessel/${d.mmsi}`,
      },
      { broad: Boolean(listed) },
    );
  }
  return { contacts, gaps };
}

export function startSeaAlerts(intervalMs = 10 * 60_000): void {
  if (started) return;
  started = true;
  const tick = async () => {
    try {
      const r = await scanOnce();
      if (r.contacts || r.gaps) log.info("sea-alerts fired", r);
    } catch (err) {
      log.warn("sea-alerts scan failed", { error: (err as Error).message });
    }
  };
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), intervalMs).unref?.();
  }, 3 * 60_000).unref?.();
}
