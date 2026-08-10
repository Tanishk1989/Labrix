"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useIdentityMode } from "@/components/identity-mode-provider";

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
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
          Labrix account
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {showSignOut && mode === "clerk" ? (
            <SignOutButton redirectUrl="/sign-in">
              <button className="button" type="button">
                Sign out
              </button>
            </SignOutButton>
          ) : (
            <Link className="button" href="/sign-in">
              Go to sign in
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
