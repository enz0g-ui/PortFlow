import type { Tier } from "./tier";

export interface DemoCodeConfig {
  tier: Tier;
  durationMinutes: number;
  label: string;
}

// Per-prospect demo codes for the V1 cold outreach batch (sent 2026-05-26).
// Each code grants a single 30-min Pro+ session per redemption. Codes can be
// redeemed multiple times — each redemption starts a fresh 30-min cookie.
// Lookups are case-insensitive (the lookup helper uppercases before matching).
export const DEMO_CODES: Record<string, DemoCodeConfig> = {
  "JASON-26": {
    tier: "pro",
    durationMinutes: 30,
    label: "Jason Gladysz / Suncor",
  },
  "ALEX-26": {
    tier: "pro",
    durationMinutes: 30,
    label: "Alex Hill / ExxonMobil",
  },
  "MAREK-26": {
    tier: "pro",
    durationMinutes: 30,
    label: "Marek Jezierski / CNOOC UK",
  },
  "MANISH-26": {
    tier: "pro",
    durationMinutes: 30,
    label: "Manish Mathur / Reliance",
  },
};

// Anonymous ticket — homepage "Try Port Flow" button. 10 min, Free tier.
// No code required; granted on POST with { anonymous: true }.
export const ANONYMOUS_DEMO: DemoCodeConfig = {
  tier: "free",
  durationMinutes: 10,
  label: "Anonymous homepage demo",
};

export function lookupDemoCode(code: string): DemoCodeConfig | null {
  const normalized = code.trim().toUpperCase();
  return DEMO_CODES[normalized] ?? null;
}
