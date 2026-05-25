import { createHmac, timingSafeEqual } from "node:crypto";
import type { Tier } from "./tier";

export const DEMO_COOKIE_NAME = "portflow_demo";

export interface DemoSessionPayload {
  tier: Tier;
  demoId: string;
  expiresAt: number; // ms epoch
  code?: string; // the redeemed code, kept for analytics
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET env var is required to sign demo cookies in production",
      );
    }
    // Local dev fallback — predictable but inert outside dev
    return "dev-only-fallback-do-not-use-in-prod";
  }
  return secret;
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(s: string): Buffer {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(b64, "base64");
}

export function signDemoSession(payload: DemoSessionPayload): string {
  const body = base64url(Buffer.from(JSON.stringify(payload), "utf-8"));
  const mac = createHmac("sha256", getSecret()).update(body).digest();
  return `${body}.${base64url(mac)}`;
}

export function verifyDemoSession(
  token: string | undefined | null,
): DemoSessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);

  let expectedMac: Buffer;
  try {
    expectedMac = createHmac("sha256", getSecret()).update(body).digest();
  } catch {
    return null;
  }

  let providedMac: Buffer;
  try {
    providedMac = base64urlDecode(mac);
  } catch {
    return null;
  }

  if (providedMac.length !== expectedMac.length) return null;
  try {
    if (!timingSafeEqual(providedMac, expectedMac)) return null;
  } catch {
    return null;
  }

  let payload: DemoSessionPayload;
  try {
    payload = JSON.parse(
      base64urlDecode(body).toString("utf-8"),
    ) as DemoSessionPayload;
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload.tier !== "string" ||
    typeof payload.demoId !== "string" ||
    typeof payload.expiresAt !== "number"
  ) {
    return null;
  }

  if (Date.now() > payload.expiresAt) return null;

  return payload;
}
