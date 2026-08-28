"use client";

import { SignOutButton } from "@clerk/nextjs";
import { GraduationCap, Presentation } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import type { SignInIntent } from "@/server/actors/sign-in-intent";
import { submitRoleOnboarding, type RoleOnboardingState } from "./role-onboarding-actions";

const initialState: RoleOnboardingState = {};

const roles = [
  { role: "student" as const, title: "Student", description: "Join classes and complete practicals.", icon: GraduationCap },
  { role: "teacher" as const, title: "Teacher", description: "Create classes and review student work.", icon: Presentation },
];

export function RoleOnboardingForm({ role }: { role: SignInIntent | null }) {
  const [state, action, pending] = useActionState(submitRoleOnboarding, initialState);

  if (!role) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">TRACE account setup</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">Choose your role</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Both roles are available immediately. Students can promote their account to Teacher later.</p>
          <div className="mt-6 grid gap-3">
            {roles.map((option) => {
              const Icon = option.icon;
              return (
                <Link key={option.role} href={`/account-setup?role=${option.role}`} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 hover:border-indigo-400 hover:bg-indigo-50">
                  <Icon size={22} className="text-indigo-700" aria-hidden="true" />
                  <span><span className="block font-semibold text-slate-950">{option.title}</span><span className="text-sm text-slate-600">{option.description}</span></span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  const teacher = role === "teacher";
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">TRACE account setup</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Continue as {teacher ? "Teacher" : "Student"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {teacher
            ? "Teacher access is available immediately. If this is currently a student account, it will be promoted to Teacher."
            : "Your student account will be ready immediately. You can join a classroom from the Classes page when you have a code."}
        </p>
        <form action={action} className="mt-6">
          <input type="hidden" name="role" value={role} />
          {state.message ? <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button className="button" disabled={pending} type="submit">{pending ? "Setting up…" : `Continue as ${teacher ? "Teacher" : "Student"}`}</button>
            <Link className="button-secondary" href="/account-setup">Choose another role</Link>
            <SignOutButton redirectUrl="/sign-in"><button className="button-secondary" type="button">Sign out</button></SignOutButton>
          </div>
        </form>
      </section>
    </main>
  );
}
