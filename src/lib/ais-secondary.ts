import { processPosition } from "./ais-worker";
import { meta } from "./store";

/**
 * Sources AIS secondaires (redondance du flux primaire aisstream.io).
 *
 * Architecture (doc « Sources AIS secondaires pour le failover », 08/2026) :
 * cascade primaire → secondaires gouvernementaux open-data. Les secondaires
 * tournent EN PERMANENCE (pas seulement en failover) : le chemin de code est
 * exercé en continu, la priorité au primaire est assurée par la règle de
 * fraîcheur dans processPosition, et chaque enregistrement porte sa
 * provenance (`positions.source`).
 *
 * - BarentsWatch (Norvège) — licence NLOD, usage commercial autorisé avec
 *   attribution visible « data via BarentsWatch ». OAuth2 client_credentials,
 *   scope `ais` (client de type AIS-client sur barentswatch.no/minside).
 *   Couvre la ZEE norvégienne → notre chokepoint cp_skagerrak.
 *   Dormant tant que BARENTSWATCH_CLIENT_ID / BARENTSWATCH_CLIENT_SECRET
 *   ne sont pas définis.
 *
 * - Digitraffic / Fintraffic (Finlande) — licence CC BY 4.0, usage commercial
 *   autorisé avec attribution « Fintraffic / digitraffic.fi ». Sans
 *   authentification (en-tête Digitraffic-User recommandé). Couvre le golfe
 *   de Finlande (Primorsk / Ust-Luga…). NB : les navires de pêche (type 30)
 *   sont filtrés côté source.
 *
 * Les positions hors de nos zones (ports + chokepoints) sont éliminées par
 * processPosition — le poll récupère la couverture entière de chaque source
 * mais n'ingère que ce qui nous concerne.
 */

const POLL_MS = 60_000;
const FETCH_TIMEOUT_MS = 30_000;

export interface SecondarySourceStatus {
  configured: boolean;
  lastPollAt: number | null;
  lastCount: number | null;
  lastIngested: number | null;
  lastError: string | null;
}

// Singleton via globalThis (même pattern que db.ts) : en Next.js, les routes
// API et l'instrumentation peuvent charger des instances séparées de ce
// module — un état module-local n'y serait pas partagé et /api/status
// afficherait des null alors que les pollers tournent.
const STATUS_KEY = Symbol.for("portflow.aisSecondaryStatus");
type WithStatus = typeof globalThis & {
  [STATUS_KEY]?: Record<"barentswatch" | "digitraffic", SecondarySourceStatus>;
};

function statusStore() {
  const g = globalThis as WithStatus;
  if (!g[STATUS_KEY]) {
    g[STATUS_KEY] = {
      barentswatch: {
        configured: false,
        lastPollAt: null,
        lastCount: null,
        lastIngested: null,
        lastError: null,
      },
      digitraffic: {
        configured: true,
        lastPollAt: null,
        lastCount: null,
        lastIngested: null,
        lastError: null,
      },
    };
  }
  return g[STATUS_KEY];
}

export function secondarySourcesStatus() {
  return statusStore();
}

// ---------------------------------------------------------------------------
// BarentsWatch

const BW_TOKEN_URL = "https://id.barentswatch.no/connect/token";
const BW_LATEST_URL = "https://live.ais.barentswatch.no/v1/latest/combined";

let _bwToken: { token: string; expiresAt: number } | null = null;

async function barentswatchToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  if (_bwToken && Date.now() < _bwToken.expiresAt - 60_000) {
    return _bwToken.token;
  }
  const res = await fetch(BW_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "ais",
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`token HTTP ${res.status}`);
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  _bwToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return _bwToken.token;
}

interface BwPosition {
  mmsi: number;
  latitude: number;
  longitude: number;
  speedOverGround?: number | null;
  courseOverGround?: number | null;
  trueHeading?: number | null;
  navigationalStatus?: number | null;
  name?: string | null;
  msgtime?: string | null;
}

let _bwFirstOk = false;

async function pollBarentswatch(clientId: string, clientSecret: string) {
  const s = statusStore().barentswatch;
  s.lastPollAt = Date.now();
  try {
    const token = await barentswatchToken(clientId, clientSecret);
    const res = await fetch(BW_LATEST_URL, {
      headers: {
        authorization: `Bearer ${token}`,
        "user-agent": "Octopode-PortFlow/1.0 (AIS redundancy)",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as BwPosition[];
    s.lastCount = rows.length;
    let ingested = 0;
    for (const r of rows) {
      if (typeof r.mmsi !== "number") continue;
      if (typeof r.latitude !== "number" || typeof r.longitude !== "number")
        continue;
      const ts = r.msgtime ? Date.parse(r.msgtime) : NaN;
      processPosition({
        mmsi: r.mmsi,
        lat: r.latitude,
        lon: r.longitude,
        sog: r.speedOverGround ?? undefined,
        cog: r.courseOverGround ?? undefined,
        heading: r.trueHeading ?? undefined,
        navStatus: r.navigationalStatus ?? undefined,
        shipName: r.name ?? undefined,
        ts: Number.isFinite(ts) ? ts : undefined,
        source: "barentswatch",
      });
      ingested++;
    }
    s.lastIngested = ingested;
    s.lastError = null;
    if (!_bwFirstOk) {
      _bwFirstOk = true;
      console.log(
        `[ais-bw] premier poll OK : ${rows.length} positions, ${ingested} dans nos zones`,
      );
    }
  } catch (err) {
    s.lastError = (err as Error).message;
    console.error("[ais-bw] poll failed:", s.lastError);
  }
}

// ---------------------------------------------------------------------------
// Digitraffic (Fintraffic)

const DT_LOCATIONS_URL = "https://meri.digitraffic.fi/api/ais/v1/locations";

interface DtFeature {
  mmsi?: number;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mmsi?: number;
    sog?: number;
    cog?: number;
    navStat?: number;
    heading?: number;
    timestampExternal?: number;
  };
}

let _dtFirstOk = false;

async function pollDigitraffic() {
  const s = statusStore().digitraffic;
  s.lastPollAt = Date.now();
  try {
    const res = await fetch(DT_LOCATIONS_URL, {
      // NB : l'API exige Accept-Encoding: gzip — le fetch de Node l'envoie
      // par défaut et décompresse tout seul ; ne pas le forcer à la main.
      headers: {
        "user-agent": "Octopode-PortFlow/1.0 (AIS redundancy)",
        "digitraffic-user": "Octopodus/PortFlow",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { features?: DtFeature[] };
    const feats = json.features ?? [];
    s.lastCount = feats.length;
    let ingested = 0;
    for (const f of feats) {
      const mmsi = f.mmsi ?? f.properties?.mmsi;
      const coords = f.geometry?.coordinates;
      if (typeof mmsi !== "number" || !coords) continue;
      const [lon, lat] = coords;
      if (typeof lat !== "number" || typeof lon !== "number") continue;
      const p = f.properties ?? {};
      // heading 511 = « non disponible » (ITU-R M.1371)
      processPosition({
        mmsi,
        lat,
        lon,
        sog: p.sog,
        cog: p.cog,
        heading: p.heading === 511 ? undefined : p.heading,
        navStatus: p.navStat,
        ts: p.timestampExternal,
        source: "digitraffic",
      });
      ingested++;
    }
    s.lastIngested = ingested;
    s.lastError = null;
    if (!_dtFirstOk) {
      _dtFirstOk = true;
      console.log(
        `[ais-dt] premier poll OK : ${feats.length} positions, ${ingested} dans nos zones`,
      );
    }
  } catch (err) {
    s.lastError = (err as Error).message;
    console.error("[ais-dt] poll failed:", s.lastError);
  }
}

// ---------------------------------------------------------------------------

let _started = false;

export function startSecondarySources() {
  if (_started) return;
  _started = true;

  const bwId = process.env.BARENTSWATCH_CLIENT_ID;
  const bwSecret = process.env.BARENTSWATCH_CLIENT_SECRET;
  statusStore().barentswatch.configured = Boolean(bwId && bwSecret);

  if (statusStore().barentswatch.configured) {
    console.log("[ais-bw] BarentsWatch secondary source started (60s poll)");
    setInterval(() => {
      void pollBarentswatch(bwId!, bwSecret!);
    }, POLL_MS).unref();
    setTimeout(() => void pollBarentswatch(bwId!, bwSecret!), 10_000).unref();
  } else {
    console.log(
      "[ais-bw] BARENTSWATCH_CLIENT_ID/SECRET non définis — source secondaire norvégienne dormante",
    );
  }

  console.log("[ais-dt] Digitraffic secondary source started (60s poll)");
  setInterval(() => {
    void pollDigitraffic();
  }, POLL_MS).unref();
  setTimeout(() => void pollDigitraffic(), 20_000).unref();
}

/**
 * Vrai si au moins une source secondaire a ingéré des positions récemment
 * alors que le primaire est muet — utilisé par /api/status pour distinguer
 * « failover actif » de « tout est mort ».
 */
export function secondaryActive(): boolean {
  const primaryMute =
    !meta.status().lastMessageAt ||
    Date.now() - (meta.status().lastMessageAt ?? 0) > 10 * 60_000;
  if (!primaryMute) return false;
  const recent = (s: SecondarySourceStatus) =>
    s.lastPollAt != null &&
    Date.now() - s.lastPollAt < 5 * 60_000 &&
    (s.lastIngested ?? 0) > 0;
  return (
    recent(statusStore().barentswatch) || recent(statusStore().digitraffic)
  );
}
