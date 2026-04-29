import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { db } from "./db";

const ALGO = "aes-256-gcm";
const KEY_FILE = resolve(process.cwd(), "data", ".integration-key");

function loadOrCreateMasterKey(): Buffer {
  if (process.env.INTEGRATION_ENCRYPTION_KEY) {
    return createHash("sha256")
      .update(process.env.INTEGRATION_ENCRYPTION_KEY)
      .digest();
  }
  if (existsSync(KEY_FILE)) {
    return Buffer.from(readFileSync(KEY_FILE, "utf-8").trim(), "hex");
  }
  mkdirSync(dirname(KEY_FILE), { recursive: true });
  const fresh = randomBytes(32);
  writeFileSync(KEY_FILE, fresh.toString("hex"), { mode: 0o600 });
  return fresh;
}

let cachedKey: Buffer | null = null;
function masterKey(): Buffer {
  if (!cachedKey) cachedKey = loadOrCreateMasterKey();
  return cachedKey;
}

function encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, masterKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(
    ALGO,
    masterKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf-8");
}

export function maskValue(plaintext: string): string {
  if (!plaintext) return "";
  const visible = plaintext.length <= 8 ? 1 : 4;
  const start = plaintext.slice(0, visible);
  const end = plaintext.slice(-visible);
  return `${start}${"•".repeat(8)}${end}`;
}

interface KeyRow {
  user_id: string;
  source_id: string;
  env_key_name: string;
  encrypted_value: string;
  iv: string;
  tag: string;
  configured_at: number;
  validated_at: number | null;
  last_status: string | null;
}

export interface MaskedKey {
  sourceId: string;
  envKeyName: string;
  masked: string;
  configuredAt: number;
  validatedAt: number | null;
  lastStatus: string | null;
}

export function setUserKey(input: {
  userId: string;
  sourceId: string;
  envKeyName: string;
  value: string;
}): void {
  const { encrypted, iv, tag } = encrypt(input.value);
  db()
    .raw.prepare(
      `INSERT INTO user_integration_keys
       (user_id, source_id, env_key_name, encrypted_value, iv, tag, configured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, source_id, env_key_name) DO UPDATE SET
         encrypted_value = excluded.encrypted_value,
         iv = excluded.iv,
         tag = excluded.tag,
         configured_at = excluded.configured_at,
         validated_at = NULL,
         last_status = NULL`,
    )
    .run(
      input.userId,
      input.sourceId,
      input.envKeyName,
      encrypted,
      iv,
      tag,
      Date.now(),
    );
}

export function getUserKeyPlain(
  userId: string,
  sourceId: string,
  envKeyName: string,
): string | null {
  const row = db()
    .raw.prepare(
      `SELECT encrypted_value, iv, tag FROM user_integration_keys
       WHERE user_id = ? AND source_id = ? AND env_key_name = ?`,
    )
    .get(userId, sourceId, envKeyName) as
    | { encrypted_value: string; iv: string; tag: string }
    | undefined;
  if (!row) return null;
  try {
    return decrypt(row.encrypted_value, row.iv, row.tag);
  } catch {
    return null;
  }
}

export function listUserKeysMasked(userId: string): MaskedKey[] {
  const rows = db()
    .raw.prepare(
      `SELECT * FROM user_integration_keys WHERE user_id = ? ORDER BY source_id, env_key_name`,
    )
    .all(userId) as unknown as KeyRow[];
  return rows.map((r) => {
    let plain = "";
    try {
      plain = decrypt(r.encrypted_value, r.iv, r.tag);
    } catch {
      /* will show empty mask */
    }
    return {
      sourceId: r.source_id,
      envKeyName: r.env_key_name,
      masked: maskValue(plain),
      configuredAt: r.configured_at,
      validatedAt: r.validated_at,
      lastStatus: r.last_status,
    };
  });
}

export function removeUserKey(input: {
  userId: string;
  sourceId: string;
  envKeyName: string;
}): boolean {
  const r = db()
    .raw.prepare(
      `DELETE FROM user_integration_keys
       WHERE user_id = ? AND source_id = ? AND env_key_name = ?`,
    )
    .run(input.userId, input.sourceId, input.envKeyName);
  return r.changes > 0;
}

export function userSourceConfigured(userId: string, sourceId: string): boolean {
  const row = db()
    .raw.prepare(
      `SELECT 1 FROM user_integration_keys WHERE user_id = ? AND source_id = ? LIMIT 1`,
    )
    .get(userId, sourceId);
  return !!row;
}
