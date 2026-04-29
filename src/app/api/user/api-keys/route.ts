import { getCurrentUser } from "@/lib/auth/session";
import {
  apiAccessAllowed,
  countApiKeys,
  createApiKey,
  listApiKeys,
  maxApiKeys,
  revokeApiKey,
} from "@/lib/user-api-keys";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return Response.json({
    keys: listApiKeys(user.id),
    max: maxApiKeys(user.tier),
    allowed: apiAccessAllowed(user.tier),
    tier: user.tier,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!apiAccessAllowed(user.tier)) {
    return Response.json(
      { error: "API access requires Starter+ plan", tier: user.tier },
      { status: 403 },
    );
  }
  if (countApiKeys(user.id) >= maxApiKeys(user.tier)) {
    return Response.json(
      { error: "api keys limit reached", max: maxApiKeys(user.tier) },
      { status: 403 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as {
    label?: string;
  };
  const label = body.label?.trim().slice(0, 100);
  const created = createApiKey({
    userId: user.id,
    label: label || undefined,
  });
  return Response.json({
    key: created.masked,
    token: created.token,
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  const ok = revokeApiKey(id, user.id);
  if (!ok) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
