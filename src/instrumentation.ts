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

  // Catch-all error handlers so a stray rejection doesn't silently kill the
  // process (Node 24 default: --unhandled-rejections=throw → exit). We have
  // had multiple silent-exit crash loops; logging here makes the cause
  // visible in pm2 logs before the process dies.
  process.on("uncaughtException", (err) => {
    console.error(
      "[FATAL] uncaughtException:",
      err?.stack || err?.message || err,
    );
  });
  process.on("unhandledRejection", (reason) => {
    console.error(
      "[FATAL] unhandledRejection:",
      (reason as Error)?.stack ||
        (reason as Error)?.message ||
        JSON.stringify(reason),
    );
  });
  // Heartbeat — logs uptime + RSS + heap every 15 s. If the process dies
  // silently, the last heartbeat tells us (a) how long it lived and (b)
  // memory trajectory at death. Cheap (~50 bytes / 15 s).
  process.on("exit", (code) => {
    console.error(
      `[FATAL] process.exit code=${code} after ${process.uptime().toFixed(1)}s`,
    );
  });
  for (const sig of ["SIGTERM", "SIGINT", "SIGHUP", "SIGUSR1", "SIGUSR2"]) {
    process.on(sig as NodeJS.Signals, () => {
      console.error(
        `[FATAL] received ${sig} after ${process.uptime().toFixed(1)}s`,
      );
    });
  }
  setInterval(() => {
    const m = process.memoryUsage();
    console.log(
      `[heartbeat] up=${process.uptime().toFixed(0)}s rss=${(m.rss / 1048576).toFixed(0)}MB heap=${(m.heapUsed / 1048576).toFixed(0)}/${(m.heapTotal / 1048576).toFixed(0)}MB`,
    );
  }, 15_000).unref();

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

  // IMF PortWatch ingestor — daily port-call counts and weekly chokepoint
  // transit data. CC-BY-style. Defers 2 min, runs every 24h. Failures log
  // but never block the worker.
  const { startPortwatchScanner } = await import("./lib/portwatch");
  startPortwatchScanner();

  // The new sanctions stack (OFAC/UN/EU) and chokepoint detector caused a
  // ~90s-uptime crash loop on infra-01 (RAM was fine at 220MB; the kill
  // signal source remains uncharacterized). Until we trace it, these are
  // OPT-IN: set ENABLE_NEW_INGESTORS=1 in .env.local to start them again.
  //
  // UKSL is also gated here because something in the modified shared
  // sanctioned-vessel index path is the most likely culprit and we want
  // to test the system without ANY of this session's scanner code firing.
  if (process.env.ENABLE_NEW_INGESTORS !== "1") {
    console.log(
      "[boot] new ingestors NOT started (set ENABLE_NEW_INGESTORS=1 to enable UKSL/OFAC/UN/EU/chokepoint scanners)",
    );
    return;
  }

  // UK Sanctions List (UKSL) ingestor — vessel-only filter. Replaced the
  // OFSI Consolidated List which was discontinued 28 Jan 2026. OGL v3.0
  // commercial reuse with attribution. Defers 90 s after boot.
  const { startUkslScanner } = await import("./lib/uk-sanctions");
  startUkslScanner();

  // OFAC SDN ingestor — US Treasury sanctions list, public domain. Largest
  // global source of vessel sanctions (Iran/Russia/Venezuela). Defers 120 s.
  const { startOfacScanner } = await import("./lib/ofac-sanctions");
  startOfacScanner();

  // UN Security Council Consolidated List — DPRK + Libya + ISIL/AQ vessel
  // entries. Public information, free reuse. Defers 150 s.
  const { startUnScScanner } = await import("./lib/un-sanctions");
  startUnScScanner();

  // EU Consolidated Financial Sanctions List — Russia post-2022 shadow-fleet
  // tankers, Belarus, Syria. Requires EU_FSF_XML_URL env (registration token).
  // No-op when not configured; defers 180 s when active.
  const { startEuScanner } = await import("./lib/eu-sanctions");
  startEuScanner();

  // Chokepoint transit detector — scans the last 10 min of positions every
  // 5 min, matches against 12 chokepoint bboxes, persists transit events
  // with sanctioned snapshot flag from UKSL. The killer query for compliance:
  //   /api/chokepoint-transits?sanctionedOnly=1&days=30
  const { startChokepointDetector } = await import("./lib/chokepoint-detector");
  startChokepointDetector();

  // Encounter detector (in-house ship-to-ship) — scans 4h positions every
  // 15 min in chokepoint zones, finds vessel pairs within 500 m for >2 h.
  // Replaces GFW's commercial-restricted encounters dataset.
  const { startEncounterDetector } = await import("./lib/encounter-detector");
  startEncounterDetector();

  // Loitering detector (in-house) — scans 8h positions every 30 min for
  // vessels with SOG <2 kn for >2 h far from any port. Suspicious staging
  // signal. Replaces GFW's loitering dataset.
  const { startLoiteringDetector } = await import("./lib/loitering-detector");
  startLoiteringDetector();
}
