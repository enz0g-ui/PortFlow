import { getCurrentUser } from "@/lib/auth/session";
import { db, type VoyageRow } from "@/lib/db";
import { getPort } from "@/lib/ports";
import { vesselWatchlistMmsis } from "@/lib/watchlist";
import { listPortWatchlist } from "@/lib/port-watchlist";
import { computeKpiSnapshot } from "@/lib/kpi";
import { checkSanctions } from "@/lib/sanctions";
import { labelChokepoint } from "@/lib/news/signals";
import { meta } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * One aggregated call for the mobile glance view (/m): watchlist fleet sorted
 * by ETA imminence + a 7-day event feed for those vessels + bookmarked-port
 * congestion — so the phone renders the whole screen from a single fetch
 * (usable on 3G, sub-second with the client-side cache).
 */

const FEED_WINDOW_MS = 7 * 24 * 3_600_000;
const FEED_LIMIT = 30;

interface GlanceVessel {
  mmsi: number;
  name: string;
  cargoClass: string | null;
  state: string | null;
  sog: number | null;
  positionTs: number | null;
  destPortId: string | null;
  destPortName: string | null;
  destFlag: string | null;
  predictedEta: number | null;
  distanceNm: number | null;
  atPortName: string | null;
  sanctioned: boolean;
}

interface GlanceAlert {
  ts: number;
  kind:
    | "arrival"
    | "departure"
    | "inbound"
    | "dark"
    | "loitering"
    | "chokepoint"
    | "sanctions";
  title: string;
  sub: string;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const mmsis = vesselWatchlistMmsis(user.id);
  const since = Date.now() - FEED_WINDOW_MS;

  // --- Fleet ---
  const names = new Map<number, string>();
  const fleet: GlanceVessel[] = mmsis.map((mmsi) => {
    const stat = db()
      .raw.prepare(
        `SELECT name, cargo_class FROM static_ships WHERE mmsi = ?`,
      )
      .get(mmsi) as { name?: string | null; cargo_class?: string | null } | undefined;
    const pos = db()
      .raw.prepare(
        `SELECT ts, lat, lon, sog, state FROM positions WHERE mmsi = ? ORDER BY ts DESC LIMIT 1`,
      )
      .get(mmsi) as
      | { ts: number; lat: number; lon: number; sog: number; state: string | null }
      | undefined;
    const open = db()
      .raw.prepare(
        `SELECT * FROM voyages WHERE mmsi = ? AND arrived_ts IS NULL ORDER BY start_ts DESC LIMIT 1`,
      )
      .get(mmsi) as VoyageRow | undefined;
    const atPort = db()
      .raw.prepare(
        `SELECT * FROM voyages WHERE mmsi = ? AND arrived_ts IS NOT NULL AND departed_ts IS NULL ORDER BY arrived_ts DESC LIMIT 1`,
      )
      .get(mmsi) as VoyageRow | undefined;

    const name = stat?.name ?? `MMSI ${mmsi}`;
    names.set(mmsi, name);
    const destPort = open ? getPort(open.port) : undefined;
    return {
      mmsi,
      name,
      cargoClass: stat?.cargo_class ?? null,
      state: pos?.state ?? null,
      sog: pos?.sog ?? null,
      positionTs: pos?.ts ?? null,
      destPortId: open?.port ?? null,
      destPortName: destPort?.name ?? open?.port ?? null,
      destFlag: destPort?.flag ?? null,
      predictedEta: open?.predicted_eta ?? null,
      distanceNm: open?.start_distance_nm ?? null,
      atPortName: atPort ? (getPort(atPort.port)?.name ?? atPort.port) : null,
      sanctioned: checkSanctions({ mmsi }).length > 0,
    };
  });
  // Soonest ETA first; vessels without an ETA go last (at-port, then idle).
  fleet.sort((a, b) => {
    const ea = a.predictedEta ?? Infinity;
    const eb = b.predictedEta ?? Infinity;
    if (ea !== eb) return ea - eb;
    return a.name.localeCompare(b.name);
  });

  // --- Alerts feed (our own detectors only, watchlist-scoped, 7 days) ---
  const alerts: GlanceAlert[] = [];
  if (mmsis.length > 0) {
    const ph = mmsis.map(() => "?").join(",");
    const vname = (m: number) => names.get(m) ?? `MMSI ${m}`;

    const arrivals = db()
      .raw.prepare(
        `SELECT mmsi, port, arrived_ts FROM voyages
         WHERE mmsi IN (${ph}) AND arrived_ts >= ? ORDER BY arrived_ts DESC LIMIT 20`,
      )
      .all(...mmsis, since) as Array<{ mmsi: number; port: string; arrived_ts: number }>;
    for (const a of arrivals) {
      alerts.push({
        ts: a.arrived_ts,
        kind: "arrival",
        title: `${vname(a.mmsi)} arrived at ${getPort(a.port)?.name ?? a.port}`,
        sub: "voyage closed",
      });
    }

    const departures = db()
      .raw.prepare(
        `SELECT mmsi, port, departed_ts FROM voyages
         WHERE mmsi IN (${ph}) AND departed_ts >= ? ORDER BY departed_ts DESC LIMIT 20`,
      )
      .all(...mmsis, since) as Array<{ mmsi: number; port: string; departed_ts: number }>;
    for (const d of departures) {
      alerts.push({
        ts: d.departed_ts,
        kind: "departure",
        title: `${vname(d.mmsi)} departed ${getPort(d.port)?.name ?? d.port}`,
        sub: "departure detected",
      });
    }

    const inbound = db()
      .raw.prepare(
        `SELECT mmsi, port, start_ts FROM voyages
         WHERE mmsi IN (${ph}) AND start_ts >= ? AND arrived_ts IS NULL
         ORDER BY start_ts DESC LIMIT 20`,
      )
      .all(...mmsis, since) as Array<{ mmsi: number; port: string; start_ts: number }>;
    for (const v of inbound) {
      alerts.push({
        ts: v.start_ts,
        kind: "inbound",
        title: `${vname(v.mmsi)} inbound to ${getPort(v.port)?.name ?? v.port}`,
        sub: "new voyage opened",
      });
    }

    const dark = db()
      .raw.prepare(
        `SELECT mmsi, start_ts, duration_hours, start_zone, start_port FROM dark_events
         WHERE mmsi IN (${ph}) AND start_ts >= ? ORDER BY start_ts DESC LIMIT 20`,
      )
      .all(...mmsis, since) as Array<{
      mmsi: number; start_ts: number; duration_hours: number | null;
      start_zone: string | null; start_port: string | null;
    }>;
    for (const e of dark) {
      const where = e.start_port
        ? (getPort(e.start_port)?.name ?? e.start_port)
        : (e.start_zone ?? "monitored waters");
      alerts.push({
        ts: e.start_ts,
        kind: "dark",
        title: `AIS gap ${e.duration_hours ? `${e.duration_hours.toFixed(0)}h ` : ""}— ${vname(e.mmsi)}`,
        sub: where,
      });
    }

    const loiter = db()
      .raw.prepare(
        `SELECT mmsi, start_ts, duration_h FROM loitering_events
         WHERE mmsi IN (${ph}) AND start_ts >= ? ORDER BY start_ts DESC LIMIT 20`,
      )
      .all(...mmsis, since) as Array<{ mmsi: number; start_ts: number; duration_h: number | null }>;
    for (const e of loiter) {
      alerts.push({
        ts: e.start_ts,
        kind: "loitering",
        title: `${vname(e.mmsi)} loitering${e.duration_h ? ` (${e.duration_h.toFixed(0)}h)` : ""}`,
        sub: "SOG < 2 kn away from port",
      });
    }

    const transits = db()
      .raw.prepare(
        `SELECT mmsi, chokepoint_id, entered_at FROM chokepoint_transits
         WHERE mmsi IN (${ph}) AND entered_at >= ? ORDER BY entered_at DESC LIMIT 20`,
      )
      .all(...mmsis, since) as Array<{ mmsi: number; chokepoint_id: string; entered_at: number }>;
    for (const t of transits) {
      alerts.push({
        ts: t.entered_at,
        kind: "chokepoint",
        title: `${vname(t.mmsi)} transiting ${labelChokepoint(t.chokepoint_id)}`,
        sub: "chokepoint",
      });
    }

    for (const v of fleet) {
      if (!v.sanctioned) continue;
      alerts.push({
        ts: Date.now(),
        kind: "sanctions",
        title: `${v.name} appears on a sanctions list`,
        sub: "UKSL/OFAC screening — review exposure",
      });
    }

    alerts.sort((a, b) => b.ts - a.ts);
    alerts.splice(FEED_LIMIT);
  }

  // --- Bookmarked ports congestion ---
  const ports = listPortWatchlist(user.id)
    .map((id) => {
      const p = getPort(id);
      if (!p) return null;
      try {
        const k = computeKpiSnapshot(id);
        return {
          id,
          name: p.name,
          flag: p.flag ?? "",
          anchored: k.anchored,
          total: k.totalVessels,
          pct: k.totalVessels > 0 ? Math.round((k.anchored / k.totalVessels) * 100) : 0,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const worker = meta.status() as { lastMessageAt?: number };
  const aisAgoSec = worker.lastMessageAt
    ? Math.round((Date.now() - worker.lastMessageAt) / 1000)
    : null;

  return Response.json({
    ts: Date.now(),
    isDemo: user.isDemo ?? false,
    aisAgoSec,
    fleet,
    alerts,
    ports,
  });
}
