import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { TIER_LIMITS, type Tier } from "./auth/tier";

const KEY_PREFIX = "pf_";
const PREFIX_LEN = 8;

interface ApiKeyRow {
  id: string;
  user_id: string;
  label: string | null;
  prefix: string;
  hash: string;
  scopes: string | null;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
}

export interface ApiKeyMasked {
  id: string;
  label: string | null;
  prefix: string;
  createdAt: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
}

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiKey(): { id: string; token: string; prefix: string } {
  const id = randomBytes(8).toString("hex");
  const random = randomBytes(24).toString("base64url");
  const token = `${KEY_PREFIX}${random}`;
  const prefix = token.slice(0, PREFIX_LEN);
  return { id, token, prefix };
}

export function maxApiKeys(tier: Tier): number {
  if (!TIER_LIMITS[tier].apiAccess) return 0;
  if (tier === "enterprise") return 50;
  if (tier === "pro") return 10;
  return 3;
}

export function apiAccessAllowed(tier: Tier): boolean {
  return TIER_LIMITS[tier].apiAccess;
}

export function countApiKeys(userId: string): number {
  const r = db()
    .raw.prepare(
      `SELECT COUNT(*) as n FROM api_keys WHERE user_id = ? AND revoked_at IS NULL`,
    )
    .get(userId) as { n: number };
  return r.n;
}

export function createApiKey(input: {
  userId: string;
  label?: string;
  scopes?: string;
}): { masked: ApiKeyMasked; token: string } {
  const { id, token, prefix } = generateApiKey();
  db()
    .raw.prepare(
      `INSERT INTO api_keys
       (id, user_id, label, prefix, hash, scopes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.userId,
      input.label ?? null,
      prefix,
      hash(token),
      input.scopes ?? null,
      Date.now(),
    );
  return {
    masked: {
      id,
      label: input.label ?? null,
      prefix,
      createdAt: Date.now(),
      lastUsedAt: null,
      revokedAt: null,
    },
    token,
  };
}

export function listApiKeys(userId: string): ApiKeyMasked[] {
  const rows = db()
    .raw.prepare(
      `SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
    )
    .all(userId) as unknown as ApiKeyRow[];
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    prefix: r.prefix,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
    revokedAt: r.revoked_at,
  }));
}

export function revokeApiKey(keyId: string, userId: string): boolean {
  const r = db()
    .raw.prepare(
      `UPDATE api_keys SET revoked_at = ?
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
    )
    .run(Date.now(), keyId, userId);
  return r.changes > 0;
}

export interface ApiKeyValidation {
  ok: boolean;
  userId?: string;
  keyId?: string;
}

export function validateApiKey(token: string): ApiKeyValidation {
  if (!token || !token.startsWith(KEY_PREFIX)) return { ok: false };
  const prefix = token.slice(0, PREFIX_LEN);
  const candidates = db()
    .raw.prepare(
      `SELECT * FROM api_keys WHERE prefix = ? AND revoked_at IS NULL`,
    )
    .all(prefix) as unknown as ApiKeyRow[];
  const submitted = hash(token);
  for (const row of candidates) {
    if (row.hash === submitted) {
      db()
        .raw.prepare(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`)
        .run(Date.now(), row.id);
      return { ok: true, userId: row.user_id, keyId: row.id };
    }
  }
  return { ok: false };
}
