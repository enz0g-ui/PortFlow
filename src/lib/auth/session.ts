import type { Tier } from "./tier";

export interface AppUser {
  id: string;
  email?: string;
  displayName?: string;
  tier: Tier;
}

export function isClerkEnabled(): boolean {
  return !!process.env.CLERK_SECRET_KEY;
}

/**
 * Returns the current user from the request context.
 * - If Clerk is configured, reads from Clerk auth() helper.
 * - Otherwise, returns a permissive `dev` user with tier 'enterprise' for local
 *   development (so all features work without auth setup).
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (!isClerkEnabled()) {
    return {
      id: "dev",
      email: "dev@local",
      displayName: "Local dev",
      tier: "enterprise",
    };
  }
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;
    const user = await currentUser();
    if (!user) return null;
    const tier = (user.publicMetadata?.tier as Tier | undefined) ?? "free";
    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      displayName:
        user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress,
      tier,
    };
  } catch {
    return null;
  }
}
