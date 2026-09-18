"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, GraduationCap, Presentation, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { SignInIntent } from "@/server/actors/sign-in-intent";

const roleOptions: { value: SignInIntent; label: string; icon: React.ElementType; description: string }[] = [
  { value: "student", label: "Student", icon: GraduationCap, description: "Open your practicals, write code, and track your submissions." },
  { value: "teacher", label: "Teacher", icon: Presentation, description: "Manage classes, publish practicals, and review student work." },
];

export function RoleAwareSignIn({ intent }: { intent: SignInIntent | null }) {
  const [selected, setSelected] = useState<SignInIntent>(intent ?? "student");
  const { isLoaded, isSignedIn } = useAuth();

  const current = roleOptions.find((r) => r.value === selected)!;
  const Icon = current.icon;

  return (
    <section className="w-full max-w-md" aria-label="sign in">
      {/* Role dropdown */}
      <div className="mb-6">
        <label
          htmlFor="role-select"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300"
        >
          I am a
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-indigo-300">
            <Icon size={17} aria-hidden="true" />
          </span>
          <select
            id="role-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value as SignInIntent)}
            className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-10 text-sm font-medium text-white transition focus:border-indigo-400/60 focus:bg-indigo-400/[0.08] focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value} className="bg-slate-900 text-white">
                {r.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">{current.description}</p>
      </div>

      {isLoaded && !isSignedIn ? (
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl={`/sign-up?role=${selected}`}
          forceRedirectUrl={`/auth/complete?role=${selected}`}
        />
      ) : null}
      {isLoaded && isSignedIn ? (
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-400/[0.06] p-5">
          <p className="text-sm font-semibold text-white">You are already signed in.</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Continue to your selected TRACE workspace.
          </p>
          <Link
            href={`/auth/complete?role=${selected}`}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            Enter {current.label} workspace
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
