import { NextResponse } from "next/server";

/**
 * Weekly data-brief signup via Resend Audiences.
 *
 * Env (production):
 *   RESEND_API_KEY      — Resend API key
 *   RESEND_AUDIENCE_ID  — audience "Port Flow data brief" (resend.com/audiences)
 *
 * When either is missing (dev), the subscription is logged and accepted so
 * the UI flow stays testable — same convention as the rest of the app's
 * optional integrations.
 */
export async function POST(req: Request) {
  let email = "";
  let source = "unknown";
  try {
    const body = (await req.json()) as { email?: string; source?: string };
    email = (body.email ?? "").trim().toLowerCase();
    source = (body.source ?? "unknown").trim().slice(0, 64);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const emailRe = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!emailRe.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Invalid email address" },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.log(`[newsletter] (no Resend configured) ${email} src=${source}`);
    return NextResponse.json({ ok: true });
  }

  const res = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    },
  );

  if (!res.ok && res.status !== 409) {
    // 409 = already subscribed → treated as success.
    const detail = await res.text().catch(() => "");
    console.error(`[newsletter] Resend ${res.status}: ${detail.slice(0, 200)}`);
    return NextResponse.json(
      { ok: false, error: "Subscription failed, please retry" },
      { status: 502 },
    );
  }

  console.log(`[newsletter] subscribed ${email} src=${source}`);
  return NextResponse.json({ ok: true });
}
