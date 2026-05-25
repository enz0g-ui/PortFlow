import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import {
  ANONYMOUS_DEMO,
  type DemoCodeConfig,
  lookupDemoCode,
} from "@/lib/auth/demo-codes";
import {
  DEMO_COOKIE_NAME,
  signDemoSession,
} from "@/lib/auth/demo-session";

export const dynamic = "force-dynamic";

interface Body {
  code?: string;
  anonymous?: boolean;
}

// Per-IP rate limit for anonymous tickets: 1 redemption per 24h. Prevents
// the obvious abuse path where someone cookie-clears every 10 min to keep
// renewing free Pro-features access. Cookie-only would be trivially
// bypassed (private window, incognito, devtools-clear). IP isn't perfect
// (NAT, VPN) but deters casual chaining.
//
// In-memory Map — resets on each pm2 reload. That's an acceptable tradeoff
// for V1: deploys are infrequent and a brief abuse window during deploy
// isn't worth a SQLite table just yet. Revisit if we see abuse signals
// in [demo] log.
//
// Per-prospect codes (JASON-26 etc.) are NOT rate-limited — those are
// known recipients we want to be able to re-explore freely.
const ANON_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const anonymousDemoIpHistory = new Map<string, number>();

function getClientIp(request: NextRequest): string | null {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return null;
}

function pruneOldIpEntries() {
  const cutoff = Date.now() - ANON_RATE_LIMIT_WINDOW_MS;
  for (const [ip, ts] of anonymousDemoIpHistory) {
    if (ts < cutoff) anonymousDemoIpHistory.delete(ip);
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;

  let config: DemoCodeConfig | null = null;
  let resolvedCode: string | undefined;
  const isAnonymous = body.anonymous === true;

  if (isAnonymous) {
    config = ANONYMOUS_DEMO;
    resolvedCode = "anonymous";
  } else if (typeof body.code === "string" && body.code.trim().length > 0) {
    config = lookupDemoCode(body.code);
    resolvedCode = body.code.trim().toUpperCase();
  }

  if (!config) {
    return Response.json({ error: "invalid_code" }, { status: 400 });
  }

  // Anonymous rate limit by IP — deters chain-redemptions via cookie clear.
  const clientIp = isAnonymous ? getClientIp(request) : null;
  if (isAnonymous && clientIp) {
    const lastRedeem = anonymousDemoIpHistory.get(clientIp);
    if (
      lastRedeem !== undefined &&
      Date.now() - lastRedeem < ANON_RATE_LIMIT_WINDOW_MS
    ) {
      const retryAfter = Math.ceil(
        (lastRedeem + ANON_RATE_LIMIT_WINDOW_MS - Date.now()) / 1000,
      );
      return Response.json(
        { error: "rate_limited", retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
  }

  const demoId = `demo_${randomUUID().replace(/-/g, "")}`;
  const expiresAt = Date.now() + config.durationMinutes * 60 * 1000;
  const token = signDemoSession({
    tier: config.tier,
    demoId,
    expiresAt,
    code: resolvedCode,
  });

  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  if (isAnonymous && clientIp) {
    anonymousDemoIpHistory.set(clientIp, Date.now());
    if (anonymousDemoIpHistory.size > 200) pruneOldIpEntries();
  }

  console.log(
    `[demo] session=${demoId} code=${resolvedCode} tier=${config.tier} duration=${config.durationMinutes}m label="${config.label}" ip=${clientIp ?? "unknown"}`,
  );

  return Response.json({
    tier: config.tier,
    expiresAt,
    durationMinutes: config.durationMinutes,
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);
  return Response.json({ ended: true });
}
