"use client";

import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AuthButtons() {
  if (!clerkEnabled) return null;

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="redirect">
          <button className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-sky-500 hover:text-sky-300">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="redirect">
          <button className="rounded bg-sky-500 px-2 py-1 text-xs font-medium text-white hover:bg-sky-400">
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link
          href="/account"
          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-sky-500 hover:text-sky-300"
        >
          Account
        </Link>
        <UserButton />
      </Show>
    </>
  );
}
