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
    db.close();
    console.log(`db: users row updated for ${u.id}`);
  } catch (err) {
    console.error(`db update failed: ${err.message}`);
  }
}

console.log("done");
