import { isClerkEnabled } from "@/lib/auth/session";

export default async function SignUpPage() {
  if (!isClerkEnabled()) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
          <h1 className="mb-2 text-lg font-semibold">Auth désactivée</h1>
          <p>
            Configure <code>CLERK_PUBLISHABLE_KEY</code> et{" "}
            <code>CLERK_SECRET_KEY</code> dans <code>.env.local</code> pour
            activer l&apos;inscription.
          </p>
        </div>
      </main>
    );
  }
  const { SignUp } = await import("@clerk/nextjs");
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignUp routing="path" path="/sign-up" />
    </main>
  );
}
