#!/usr/bin/env node
/**
 * Reset (or set) a user's tier in Clerk publicMetadata.
 *
 * Usage:
 *   node scripts/reset-tier.mjs <email> [tier=free]
 *
 * Examples:
 *   node scripts/reset-tier.mjs you@example.com
 *   node scripts/reset-tier.mjs you@example.com pro
 *
 * Run on the server (or anywhere CLERK_SECRET_KEY is set):
 *   bash scripts/remote.sh exec 'node scripts/reset-tier.mjs you@example.com'
 *
 * Notes:
 *   - Source of truth is Clerk publicMetadata.tier — this script writes there
 *     directly. The DB users row (if any) is updated for audit symmetry.
 *   - Does NOT cancel the Stripe subscription. Cancel that separately via
 *     Stripe dashboard if needed (otherwise the user remains billed).
 */

import { createClerkClient } from "@clerk/backend";
import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";

const email = process.argv[2];
const tier = process.argv[3] ?? "free";

const VALID_TIERS = ["free", "starter", "professional", "pro", "enterprise"];
const TIER_PORT_LIMIT = {
  free: 3,
  starter: 15,
  professional: 30,
  pro: 51,
  enterprise: 51,
};

if (!email) {
  console.error("Usage: node scripts/reset-tier.mjs <email> [tier=free]");
  console.error(`Valid tiers: ${VALID_TIERS.join(", ")}`);
  process.exit(1);
}
if (!VALID_TIERS.includes(tier)) {
  console.error(`Invalid tier '${tier}'. Valid: ${VALID_TIERS.join(", ")}`);
  process.exit(1);
}
if (!process.env.CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY missing in env");
  process.exit(1);
}

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const list = await clerk.users.getUserList({ emailAddress: [email] });
const users = Array.isArray(list) ? list : (list.data ?? []);

if (users.length === 0) {
  console.error(`No Clerk user found for email: ${email}`);
  process.exit(2);
}

for (const u of users) {
  const before = u.publicMetadata?.tier ?? "<unset>";
  await clerk.users.updateUserMetadata(u.id, {
    publicMetadata: { ...u.publicMetadata, tier },
  });
  console.log(
    `clerk: ${u.id} ${u.emailAddresses[0]?.emailAddress} ${before} -> ${tier}`,
  );

  try {
    const dbPath =
      process.env.PORT_DB_PATH ?? resolve(process.cwd(), "data", "port.db");
    const db = new DatabaseSync(dbPath);
    db.prepare(
      `INSERT INTO users (id, email, tier, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET tier = excluded.tier, updated_at = excluded.updated_at`,
    ).run(
      u.id,
      u.emailAddresses[0]?.emailAddress ?? null,
      tier,
      Date.now(),
      Date.now(),
    );
    console.log(`db: users row updated for ${u.id}`);

    // Auto-fill the port watchlist up to the tier limit so the dashboard
    // is usable immediately. Strategic ports first.
    const limit = TIER_PORT_LIMIT[tier] ?? 3;
    const currentCount = (
      db
        .prepare(
          `SELECT COUNT(*) as n FROM user_port_watchlist WHERE user_id = ?`,
        )
        .get(u.id)
    ).n;
    if (currentCount < limit) {
      const have = new Set(
        db
          .prepare(
            `SELECT port_id FROM user_port_watchlist WHERE user_id = ?`,
          )
          .all(u.id)
          .map((r) => r.port_id),
      );
      const STRATEGIC_DEFAULTS = [
        "rotterdam", "antwerp", "amsterdam", "singapore", "hormuz",
        "fujairah", "houston", "rasLaffan", "shanghai", "hamburg",
        "leHavre", "algeciras", "felixstowe", "bremerhaven", "ningbo",
        "newYorkNJ", "shenzhen", "hongKong", "busan", "yokohama",
        "tangerMed", "dunkerque", "marseilleFos", "milfordHaven", "gdansk",
        "genoa", "trieste", "piraeus", "valencia", "savannah",
        "longBeach", "losAngeles", "sabine", "corpusChristi", "newOrleans",
        "santos", "cartagena", "jebelAli", "jeddah", "salalah",
        "kaohsiung", "portKlang", "colombo", "nhavaSheva", "durban",
        "lagos", "djibouti", "suez", "malacca", "stNazaire", "southampton",
      ];
      const needed = limit - currentCount;
      const toAdd = STRATEGIC_DEFAULTS.filter((id) => !have.has(id)).slice(
        0,
        needed,
      );
      const baseTs = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const stmt = db.prepare(
        `INSERT OR IGNORE INTO user_port_watchlist (user_id, port_id, created_at) VALUES (?, ?, ?)`,
      );
      for (let i = 0; i < toAdd.length; i++) {
        stmt.run(u.id, toAdd[i], baseTs - i * 1000);
      }
      console.log(
        `db: auto-filled ${toAdd.length} ports for ${u.id} (limit ${limit})`,
      );
    }
    db.close();
  } catch (err) {
    console.error(`db update failed: ${err.message}`);
  }
}

console.log("done");
