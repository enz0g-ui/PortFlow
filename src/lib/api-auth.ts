import { consume, rateLimitHeaders } from "./rate-limit";
import { validateApiKey } from "./user-api-keys";

function allowedTokens(): Set<string> {
  const raw = process.env.PORT_API_TOKENS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function checkAuth(request: Request): {
  ok: boolean;
  token?: string;
  userId?: string;
  reason?: string;
} {
  const auth = request.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, reason: "missing bearer token" };
  const token = m[1].trim();

  if (token.startsWith("pf_")) {
    const v = validateApiKey(token);
    if (v.ok) return { ok: true, token, userId: v.userId };
    return { ok: false, reason: "invalid or revoked api key" };
  }

  const tokens = allowedTokens();
  if (tokens.size === 0) {
    return {
      ok: false,
      reason:
        "API auth disabled — create a key in /account or set PORT_API_TOKENS",
    };
  }
  if (!tokens.has(token)) return { ok: false, reason: "invalid token" };
  return { ok: true, token };
}

export function checkAuthAndRate(request: Request): {
  ok: boolean;
  token?: string;
  userId?: string;
  headers?: Record<string, string>;
  reason?: string;
  limited?: boolean;
} {
  const auth = checkAuth(request);
  if (!auth.ok) return auth;
  const limit = consume(`token:${auth.token}`);
  const headers = rateLimitHeaders(limit);
  if (!limit.ok) {
    return {
      ok: false,
      token: auth.token,
      userId: auth.userId,
      headers,
      reason: "rate limit exceeded",
      limited: true,
    };
  }
  return {
    ok: true,
    token: auth.token,
    userId: auth.userId,
    headers,
  };
}

export function unauthorized(reason: string) {
  return Response.json(
    { error: "unauthorized", detail: reason },
    {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="port-flow"' },
    },
  );
}

export function tooManyRequests(
  reason: string,
  headers: Record<string, string> = {},
) {
  return Response.json(
    { error: "rate_limit", detail: reason },
    { status: 429, headers },
  );
}

export interface AuthOk {
  ok: true;
  token: string;
  userId?: string;
  headers: Record<string, string>;
}

export type AuthGate = AuthOk | { ok: false; response: Response };

export function gate(request: Request): AuthGate {
  const r = checkAuthAndRate(request);
  if (r.ok) {
    return {
      ok: true,
      token: r.token!,
      userId: r.userId,
      headers: r.headers ?? {},
    };
  }
  if (r.limited) {
    return {
      ok: false,
      response: tooManyRequests(r.reason ?? "", r.headers ?? {}),
    };
  }
  return { ok: false, response: unauthorized(r.reason ?? "") };
}

export function withHeaders(
  body: unknown,
  headers: Record<string, string>,
  init?: ResponseInit,
): Response {
  return Response.json(body, {
    ...init,
    headers: { ...(init?.headers ?? {}), ...headers },
  });
}
