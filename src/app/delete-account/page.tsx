import type { Metadata } from "next";
import Link from "next/link";

// Account & data deletion page — required by Google Play (account-deletion URL
// on the store listing). Must name the app/developer, describe the steps, and
// state what is deleted and what is retained.
export const metadata: Metadata = {
  title: "Delete your account & data",
  description:
    "How to delete your Port Flow account and associated data, or request partial data deletion.",
  alternates: { canonical: "https://portflow.uk/delete-account" },
  robots: { index: true, follow: true },
};

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6 py-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Port Flow
        </Link>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Delete your Port Flow account &amp; data
        </h1>
        <p className="text-slate-300">
          Port Flow is published by OCTOPODUS (Laurent Guglielmetti EI, France).
          You can delete your account and the data associated with it at any
          time, using either method below.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-slate-100">
          Option 1 — from your account
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>
            Sign in and open{" "}
            <Link href="/account" className="text-sky-400 hover:text-sky-300">
              Account
            </Link>
            .
          </li>
          <li>
            Open your profile (avatar) → <em>Manage account</em> →{" "}
            <em>Delete account</em>, and confirm.
          </li>
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-slate-100">
          Option 2 — by email
        </h2>
        <p className="text-sm text-slate-300">
          Write to{" "}
          <a
            href="mailto:contact@portflow.uk?subject=Account%20deletion%20request"
            className="text-sky-400 hover:text-sky-300"
          >
            contact@portflow.uk
          </a>{" "}
          from the email address linked to your account, with the subject
          &quot;Account deletion request&quot;. We confirm and complete the
          deletion within 30 days. You can also request{" "}
          <strong>partial deletion</strong> (e.g. clearing your watchlist,
          alerts or push subscriptions) without closing the account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">
          What is deleted, what is kept
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>
            <strong>Deleted:</strong> your authentication account (email,
            profile), watchlists, alert configurations, push-notification
            subscriptions, and API keys.
          </li>
          <li>
            <strong>Kept:</strong> invoicing records required by French law
            (Code de commerce — up to 10 years) if you had a paid subscription,
            and aggregate, non-identifying usage statistics. Public AIS vessel
            data contains no personal user data.
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          Details in our{" "}
          <Link href="/legal" className="text-sky-400 hover:text-sky-300">
            privacy policy
          </Link>
          . Supervisory authority: CNIL (France).
        </p>
      </section>
    </main>
  );
}
