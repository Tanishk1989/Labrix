import Link from "next/link";
import { ArrowRight, Beaker, GraduationCap, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { AuthVisualSide } from "@/features/auth/auth-visual-side";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070911] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-lime-400 selection:text-black">
      <div className="w-full max-w-7xl rounded-3xl border border-white/[0.08] bg-[#0a0d16]/90 shadow-2xl backdrop-blur-3xl overflow-hidden grid lg:grid-cols-2 items-center">
        {/* Left Side: Hero Value Props & Floating Live Telemetry Cards */}
        <AuthVisualSide />

        {/* Right Side: Interactive Entry & Access Card */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14 border-t lg:border-t-0 lg:border-l border-white/[0.08]">
          <div className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#0f121a]/95 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl transition-all">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-lime-300 mb-3">
                <Sparkles size={12} />
                <span>Next-Gen CS Lab Operating System</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Get started with TRACE
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-white/60">
                Autonomous academic integrity, live session telemetry, and oral viva grading.
              </p>
            </div>

            {/* Quick Demo Access - Neon High-Impact CTA */}
            <div className="mt-6 space-y-3">
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#a3e635] px-4 py-4 text-xs sm:text-sm font-bold text-black shadow-[0_0_30px_rgba(163,230,53,0.4)] transition-all hover:bg-[#bef264] hover:shadow-[0_0_40px_rgba(163,230,53,0.6)] active:scale-[0.99]"
              >
                <Terminal size={17} className="text-black stroke-[2.5]" />
                <span>Enter Interactive Lab (Live Demo)</span>
                <ArrowRight size={16} className="text-black" />
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-[#0f121a] px-3 font-mono text-[11px] font-bold text-white/40 uppercase tracking-widest">
                AUTHENTICATE
              </span>
            </div>

            {/* Real Social & Email Sign In Options */}
            <div className="space-y-2.5">
              <Link
                href="/sign-in"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99]"
              >
                <svg className="size-4.5" viewBox="0 0 24 24">
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
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#161a24] px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#1f2433] hover:border-white/20 active:scale-[0.99]"
              >
                <svg className="size-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </Link>
            </div>

            {/* Footer Navigation */}
            <div className="mt-6 flex items-center justify-between text-xs text-white/60">
              <span>Have an account? <Link href="/sign-in" className="font-bold text-lime-400 hover:text-lime-300">Sign In</Link></span>
              <span>New here? <Link href="/sign-up" className="font-bold text-lime-400 hover:text-lime-300">Sign Up</Link></span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
