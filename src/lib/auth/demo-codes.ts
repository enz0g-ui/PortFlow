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
  // V1bis segment codes (LinkedIn 1:1 outreach, 2026-06). One per segment so
  // pm2 [demo] logs reveal which segment converts, without a per-prospect code
  // to manage across the merge.
  "CHARTER-26": {
    tier: "pro",
    durationMinutes: 30,
    label: "V1bis — Chartering managers",
  },
  "COMPLY-26": {
    tier: "pro",
    durationMinutes: 30,
    label: "V1bis — Compliance / sanctions officers",
  },
  "PANDI-26": {
    tier: "pro",
    durationMinutes: 30,
    label: "V1bis — P&I / marine underwriters",
  },
};

// Anonymous ticket — homepage "Try Port Flow" button. 10 min, Professional tier.
// No code required; granted on POST with { anonymous: true }.
//
// Tier choice: "professional" (not "free") so visitors can actually test the
// workflow features that matter on a tanker desk — vessel bookmark, multi-regime
// sanctions screening, demurrage risk score, CSV export, 60-day history. The
// niche Pro+ features (SAR fusion + dark fleet detection) stay reserved for
// per-prospect codes, which keeps a reason for them to redeem one.
export const ANONYMOUS_DEMO: DemoCodeConfig = {
  tier: "professional",
  durationMinutes: 10,
  label: "Anonymous homepage demo",
};

export function lookupDemoCode(code: string): DemoCodeConfig | null {
  const normalized = code.trim().toUpperCase();
  return DEMO_CODES[normalized] ?? null;
}
