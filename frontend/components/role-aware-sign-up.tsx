"use client";

import { SignUp } from "@clerk/nextjs";
import { GraduationCap, Presentation, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { SignInIntent } from "@/server/actors/sign-in-intent";

const roleOptions: { value: SignInIntent; label: string; icon: React.ElementType; description: string }[] = [
  { value: "student", label: "Student", icon: GraduationCap, description: "Join classes and complete practicals." },
  { value: "teacher", label: "Teacher", icon: Presentation, description: "Start classes and publish practicals immediately." },
];

export function RoleAwareSignUp({ intent }: { intent: SignInIntent | null }) {
  const [selected, setSelected] = useState<SignInIntent>(intent ?? "student");

  const current = roleOptions.find((r) => r.value === selected)!;
  const Icon = current.icon;

  return (
    <section className="w-full max-w-md" aria-label="sign up">
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

      {/* Clerk sign-up form */}
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl={`/sign-in?role=${selected}`}
        forceRedirectUrl={`/auth/complete?role=${selected}`}
      />
    </section>
  );
}
