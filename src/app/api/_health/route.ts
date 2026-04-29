import { db } from "@/lib/db";
import { meta } from "@/lib/store";
import { sanctionsStatus } from "@/lib/sanctions";
import { listAppliedMigrations } from "@/lib/migrations";
import { isClerkEnabled } from "@/lib/auth/session";
import { isStripeEnabled } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

interface CheckResult {
  ok: boolean;
  detail?: string;
  meta?: Record<string, unknown>;
}

function checkDb(): CheckResult {
  try {
    const r = db()
      .raw.prepare("SELECT COUNT(*) as n FROM positions")
      .get() as { n: number };
    return { ok: true, meta: { positions: r.n } };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

function checkAis(): CheckResult {
  try {
    const global = meta.status();
    const perPort = meta.perPortStatus();
    const ageMs = global.lastMessageAt
      ? Date.now() - global.lastMessageAt
      : Number.POSITIVE_INFINITY;
    const ok = ageMs < 5 * 60_000;
    return {
      ok,
      detail: ok
        ? `last AIS message ${Math.round(ageMs / 1000)}s ago`
        : "no AIS messages in last 5min — feed may be disconnected",
      meta: {
        connected: !!global.lastConnectionAt,
        lastMessageAgoSec: Number.isFinite(ageMs)
          ? Math.round(ageMs / 1000)
          : null,
        totalVessels: global.vesselCount,
        portsTotal: Object.keys(perPort).length,
      },
    };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

function checkSanctions(): CheckResult {
  const s = sanctionsStatus();
  if (s.fetchedAt === 0) {
    return { ok: false, detail: "sanctions never fetched" };
  }
  const ageH = (Date.now() - s.fetchedAt) / 3_600_000;
  return {
    ok: ageH < 36,
    detail: ageH > 36 ? `last fetch ${ageH.toFixed(1)}h ago` : undefined,
    meta: {
      ageHours: Number(ageH.toFixed(2)),
      total: s.count,
      byImo: s.countByImo,
      errors: s.errors,
    },
  };
}

function checkMigrations(): CheckResult {
  try {
    const applied = listAppliedMigrations();
    return {
      ok: true,
      meta: {
        count: applied.length,
        latest: applied[applied.length - 1]?.version ?? null,
      },
    };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

export async function GET() {
  const dbCheck = checkDb();
  const aisCheck = checkAis();
  const sanctionsCheck = checkSanctions();
  const migrationsCheck = checkMigrations();

  const checks = {
    db: dbCheck,
    ais: aisCheck,
    sanctions: sanctionsCheck,
    migrations: migrationsCheck,
    clerk: { ok: true, meta: { configured: isClerkEnabled() } },
    stripe: { ok: true, meta: { configured: isStripeEnabled() } },
  };

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 200 : 503;

  return Response.json(
    {
      ok: allOk,
      ts: Date.now(),
      uptime: process.uptime(),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      checks,
    },
    { status },
  );
}
