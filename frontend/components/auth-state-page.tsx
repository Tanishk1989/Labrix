"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useIdentityMode } from "@/components/identity-mode-provider";

import { TraceLogo } from "@/components/trace-logo";

export function AuthStatePage({
  title,
  description,
  showSignOut = true,
}: {
  title: string;
  description: string;
  showSignOut?: boolean;
}) {
  const mode = useIdentityMode();
  return (
    <main className="flex min-h-screen items-center px-4 py-12 sm:px-6">
      <section className="mx-auto w-full max-w-2xl border-y border-[var(--border)] py-10 sm:py-12">
        <div className="mb-6">
          <TraceLogo size={22} />
        </div>
        <p className="eyebrow">
          TRACE account
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          {showSignOut && mode === "clerk" ? (
            <SignOutButton redirectUrl="/sign-in">
              <button className="button min-h-11" type="button">
                Sign out
              </button>
            </SignOutButton>
          ) : (
            <Link className="button min-h-11" href="/sign-in">
              Go to sign in
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
