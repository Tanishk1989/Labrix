import { SignUp } from "@clerk/nextjs";
import { ArrowLeft, GraduationCap, Presentation } from "lucide-react";
import Link from "next/link";
import type { SignInIntent } from "@/server/actors/sign-in-intent";

const options = [
  { intent: "teacher" as const, title: "Create a teacher account", description: "Start classes and publish practicals immediately.", icon: Presentation },
  { intent: "student" as const, title: "Create a student account", description: "Join classes and complete practicals.", icon: GraduationCap },
];

export function RoleAwareSignUp({ intent }: { intent: SignInIntent | null }) {
  if (!intent) {
    return (
      <section className="w-full max-w-md" aria-labelledby="account-type-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Create account</p>
        <h1 id="account-type-heading" className="mt-3 text-3xl font-semibold tracking-tight text-white">Choose your TRACE role</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Both Student and Teacher access are available without approval.</p>
        <div className="mt-7 grid gap-3">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Link key={option.intent} href={`/sign-up?role=${option.intent}`} className="group flex min-h-28 items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-indigo-400/60 hover:bg-indigo-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-400/10 text-indigo-300"><Icon size={21} aria-hidden="true" /></span>
                <span><span className="block text-base font-semibold text-white">{option.title}</span><span className="mt-1 block text-sm leading-5 text-slate-400">{option.description}</span></span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  const label = intent === "teacher" ? "teacher" : "student";
  return (
    <section className="w-full max-w-md" aria-label={`${label} sign up`}>
      <Link href="/sign-up" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"><ArrowLeft size={15} aria-hidden="true" />Choose a different role</Link>
      <p className="mb-4 text-center text-sm text-slate-400">Create your <span className="font-semibold text-white">{label} account</span></p>
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl={`/sign-in?role=${intent}`}
        forceRedirectUrl={`/auth/complete?role=${intent}`}
      />
    </section>
  );
}
