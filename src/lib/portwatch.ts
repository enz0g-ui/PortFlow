import { db } from "./db";

/**
 * IMF PortWatch ingestor — pulls daily port activity and daily chokepoint
 * transit data from the IMF/Oxford ArcGIS Hub published at portwatch.imf.org.
 *
 * License: IMF data terms — generally CC-BY-style permitting commercial
 * reuse with attribution ("Source: IMF PortWatch"). Each dataset's "Use
 * constraints" field on the dataset page should be checked annually.
 *
 * Refresh cadence: PortWatch publishes weekly on Tuesday at 09:00 ET,
 * but we run the ingestor every 24 h to absorb interim updates and
 * recover quickly from transient ArcGIS outages.
 *
 * Endpoint pattern (ArcGIS FeatureServer):
 *   <host>/ArcGIS/rest/services/<service>/FeatureServer/<layer>/query
 *     ?f=json
 *     &where=date_field >= '<iso>'        ← server-side filter
 *     &outFields=*
 *     &orderByFields=<date_field> ASC
 *     &resultOffset=<n>
 *     &resultRecordCount=2000             ← max 5000 per IMF Hub config
 *
 * Pagination: each response includes `exceededTransferLimit` boolean;
 * when true, increment resultOffset and re-query.
 */

const HOST = "https://services9.arcgis.com/weJ1QsnbMYJlCHdG";

interface FeatureServerService {
  /** Path under ArcGIS/rest/services/, e.g. 'Daily_Ports_Data'. */
  path: string;
  /** Layer index, almost always 0 for IMF feeds. */
  layer: number;
  /** Field used as the time axis (column name returned by ArcGIS). */
  dateField: string;
}

const FEEDS: Record<string, FeatureServerService> = {
  port_activity: {
    path: "Daily_Ports_Data",
    layer: 0,
    dateField: "date",
  },
  chokepoint_transit: {
    // Hub dataset id 42132aa4e2fc4d41bdaf9a445f688931 — exact service name
    // is not publicly documented; if the default below 404s, override via
    // PORTWATCH_CHOKEPOINT_SERVICE env var (find the URL by visiting the
    // dataset page, click "View API Resources", copy the FeatureServer URL).
    path: "Daily_Chokepoint_Transits",
    layer: 0,
    dateField: "date",
  },
};

interface ArcGisFeature {
  attributes: Record<string, string | number | null>;
}

interface ArcGisQueryResponse {
  features: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  fields?: Array<{ name: string; type: string }>;
  error?: { code: number; message: string };
}

function feedUrl(feed: FeatureServerService): string {
  // Allow per-feed override via env vars.
  if (feed.path === "Daily_Ports_Data") {
    const override = process.env.PORTWATCH_PORT_ACTIVITY_URL;
    if (override) return override;
  }
  if (feed.path === "Daily_Chokepoint_Transits") {
    const override = process.env.PORTWATCH_CHOKEPOINT_SERVICE;
    if (override) return override;
  }
  return `${HOST}/ArcGIS/rest/services/${feed.path}/FeatureServer/${feed.layer}/query`;
}

async function fetchPage(
  url: string,
  where: string,
  offset: number,
  pageSize = 2000,
): Promise<ArcGisQueryResponse> {
  const params = new URLSearchParams({
    f: "json",
    where,
    outFields: "*",
    returnGeometry: "false",
    resultOffset: String(offset),
    resultRecordCount: String(pageSize),
  });
  const res = await fetch(`${url}?${params.toString()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new Error(`PortWatch HTTP ${res.status} on ${url}`);
  }
  return (await res.json()) as ArcGisQueryResponse;
}

async function* iterFeatures(
  url: string,
  where: string,
  pageSize = 2000,
): AsyncIterableIterator<ArcGisFeature> {
  let offset = 0;
  while (true) {
    const page = await fetchPage(url, where, offset, pageSize);
    if (page.error) {
      throw new Error(`PortWatch ArcGIS error ${page.error.code}: ${page.error.message}`);
    }
    for (const f of page.features) yield f;
    if (!page.exceededTransferLimit) return;
    offset += page.features.length;
    if (page.features.length === 0) return; // safety
  }
}

function parseDate(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v; // ArcGIS often returns epoch ms
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

function asInt(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function asFloat(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

interface IngestResult {
  ok: boolean;
  feed: string;
  fetched: number;
  inserted: number;
  url: string;
  error?: string;
}

/**
 * Ingest the most recent N days of daily port-call activity. The PortWatch
 * Daily_Ports_Data layer has ~2 065 ports × N days = up to ~125 000 rows
 * for 60 days, well within ArcGIS pagination limits.
 */
export async function ingestPortActivity(
  daysBack = 60,
): Promise<IngestResult> {
  const feed = FEEDS.port_activity;
  const url = feedUrl(feed);
  const sinceMs = Date.now() - daysBack * 86_400_000;
  // ArcGIS DATE filters use either epoch ms or 'YYYY-MM-DD' strings depending
  // on layer config — we try the epoch form first, which is the most reliable.
  const where = `${feed.dateField} >= ${sinceMs}`;
  const insert = db().raw.prepare(
    `INSERT OR REPLACE INTO portwatch_port_activity
       (port_id, port_name, country, date_utc,
        total_calls, container_calls, tanker_calls, dry_bulk_calls,
        general_cargo_calls, ro_ro_calls, raw_attrs, ingested_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  let fetched = 0;
  let inserted = 0;
  const now = Date.now();
  try {
    db().raw.exec("BEGIN");
    for await (const f of iterFeatures(url, where)) {
      fetched++;
      const a = f.attributes;
      const portId = String(
        a.portid ?? a.port_id ?? a.PORT_ID ?? a.id ?? a.OBJECTID ?? "",
      );
      const dateUtc = parseDate(a.date ?? a.DATE ?? a.date_utc ?? a.year_month);
      if (!portId || !dateUtc) continue;
      const r = insert.run(
        portId,
        (a.portname ?? a.port_name ?? a.name ?? null) as string | null,
        (a.country ?? a.country_name ?? null) as string | null,
        dateUtc,
        asInt(a.portcalls ?? a.total_calls ?? a.calls),
        asInt(a.container_calls ?? a.containers),
        asInt(a.tanker_calls ?? a.tankers),
        asInt(a.bulk_calls ?? a.dry_bulk_calls),
        asInt(a.general_cargo_calls ?? a.general_cargo),
        asInt(a.roro_calls ?? a.ro_ro_calls),
        JSON.stringify(a),
        now,
      );
      if (r.changes > 0) inserted++;
    }
    db().raw.exec("COMMIT");
    return { ok: true, feed: "port_activity", fetched, inserted, url };
  } catch (err) {
    try {
      db().raw.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      feed: "port_activity",
      fetched,
      inserted,
      url,
      error: (err as Error).message,
    };
  }
}

/**
 * Ingest the most recent N days of daily chokepoint transit data. With 28
 * chokepoints × ~365 days = ~10k rows, this is trivial — no pagination
 * concern.
 */
export async function ingestChokepointTransit(
  daysBack = 90,
): Promise<IngestResult> {
  const feed = FEEDS.chokepoint_transit;
  const url = feedUrl(feed);
  const sinceMs = Date.now() - daysBack * 86_400_000;
  const where = `${feed.dateField} >= ${sinceMs}`;
  const insert = db().raw.prepare(
    `INSERT OR REPLACE INTO portwatch_chokepoint_transit
       (chokepoint_id, chokepoint_name, date_utc,
        total_transits, tanker_transits, container_transits,
        dry_bulk_transits, general_cargo_transits, trade_volume_tons,
        raw_attrs, ingested_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  let fetched = 0;
  let inserted = 0;
  const now = Date.now();
  try {
    db().raw.exec("BEGIN");
    for await (const f of iterFeatures(url, where)) {
      fetched++;
      const a = f.attributes;
      const cpId = String(
        a.chokepointid ?? a.chokepoint_id ?? a.id ?? a.OBJECTID ?? "",
      );
      const dateUtc = parseDate(a.date ?? a.DATE ?? a.date_utc);
      if (!cpId || !dateUtc) continue;
      const r = insert.run(
        cpId,
        (a.chokepointname ?? a.chokepoint_name ?? a.name ?? null) as
          | string
          | null,
        dateUtc,
        asInt(a.transits ?? a.total_transits),
        asInt(a.tanker_transits ?? a.tankers),
        asInt(a.container_transits ?? a.containers),
        asInt(a.bulk_transits ?? a.dry_bulk_transits),
        asInt(a.general_cargo_transits),
        asFloat(a.trade_volume ?? a.trade_volume_tons ?? a.tonnage),
        JSON.stringify(a),
        now,
      );
      if (r.changes > 0) inserted++;
    }
    db().raw.exec("COMMIT");
    return { ok: true, feed: "chokepoint_transit", fetched, inserted, url };
  } catch (err) {
    try {
      db().raw.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      feed: "chokepoint_transit",
      fetched,
      inserted,
      url,
      error: (err as Error).message,
    };
  }
}

// ────────────── Read APIs for the UI ──────────────

export interface ChokepointDay {
  chokepointId: string;
  chokepointName: string | null;
  dateUtc: number;
  totalTransits: number | null;
  tankerTransits: number | null;
  containerTransits: number | null;
  dryBulkTransits: number | null;
  tradeVolumeTons: number | null;
}

export function listChokepointTransits(opts: {
  chokepointId?: string;
  daysBack?: number;
  limit?: number;
}): ChokepointDay[] {
  const days = Math.max(1, Math.min(730, opts.daysBack ?? 30));
  const limit = Math.max(1, Math.min(5000, opts.limit ?? 1000));
  const since = Date.now() - days * 86_400_000;
  const where: string[] = ["date_utc >= ?"];
  const params: (string | number)[] = [since];
  if (opts.chokepointId) {
    where.push("chokepoint_id = ?");
    params.push(opts.chokepointId);
  }
  params.push(limit);
  const rows = db()
    .raw.prepare(
      `SELECT chokepoint_id, chokepoint_name, date_utc, total_transits,
              tanker_transits, container_transits, dry_bulk_transits,
              trade_volume_tons
       FROM portwatch_chokepoint_transit
       WHERE ${where.join(" AND ")}
       ORDER BY chokepoint_id ASC, date_utc DESC
       LIMIT ?`,
    )
    .all(...params) as unknown as Array<{
    chokepoint_id: string;
    chokepoint_name: string | null;
    date_utc: number;
    total_transits: number | null;
    tanker_transits: number | null;
    container_transits: number | null;
    dry_bulk_transits: number | null;
    trade_volume_tons: number | null;
  }>;
  return rows.map((r) => ({
    chokepointId: r.chokepoint_id,
    chokepointName: r.chokepoint_name,
    dateUtc: r.date_utc,
    totalTransits: r.total_transits,
    tankerTransits: r.tanker_transits,
    containerTransits: r.container_transits,
    dryBulkTransits: r.dry_bulk_transits,
    tradeVolumeTons: r.trade_volume_tons,
  }));
}

// ────────────── Scheduler ──────────────

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastResults: { portActivity: IngestResult | null; chokepoints: IngestResult | null } = {
  portActivity: null,
  chokepoints: null,
};

export function startPortwatchScanner(): void {
  if (_intervalId) return;

  // First fetch deferred 2 min after boot — ArcGIS occasionally throttles
  // bursts of cold-start traffic; spreading our hits keeps us friendly.
  setTimeout(async () => {
    await runOnce();
  }, 120_000);

  _intervalId = setInterval(
    () => {
      void runOnce();
    },
    24 * 3_600_000,
  );
}

async function runOnce(): Promise<void> {
  try {
    _lastResults.chokepoints = await ingestChokepointTransit();
    if (_lastResults.chokepoints.ok) {
      console.log(
        `[portwatch] chokepoints: fetched=${_lastResults.chokepoints.fetched} inserted=${_lastResults.chokepoints.inserted}`,
      );
    } else {
      console.error(
        `[portwatch] chokepoints failed: ${_lastResults.chokepoints.error}`,
      );
    }
  } catch (err) {
    console.error("[portwatch] chokepoints crashed", err);
  }
  try {
    _lastResults.portActivity = await ingestPortActivity();
    if (_lastResults.portActivity.ok) {
      console.log(
        `[portwatch] port-activity: fetched=${_lastResults.portActivity.fetched} inserted=${_lastResults.portActivity.inserted}`,
      );
    } else {
      console.error(
        `[portwatch] port-activity failed: ${_lastResults.portActivity.error}`,
      );
    }
  } catch (err) {
    console.error("[portwatch] port-activity crashed", err);
  }
}

export function getPortwatchStatus() {
  return {
    started: _intervalId !== null,
    lastResults: _lastResults,
  };
}
