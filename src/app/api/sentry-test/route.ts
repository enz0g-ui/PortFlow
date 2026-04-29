import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Test endpoint for Sentry — throws a real exception to verify capture.
 * Requires ?confirm=1 to avoid accidental hits, and rate-limits self via
 * a single global timestamp.
 *
 * REMOVE this file once Sentry is verified working. It's intentionally
 * simple and not tier-gated.
 */

let lastFireAt = 0;

export async function GET(request: NextRequest) {
  const confirm = request.nextUrl.searchParams.get("confirm");
  if (confirm !== "1") {
    return Response.json(
      {
        error:
          "use ?confirm=1 to provoke a sentry test exception. NOT for production.",
      },
      { status: 400 },
    );
  }
  const now = Date.now();
  if (now - lastFireAt < 30_000) {
    return Response.json(
      {
        error: "rate-limited — wait 30s between test fires",
      },
      { status: 429 },
    );
  }
  lastFireAt = now;
  throw new Error(
    `Sentry test exception fired at ${new Date(now).toISOString()}`,
  );
}
