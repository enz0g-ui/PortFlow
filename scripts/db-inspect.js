#!/usr/bin/env node
// Quick DB inspector for the Port Flow SQLite store.
//
// Usage (from project root, on the server):
//   node scripts/db-inspect.js                       → schema overview only
//   node scripts/db-inspect.js <email>               → user row + their alerts + their integrations
//   node scripts/db-inspect.js <email> --schema      → also dump full schema for users/user_alerts
//
// Or from your local PC:
//   bash scripts/remote.sh db-user <email>

const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");

const DB_PATH = path.resolve(process.cwd(), "data/port.db");
const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"));
const showSchema = args.includes("--schema");

const db = new DatabaseSync(DB_PATH);

function tableInfo(name) {
  return db.prepare(`PRAGMA table_info(${name})`).all().map((c) => c.name);
}

const usersCols = tableInfo("users");
const alertsCols = tableInfo("user_alerts");

console.log(`db: ${DB_PATH}`);
console.log(`users cols       : ${usersCols.join(", ")}`);
console.log(`user_alerts cols : ${alertsCols.join(", ")}`);

if (showSchema) {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();
  console.log("\nall tables:");
  for (const t of tables) console.log(`  - ${t.name}`);
}

if (!email) {
  console.log("\n(pass an email as 1st arg to inspect a specific user)");
  process.exit(0);
}

let u = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
if (!u) {
  // Fallback: case-insensitive
  u = db
    .prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)")
    .get(email);
}
if (!u) {
  console.log(`\nNo user with email=${email} — dumping all users so you can find the right row:\n`);
  const all = db
    .prepare("SELECT id, email, tier, stripe_subscription_id, created_at FROM users ORDER BY created_at DESC")
    .all();
  if (all.length === 0) {
    console.log("  (users table is empty)");
  } else {
    for (const r of all) console.log("  " + JSON.stringify(r));
  }
  process.exit(0);
}

console.log(`\nUSER:\n${JSON.stringify(u, null, 2)}`);

const alerts = db
  .prepare("SELECT * FROM user_alerts WHERE user_id = ? ORDER BY id")
  .all(u.id);
console.log(`\nALERTS (${alerts.length}):`);
for (const a of alerts) console.log("  " + JSON.stringify(a));

try {
  const integrations = db
    .prepare(
      "SELECT id, source_id, env_key_name, masked_value, created_at FROM user_integration_keys WHERE user_id = ? ORDER BY id",
    )
    .all(u.id);
  console.log(`\nINTEGRATION KEYS (${integrations.length}):`);
  for (const i of integrations) console.log("  " + JSON.stringify(i));
} catch {
  // table may not exist on older DBs
}

try {
  const watch = db
    .prepare("SELECT mmsi, name, port, added_at FROM user_watchlist WHERE user_id = ? ORDER BY added_at DESC")
    .all(u.id);
  console.log(`\nWATCHLIST (${watch.length}):`);
  for (const w of watch.slice(0, 10)) console.log("  " + JSON.stringify(w));
  if (watch.length > 10) console.log(`  ... +${watch.length - 10} more`);
} catch {
  // table may not exist
}
