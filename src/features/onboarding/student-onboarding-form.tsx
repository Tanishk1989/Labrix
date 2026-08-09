"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useActionState } from "react";
import {
  submitStudentOnboarding,
  type OnboardingFormState,
} from "./actions";

const initialState: OnboardingFormState = {};

export function StudentOnboardingForm() {
  const [state, action, pending] = useActionState(
    submitStudentOnboarding,
    initialState,
  );

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
          Labrix student onboarding
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Join your classroom
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter the join code shared by your teacher. Your Labrix student account
          is created only after the code is validated.
        </p>
        <form action={action} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Classroom join code
            <input
              className="input mt-2"
              name="joinCode"
              required
              autoComplete="off"
              maxLength={80}
              placeholder="e.g. CLASS-ABCDE"
            />
          </label>
          {state.message ? (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {state.message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button className="button" disabled={pending} type="submit">
              {pending ? "Joining…" : "Join classroom"}
            </button>
            <SignOutButton redirectUrl="/sign-in">
              <button className="button-secondary" type="button">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </form>
      </section>
    </main>
  );
}
