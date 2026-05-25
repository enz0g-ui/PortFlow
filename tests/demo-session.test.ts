/**
 * Tests for the demo session signing layer.
 *
 * Demo cookies grant short-lived elevated tier access (Pro+ for code
 * redemption, Free for anonymous tickets). The cookie value is an
 * HMAC-SHA256 signed payload — these tests verify the signing layer
 * resists tampering and respects expiration, since a forged demo
 * cookie would grant a stranger paid-tier features.
 *
 * Run: `npm test` (uses tsx + node:test).
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// SESSION_SECRET must be set before importing the module so signing
// uses a deterministic key.
process.env.SESSION_SECRET = "test-secret-do-not-use-in-prod";

// @ts-ignore — tsx resolves .ts at runtime
import {
  signDemoSession,
  verifyDemoSession,
  type DemoSessionPayload,
} from "../src/lib/auth/demo-session";
// @ts-ignore
import { lookupDemoCode, DEMO_CODES } from "../src/lib/auth/demo-codes";

const validPayload = (overrides: Partial<DemoSessionPayload> = {}): DemoSessionPayload => ({
  tier: "pro",
  demoId: "demo_abc123",
  expiresAt: Date.now() + 30 * 60 * 1000,
  code: "JASON-26",
  ...overrides,
});

describe("signDemoSession + verifyDemoSession", () => {
  it("round-trip returns the same payload", () => {
    const payload = validPayload();
    const token = signDemoSession(payload);
    const verified = verifyDemoSession(token);
    assert.ok(verified, "verified payload should not be null");
    assert.equal(verified.tier, payload.tier);
    assert.equal(verified.demoId, payload.demoId);
    assert.equal(verified.expiresAt, payload.expiresAt);
    assert.equal(verified.code, payload.code);
  });

  it("rejects a token with a tampered MAC", () => {
    const token = signDemoSession(validPayload());
    const dot = token.indexOf(".");
    const tampered = token.slice(0, dot) + "." + "A".repeat(token.length - dot - 1);
    assert.equal(verifyDemoSession(tampered), null);
  });

  it("rejects a token with a tampered body (tier upgrade attempt)", () => {
    const token = signDemoSession(validPayload({ tier: "free" }));
    const dot = token.indexOf(".");
    const body = token.slice(0, dot);
    const mac = token.slice(dot + 1);
    // Decode body, change tier to "pro", re-encode — but keep original MAC
    const decoded = Buffer.from(
      body.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf-8");
    const malicious = decoded.replace('"tier":"free"', '"tier":"pro"');
    const reencoded = Buffer.from(malicious, "utf-8")
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const forged = `${reencoded}.${mac}`;
    assert.equal(verifyDemoSession(forged), null);
  });

  it("rejects an expired payload", () => {
    const token = signDemoSession(
      validPayload({ expiresAt: Date.now() - 1000 }),
    );
    assert.equal(verifyDemoSession(token), null);
  });

  it("rejects null / undefined / empty input", () => {
    assert.equal(verifyDemoSession(null), null);
    assert.equal(verifyDemoSession(undefined), null);
    assert.equal(verifyDemoSession(""), null);
    assert.equal(verifyDemoSession("no-dot-here"), null);
    assert.equal(verifyDemoSession(".only-mac"), null);
    assert.equal(verifyDemoSession("only-body."), null);
  });

  it("rejects a token signed with a different secret", () => {
    const token = signDemoSession(validPayload());
    // simulate rotation
    process.env.SESSION_SECRET = "different-secret";
    assert.equal(verifyDemoSession(token), null);
    // restore for other tests
    process.env.SESSION_SECRET = "test-secret-do-not-use-in-prod";
  });
});

describe("lookupDemoCode", () => {
  it("returns the config for valid V1 codes", () => {
    for (const code of Object.keys(DEMO_CODES)) {
      const config = lookupDemoCode(code);
      assert.ok(config, `code ${code} should be recognized`);
      assert.equal(config.tier, "pro");
      assert.equal(config.durationMinutes, 30);
    }
  });

  it("is case-insensitive", () => {
    assert.ok(lookupDemoCode("jason-26"));
    assert.ok(lookupDemoCode("Jason-26"));
    assert.ok(lookupDemoCode("  JASON-26  "));
  });

  it("returns null for unknown codes", () => {
    assert.equal(lookupDemoCode("UNKNOWN"), null);
    assert.equal(lookupDemoCode(""), null);
    assert.equal(lookupDemoCode("JASON-99"), null);
  });
});
