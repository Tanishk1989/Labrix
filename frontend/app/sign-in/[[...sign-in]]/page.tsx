import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck, UserCheck } from "lucide-react";
import { AuthVisualSide } from "@/features/auth/auth-visual-side";

export default function SignInPage() {
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
          </div>
        </div>
      </div>
    </main>
  );
}
