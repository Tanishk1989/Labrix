import Link from "next/link";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";
import { AuthVisualSide } from "@/features/auth/auth-visual-side";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-[#070911] text-white flex items-center justify-center p-6 sm:p-10 lg:p-16 xl:p-20 selection:bg-lime-400 selection:text-black">
      <div className="w-full max-w-[1680px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-24 items-center">
        {/* Left Column (Spans 7 columns on desktop for large, grand visual presence) */}
        <div className="lg:col-span-7 xl:col-span-7">
          <AuthVisualSide />
        </div>

        {/* Right Column (Spans 5 columns on desktop with large floating glass card) */}
        <div className="lg:col-span-5 xl:col-span-5 flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[480px] rounded-[32px] border border-white/10 bg-[#0d1017]/95 p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl transition-all">
            {/* Header Badge */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-500/30 bg-lime-500/10 px-3.5 py-1.5 text-xs font-mono font-semibold text-lime-300 mb-4">
                <Sparkles size={13} />
                <span>Next-Gen CS Lab Operating System</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Get started with TRACE
              </h2>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                Autonomous academic integrity, live session telemetry, and oral viva grading.
              </p>
            </div>

            {/* Quick Demo Access - Neon High-Impact CTA */}
            <div className="mt-8 space-y-3.5">
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#a3e635] px-5 py-4 text-sm sm:text-base font-bold text-black shadow-[0_0_35px_rgba(163,230,53,0.45)] transition-all hover:bg-[#bef264] hover:shadow-[0_0_45px_rgba(163,230,53,0.65)] active:scale-[0.99]"
              >
                <Terminal size={19} className="text-black stroke-[2.5]" />
                <span>Enter Interactive Lab (Live Demo)</span>
                <ArrowRight size={18} className="text-black stroke-[2.5]" />
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-7 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-[#0d1017] px-4 font-mono text-xs font-bold text-white/40 uppercase tracking-widest">
                AUTHENTICATE
              </span>
            </div>

            {/* Real Social & Email Sign In Options */}
            <div className="space-y-3">
              <Link
                href="/sign-in"
                className="flex w-full items-center justify-center gap-3.5 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99]"
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </Link>

              <Link
                href="/sign-in"
                className="flex w-full items-center justify-center gap-3.5 rounded-2xl border border-white/10 bg-[#161a24] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1f2433] hover:border-white/20 active:scale-[0.99]"
              >
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </Link>
            </div>

            {/* Footer Navigation */}
            <div className="mt-8 flex items-center justify-between text-xs sm:text-sm text-white/60">
              <span>
                Have an account?{" "}
                <Link href="/sign-in" className="font-bold text-lime-400 hover:text-lime-300">
                  Sign In
                </Link>
              </span>
              <span>
                New here?{" "}
                <Link href="/sign-up" className="font-bold text-lime-400 hover:text-lime-300">
                  Sign Up
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
