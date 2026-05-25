import { cookies } from "next/headers";
import type { Tier } from "./tier";
import { DEMO_COOKIE_NAME, verifyDemoSession } from "./demo-session";

export interface AppUser {
  id: string;
  email?: string;
  displayName?: string;
  tier: Tier;
  isDemo?: boolean;
  demoExpiresAt?: number;
}

export function isClerkEnabled(): boolean {
  return !!process.env.CLERK_SECRET_KEY;
}

async function getDemoUser(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(DEMO_COOKIE_NAME)?.value;
    const payload = verifyDemoSession(token);
    if (!payload) return null;
    return {
      id: payload.demoId,
      tier: payload.tier,
      displayName: "Demo session",
      isDemo: true,
      demoExpiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the current user from the request context.
 *
 * Resolution order:
 * 1. Clerk session (if Clerk enabled) — authenticated user wins, demo cookie
 *    is ignored so a real signup doesn't get downgraded to demo tier.
 * 2. Demo cookie — short-lived session granted by /api/auth/demo. Returns a
 *    synthetic user with `isDemo: true` and `demoExpiresAt` for banner UI.
 * 3. Dev fallback (Clerk disabled, local only) — permissive enterprise user.
 *
 * Demo users have no DB record. Endpoints that join on user id
 * (watchlist, integrations, api-keys) will return empty results — that's
 * intentional, demo sessions are read-only exploration.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (isClerkEnabled()) {
    try {
      const { auth, currentUser } = await import("@clerk/nextjs/server");
      const { userId } = await auth();
      if (userId) {
        const user = await currentUser();
        if (user) {
          const tier =
            (user.publicMetadata?.tier as Tier | undefined) ?? "free";
          return {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            displayName:
              user.fullName ??
              user.username ??
              user.primaryEmailAddress?.emailAddress,
            tier,
          };
        }
      }
    } catch {
      // fall through to demo cookie check
    }
    return await getDemoUser();
  }

  // Clerk disabled — demo cookie wins if present, otherwise permissive dev user
  const demoUser = await getDemoUser();
  if (demoUser) return demoUser;
  return {
    id: "dev",
    email: "dev@local",
    displayName: "Local dev",
    tier: "enterprise",
  };
}
