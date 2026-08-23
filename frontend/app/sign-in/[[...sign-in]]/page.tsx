import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck, UserCheck } from "lucide-react";
import { AuthVisualSide } from "@/features/auth/auth-visual-side";
import { getIdentityMode } from "@/server/actors/identity-mode";

export default function SignInPage() {
  const mode = getIdentityMode();
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const isClerk = mode === "clerk" && hasClerkKey;

  return (
    <main className="min-h-screen bg-[#050609] text-white flex items-center justify-center p-5 sm:p-8 lg:p-12 selection:bg-indigo-500/30 selection:text-white">
      <div className="w-full max-w-[1480px] mx-auto grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side (Desktop) / Bottom Side (Mobile): Brand Visual Side */}
        <div className="order-2 lg:order-1 lg:col-span-7">
          <AuthVisualSide />
        </div>

        {/* Right Side (Desktop) / Top Side (Mobile): Auth Form */}
        <div className="order-1 lg:order-2 lg:col-span-5 flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[440px]">
            {isClerk ? (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "w-full rounded-3xl border border-white/[0.09] bg-[#0b0e17]/95 p-7 sm:p-9 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-white",
                    headerTitle: "text-2xl sm:text-3xl font-bold tracking-tight text-white",
                    headerSubtitle: "text-xs sm:text-sm text-white/70",
                    socialButtonsBlockButton:
                      "flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.99] cursor-pointer",
                    socialButtonsBlockButtonText: "text-white font-semibold",
                    dividerRow: "relative my-6 flex items-center justify-center",
                    dividerLine: "w-full border-t border-white/[0.08]",
                    dividerText:
                      "absolute bg-[#0b0e17] px-3 font-mono text-[11px] font-semibold text-white/50 uppercase tracking-widest",
                    formFieldLabel: "block text-xs font-semibold text-white/80 mb-1.5",
                    formFieldInput:
                      "w-full rounded-2xl border border-white/10 bg-[#121624] px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 transition-all",
                    formButtonPrimary:
                      "mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 active:scale-[0.99] cursor-pointer border-none",
                    footerActionLink: "font-bold text-indigo-400 hover:text-indigo-300 transition-colors ml-1",
                    footerActionText: "text-xs text-white/60",
                    identityPreviewText: "text-white text-xs",
                    identityPreviewEditButton: "text-indigo-400 text-xs font-bold",
                    formFieldAction:
                      "text-[11px] font-medium text-white/60 hover:text-indigo-300 transition-colors",
                  },
                }}
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/dashboard"
              />
            ) : (
              <div className="w-full rounded-3xl border border-white/[0.09] bg-[#0b0e17]/95 p-7 sm:p-9 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-white">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Sign in to TRACE
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-white/70">
                    Select your institutional role or demo actor to continue.
                  </p>
                </div>

                <div className="mt-7 space-y-3">
                  <Link
                    href="/dashboard"
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 transition-all hover:bg-indigo-500/20 hover:border-indigo-400"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
                        <GraduationCap size={20} />
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">Enter as Instructor</p>
                        <p className="text-[11px] text-white/60">Classroom oversight & grading</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    href="/dashboard"
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 transition-all hover:bg-cyan-500/10 hover:border-cyan-400"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300">
                        <UserCheck size={20} />
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">Enter as Student</p>
                        <p className="text-[11px] text-white/60">Lab workspace & code submissions</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    Academic integrity mode
                  </span>
                  <Link href="/dashboard" className="text-indigo-400 font-semibold hover:text-indigo-300">
                    Open dashboard &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
