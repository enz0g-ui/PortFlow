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
}
