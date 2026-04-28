import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "./db";

const MIGRATIONS_DIR = resolve(process.cwd(), "migrations");

interface MigrationRow {
  version: string;
  name: string;
  applied_at: number;
}

function ensureTable() {
  db().raw.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
}

function appliedVersions(): Set<string> {
  ensureTable();
  const rows = db().raw.prepare("SELECT version FROM _migrations").all() as Array<{ version: string }>;
  return new Set(rows.map((r) => r.version));
}

interface MigrationFile {
  version: string;
  name: string;
  sql: string;
}

function loadMigrationFiles(): MigrationFile[] {
  let files: string[];
  try {
    files = readdirSync(MIGRATIONS_DIR);
  } catch {
    return [];
  }
  return files
    .filter((f) => /^\d{4}_.+\.sql$/.test(f))
    .sort()
    .map((f) => {
      const match = f.match(/^(\d{4})_(.+)\.sql$/);
      const version = match![1];
      const name = match![2];
      const sql = readFileSync(resolve(MIGRATIONS_DIR, f), "utf-8");
      return { version, name, sql };
    });
}

export function runMigrations(): { applied: number; skipped: number } {
  ensureTable();
  const already = appliedVersions();
  const all = loadMigrationFiles();
  let applied = 0;
  let skipped = 0;
  for (const m of all) {
    if (already.has(m.version)) {
      skipped++;
      continue;
    }
    db().raw.exec("BEGIN");
    try {
      db().raw.exec(m.sql);
      db()
        .raw.prepare(
          "INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)",
        )
        .run(m.version, m.name, Date.now());
      db().raw.exec("COMMIT");
      applied++;
    } catch (err) {
      db().raw.exec("ROLLBACK");
      throw new Error(`Migration ${m.version}_${m.name} failed: ${(err as Error).message}`);
    }
  }
  return { applied, skipped };
}

export function listAppliedMigrations(): MigrationRow[] {
  ensureTable();
  return db()
    .raw.prepare("SELECT * FROM _migrations ORDER BY version ASC")
    .all() as unknown as MigrationRow[];
}
