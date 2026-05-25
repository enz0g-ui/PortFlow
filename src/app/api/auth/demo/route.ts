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

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;

  let config: DemoCodeConfig | null = null;
  let resolvedCode: string | undefined;

  if (body.anonymous === true) {
    config = ANONYMOUS_DEMO;
    resolvedCode = "anonymous";
  } else if (typeof body.code === "string" && body.code.trim().length > 0) {
    config = lookupDemoCode(body.code);
    resolvedCode = body.code.trim().toUpperCase();
  }

  if (!config) {
    return Response.json({ error: "invalid_code" }, { status: 400 });
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

  console.log(
    `[demo] session=${demoId} code=${resolvedCode} tier=${config.tier} duration=${config.durationMinutes}m label="${config.label}"`,
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
