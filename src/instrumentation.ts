export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string> },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
  },
) {
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureRequestError(err, request, context);
    } catch {
      /* silent — Sentry import failed */
    }
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.SENTRY_DSN) {
      await import("../sentry.server.config");
    }
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    if (process.env.SENTRY_DSN) {
      await import("../sentry.edge.config");
    }
  }
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { bulkLoadKpis, bulkLoadStatic } = await import("./lib/store");
  const { loadAllStatic, loadKpisSince } = await import("./lib/db");
  const { isCargoClass } = await import("./lib/cargo");
  const { PORTS } = await import("./lib/ports");
  const { loadSnapshots, startSnapshotter } = await import("./lib/snapshot");
  const { runMigrations } = await import("./lib/migrations");

  try {
    const m = runMigrations();
    if (m.applied > 0) {
      console.log(`[boot] applied ${m.applied} migration(s) (${m.skipped} already applied)`);
    }
  } catch (err) {
    console.error("[boot] migration failed", err);
  }

  try {
    const statics = loadAllStatic();
    bulkLoadStatic(
      statics.map((r) => ({
        mmsi: r.mmsi,
        name: r.name ?? undefined,
        callsign: r.callsign ?? undefined,
        shipType: r.ship_type ?? undefined,
        destination: r.destination ?? undefined,
        draught: r.draught ?? undefined,
        lengthM: r.length_m ?? undefined,
        cargoClass: isCargoClass(r.cargo_class) ? r.cargo_class : undefined,
      })),
    );
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let kpiCount = 0;
    for (const p of PORTS) {
      const snaps = loadKpisSince(p.id, since);
      bulkLoadKpis(p.id, snaps);
      kpiCount += snaps.length;
    }
    const restoredVessels = loadSnapshots();
    console.log(
      `[boot] loaded ${statics.length} static records, ${kpiCount} KPI snapshots, ${restoredVessels} live vessels across ${PORTS.length} ports`,
    );
    startSnapshotter();
  } catch (err) {
    console.error("[boot] db restore failed", err);
  }

  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.warn(
      "[boot] AISSTREAM_API_KEY missing — AIS worker disabled. " +
        "Set it in .env.local to start receiving live data.",
    );
    return;
  }

  const { startAisWorker } = await import("./lib/ais-worker");
  startAisWorker(apiKey);

  const { startSarScanner } = await import("./lib/sar/scanner");
  startSarScanner();

  const { startSanctionsRefresh } = await import("./lib/sanctions");
  startSanctionsRefresh();

  const { startWebhookQueueProcessor } = await import("./lib/webhooks");
  startWebhookQueueProcessor();

  // Dark-fleet detection — scans the positions table on a 1-hour cadence.
  // First run does a 30-day backfill so the UI has data immediately.
  // No external dependency: the algorithm runs on our own AIS feed, output
  // is fully redistributable under our license. Reference: Welch et al. 2022.
  const { startDarkEventsScanner } = await import("./lib/dark-events");
  startDarkEventsScanner();

  // ETA-approaching alerts — fires `vessel.eta_approaching` when a voyage's
  // predicted ETA crosses the per-user lead time (default 60 min). 5-min
  // cadence; only touches the small `voyages` table.
  const { startEtaApproachingScanner } = await import(
    "./lib/eta-approaching-scanner"
  );
  startEtaApproachingScanner();

  // NGA ASAM ingestor — daily fetch of public-domain piracy / armed-robbery
  // incidents. Free, US Gov public data. Defers initial fetch 60s after boot
  // and runs every 24h after that. Skips silently if upstream URL changes.
  const { startPiracyAsamScanner } = await import("./lib/piracy-asam");
  startPiracyAsamScanner();
}
