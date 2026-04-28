import type { ReactNode } from "react";

const clerkEnabled = !!process.env.CLERK_SECRET_KEY;

export async function AuthShell({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  const { ClerkProvider } = await import("@clerk/nextjs");
  return <ClerkProvider>{children}</ClerkProvider>;
}
