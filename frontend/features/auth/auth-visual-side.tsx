"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowDown,
  BrainCircuit,
  Target,
  Terminal,
} from "lucide-react";
import { TraceMark } from "@/components/trace-logo";

export function AuthVisualSide() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden p-6 sm:p-10 lg:p-14 xl:p-16 h-full min-h-[720px]">
      {/* Ambient background glow orbs */}
      <div
        className="pointer-events-none absolute -left-28 -top-28 size-[520px] rounded-full bg-lime-500/12 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-10 left-1/4 size-[480px] rounded-full bg-cyan-500/10 blur-[130px]"
        aria-hidden="true"
      />

      {/* Top Brand Logo - Fixed No Duplication */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="grid size-12 place-items-center rounded-2xl border border-lime-500/30 bg-black/80 shadow-[0_0_25px_rgba(163,230,53,0.25)] transition-all group-hover:scale-105 group-hover:border-lime-400">
            <TraceMark size={24} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white font-sans">
            TRACE<span className="text-lime-400">OS</span>
          </span>
        </Link>
      </div>

      {/* Hero Headline & Value Props */}
      <div className="relative z-10 my-auto py-8 lg:py-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[62px] xl:text-[68px] leading-[1.05]">
          Turn coding practicals <br className="hidden sm:inline" />
          into <span className="text-lime-400 drop-shadow-[0_0_35px_rgba(163,230,53,0.45)]">mastery.</span>
        </h1>

        <div className="mt-7 space-y-2.5 text-base sm:text-lg text-white/70 font-medium max-w-lg">
          <p>Preserve evidence from runs, revisions, and submissions.</p>
          <p>Understand structural solution signals.</p>
          <p>Support oral code defense with teacher-owned context.</p>
          <p className="text-lime-400 font-semibold pt-1 text-base sm:text-lg">
            AI-powered academic integrity built for CS labs.
          </p>
        </div>

        {/* Floating Glassmorphism Preview Cards matching the exact layout */}
        <div className="mt-12 relative max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
            
            {/* Card 1 (Left Top): Review evidence */}
            <div className="sm:col-span-7 rounded-2xl border border-white/10 bg-[#0d1017]/90 p-5 shadow-2xl backdrop-blur-2xl transition-all hover:border-lime-500/30 hover:shadow-lime-500/5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Terminal size={16} className="text-lime-400" />
                  <span>Submission Evidence</span>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                  <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                  READY
                </span>
              </div>
              {/* Waveform graphic */}
              <div className="mt-3.5 flex items-end gap-1.5 h-8">
                {[35, 60, 25, 80, 95, 40, 70, 90, 55, 85, 30, 75, 100, 45, 65, 85, 30, 60].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-gradient-to-t from-lime-600/40 to-lime-400"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs font-mono text-white/60 truncate">
                Tests, structure, and revision history are ready to review.
              </p>
            </div>

            {/* Card 2 (Right Side): Viva Defense Node Hierarchy */}
            <div className="sm:col-span-5 rounded-2xl border border-white/10 bg-[#0d1017]/90 p-5 shadow-2xl backdrop-blur-2xl transition-all hover:border-lime-500/30">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white mb-3">
                <BrainCircuit size={16} className="text-lime-400" />
                <span>Viva Defense</span>
              </div>
              
              <div className="flex flex-col items-center gap-1.5 text-[11px] font-mono font-medium">
                <span className="w-full text-center py-1.5 px-2.5 rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-300 font-bold">
                  Dynamic Array
                </span>
                <ArrowDown size={12} className="text-white/40" />
                <span className="w-full text-center py-1.5 px-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80">
                  Amortized O(1)
                </span>
                <ArrowDown size={12} className="text-white/40" />
                <span className="w-full text-center py-1.5 px-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60">
                  Memory Growth
                </span>
              </div>
            </div>

            {/* Card 3 (Bottom Spanning): Integrity review */}
            <div className="sm:col-span-9 rounded-2xl border border-white/10 bg-[#0d1017]/90 p-5 shadow-2xl backdrop-blur-2xl transition-all hover:border-lime-500/30">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Target size={16} className="text-rose-400" />
                  <span>Integrity Review</span>
                </div>
                <span className="text-xs font-mono font-bold text-lime-400">READY</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">Teacher-owned evidence</p>
              
              {/* Progress bar */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full rounded-full bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.9)]" />
              </div>
              
              <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
                <span className="text-lime-300 font-bold">Review context prepared</span>
                <span className="text-white/50">Evidence, not surveillance</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 text-xs sm:text-sm text-white/40 pt-4">
        &copy; {new Date().getFullYear()} TRACE Lab OS. Built for autonomous computer science practicals.
      </div>
    </div>
  );
}
