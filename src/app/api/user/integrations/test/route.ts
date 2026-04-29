import { getCurrentUser } from "@/lib/auth/session";
import { getUserKeyPlain } from "@/lib/integration-keys";
import { SATELLITE_SOURCES } from "@/lib/satellites/registry";
import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface TestResult {
  ok: boolean;
  message: string;
  detail?: string;
}

const VALIDATORS: Record<string, (key: string) => Promise<TestResult>> = {
  viirs: async (key) => {
    if (key.length < 16) {
      return {
        ok: false,
        message: "clé trop courte — vérifie ton fichier de licence Payne",
      };
    }
    return {
      ok: true,
      message: "format valide — la connexion live sera testée au prochain appel du provider",
    };
  },
  spire: async (key) => {
    if (!/^[A-Za-z0-9_-]{20,}$/.test(key)) {
      return {
        ok: false,
        message: "format de token Spire inattendu (alphanumeric 20+)",
      };
    }
    try {
      const r = await fetch("https://api.spire.com/", {
        method: "HEAD",
        headers: { authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      return {
        ok: r.status < 500,
        message: r.ok
          ? "Spire répond OK"
          : `Spire retourne ${r.status} — clé probablement valide mais endpoint protégé`,
      };
    } catch (err) {
      return {
        ok: true,
        message: "format OK — réseau ou endpoint indisponible pour ping",
        detail: (err as Error).message,
      };
    }
  },
  marinetraffic: async (key) => {
    if (!/^[A-Za-z0-9_-]{16,}$/.test(key)) {
      return {
        ok: false,
        message: "format de clé MarineTraffic inattendu",
      };
    }
    return { ok: true, message: "format valide" };
  },
  orbcomm: async (key) => {
    if (key.length < 12) {
      return {
        ok: false,
        message: "token trop court",
      };
    }
    return { ok: true, message: "format valide" };
  },
  sentinel1: async () => ({
    ok: true,
    message: "Copernicus (gratuit) — pas de clé à valider côté utilisateur",
  }),
  aisstream: async () => ({
    ok: true,
    message: "format accepté",
  }),
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    sourceId?: string;
    envKeyName?: string;
  };
  const { sourceId, envKeyName } = body;
  if (!sourceId || !envKeyName) {
    return Response.json(
      { error: "sourceId and envKeyName required" },
      { status: 400 },
    );
  }
  const src = SATELLITE_SOURCES.find((s) => s.id === sourceId);
  if (!src || !src.envKeys.includes(envKeyName)) {
    return Response.json({ error: "unknown source" }, { status: 400 });
  }
  const plain = getUserKeyPlain(user.id, sourceId, envKeyName);
  if (!plain) {
    return Response.json(
      { error: "no key configured for this source" },
      { status: 404 },
    );
  }
  const validator = VALIDATORS[sourceId];
  const result = validator
    ? await validator(plain)
    : { ok: true, message: "no validator for this source — format accepted" };

  db()
    .raw.prepare(
      `UPDATE user_integration_keys
       SET validated_at = ?, last_status = ?
       WHERE user_id = ? AND source_id = ? AND env_key_name = ?`,
    )
    .run(
      Date.now(),
      result.ok ? "ok" : "fail",
      user.id,
      sourceId,
      envKeyName,
    );

  return Response.json(result);
}
