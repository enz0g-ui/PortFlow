import Link from "next/link";
import { getCurrentUser, isClerkEnabled } from "@/lib/auth/session";
import { TIER_LIMITS } from "@/lib/auth/tier";
import { AlertsSection } from "./AlertsSection";
import { ApiKeysSection } from "./ApiKeysSection";
import { BillingPortalButton } from "./BillingPortalButton";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!isClerkEnabled()) {
    return (
      <main className="mx-auto flex w-full max-w-[800px] flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">Compte (mode dev)</h1>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          Auth Clerk non configurée — utilisateur local <code>dev</code> avec
          tier <code>enterprise</code>. Active Clerk pour la prod.
        </div>
      </main>
    );
  }

  if (!user) {
    // Visiteur anonyme. Un prospect arrivé de LinkedIn (02/10/2026) a ouvert
    // cette page et n'y a trouvé qu'un bouton « Se connecter » en français :
    // une impasse. On dit ce qu'un compte apporte, et on offre les trois
    // sorties utiles. Anglais : langue primaire du site (cf. /about).
    return (
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-8 p-6 py-14">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
            ← Port Flow
          </Link>
          <Link
            href="/pricing"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Plans &amp; pricing →
          </Link>
        </header>

        <section className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Your account</h1>
          <p className="text-slate-400">
            Sign in to manage your plan and the tools below. No account yet? The
            free tier gives read-only access to all 51 ports — no card, cancel
            anytime.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {[
            ["API keys", "Create and revoke Bearer tokens for the public REST API (Starter and above)."],
            ["Favourite ports", "Pin the ports you follow; they drive your alerts and your fleet view."],
            ["Arrival alerts", "Slack, Telegram, email or webhook when a tracked vessel arrives, departs or goes dark."],
            ["Billing", "Change plan, download invoices, cancel — through the Stripe portal."],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="text-sm font-semibold text-slate-100">{title}</div>
              <p className="mt-1 text-xs text-slate-400">{body}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/sign-in"
            className="rounded bg-sky-500 px-6 py-3 text-center text-base font-semibold text-[#06121d] hover:bg-sky-400"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded border border-slate-700 px-6 py-3 text-center text-base font-medium text-slate-100 hover:border-sky-500"
          >
            Create a free account
          </Link>
          <Link
            href="/demo"
            className="text-center text-sm text-slate-400 hover:text-slate-200 sm:ml-2"
          >
            or try the 10-minute demo, no signup →
          </Link>
        </section>
      </main>
    );
  }

  const limits = TIER_LIMITS[user.tier];

  return (
    <main className="mx-auto flex w-full max-w-[800px] flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <Link href="/app" className="text-xs text-slate-400 hover:text-slate-200">
          ← retour
        </Link>
        <Link
          href="/pricing"
          className="rounded border border-slate-700 px-3 py-1 text-xs hover:border-sky-500"
        >
          Tarifs →
        </Link>
      </header>

      <h1 className="text-2xl font-bold">Mon compte</h1>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-slate-500">Email</dt>
          <dd className="text-slate-200">{user.email ?? "—"}</dd>
          <dt className="text-slate-500">ID utilisateur</dt>
          <dd className="font-mono text-xs text-slate-300">{user.id}</dd>
          <dt className="text-slate-500">Tier</dt>
          <dd>
            <span className="rounded bg-sky-500/15 px-2 py-0.5 text-xs uppercase text-sky-300">
              {user.tier}
            </span>
          </dd>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          Limites de votre plan
        </h2>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-slate-500">Ports</dt>
          <dd className="text-slate-200">{String(limits.ports)}</dd>
          <dt className="text-slate-500">Rate limit</dt>
          <dd className="text-slate-200">{limits.rateLimitPerMinute} req/min</dd>
          <dt className="text-slate-500">Historique</dt>
          <dd className="text-slate-200">{limits.historyDays} jours</dd>
          <dt className="text-slate-500">Watchlist max</dt>
          <dd className="text-slate-200">{limits.watchlistMax}</dd>
          <dt className="text-slate-500">Webhooks</dt>
          <dd className="text-slate-200">{limits.webhooks ? "oui" : "—"}</dd>
          <dt className="text-slate-500">API publique</dt>
          <dd className="text-slate-200">{limits.apiAccess ? "oui" : "—"}</dd>
          <dt className="text-slate-500">Export CSV</dt>
          <dd className="text-slate-200">{limits.csvExport ? "oui" : "—"}</dd>
          <dt className="text-slate-500">Fusion AIS+SAR</dt>
          <dd className="text-slate-200">{limits.sarFusion ? "oui" : "—"}</dd>
          <dt className="text-slate-500">Sanctions screening</dt>
          <dd className="text-slate-200">{limits.sanctionsScreening ? "oui" : "—"}</dd>
        </dl>
      </section>

      <BillingPortalButton tier={user.tier} />
      <ApiKeysSection />
      <AlertsSection />
    </main>
  );
}
