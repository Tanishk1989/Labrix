"use client";

import React from "react";
import Link from "next/link";
import {
  BrainCircuit,
  CheckCircle2,
  GitCompareArrows,
  ShieldCheck,
  TerminalSquare,
  Sparkles,
} from "lucide-react";
import { TraceMark } from "@/components/trace-logo";

export function AuthVisualSide() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden p-6 sm:p-10 lg:p-12 xl:p-16 h-full min-h-[640px]">
      {/* Ambient background glow orbs */}
      <div
        className="pointer-events-none absolute -left-28 -top-28 size-[520px] rounded-full bg-indigo-500/15 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-6 left-1/3 size-[440px] rounded-full bg-cyan-500/10 blur-[130px]"
        aria-hidden="true"
      />

      {/* Top Brand Logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group" aria-label="TRACE home">
          <div className="grid size-11 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all group-hover:scale-105 group-hover:border-indigo-400">
            <TraceMark size={22} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-sans">
            TRACE
          </span>
        </Link>
      </div>

      {/* Hero Headline & Value Props */}
      <div className="relative z-10 my-auto py-8 lg:py-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[54px] leading-[1.08]">
          Practical assessment <br className="hidden sm:inline" />
          built on <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">real evidence.</span>
        </h1>

        <div className="mt-6 space-y-2.5 text-sm sm:text-base text-white/70 font-medium max-w-xl leading-relaxed">
          <p>Trace student problem-solving without intrusive surveillance.</p>
          <p>Review deterministic test execution, structural signals, and live drafts.</p>
          <p>Support confident oral defense with contextual viva prompts.</p>
          <p className="text-cyan-300 font-semibold pt-1 text-sm sm:text-base flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400 shrink-0" aria-hidden="true" />
            Designed for authentic university computer science labs.
          </p>
        </div>

        {/* Floating Glassmorphism Preview Cards */}
        <div className="mt-10 relative max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
            
            {/* Card 1 (Left Top): Submission & Execution Evidence */}
            <div className="sm:col-span-7 rounded-2xl border border-white/[0.08] bg-[#0c101a]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all hover:border-indigo-500/30">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <TerminalSquare size={16} className="text-indigo-400" />
                  <span>Execution Evidence</span>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Passed
                </span>
              </div>

              {/* Execution stats */}
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5">
                  <span className="text-[10px] uppercase font-mono text-white/50 block">Tests</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={13} className="text-emerald-400" /> 5 of 6 (83%)
                  </span>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5">
                  <span className="text-[10px] uppercase font-mono text-white/50 block">Runtime</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono mt-0.5 block">142ms · Java 21</span>
                </div>
              </div>

              <p className="mt-3 text-xs font-mono text-white/60 truncate">
                Immutable attempt snapshot captured with full execution log.
              </p>
            </div>

            {/* Card 2 (Right Side): Viva Defense & AST Analysis */}
            <div className="sm:col-span-5 rounded-2xl border border-white/[0.08] bg-[#0c101a]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all hover:border-indigo-500/30">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white mb-3">
                <BrainCircuit size={16} className="text-cyan-400" />
                <span>Oral Defense</span>
              </div>
              
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1.5 text-indigo-300 font-medium">
                  Approach: Binary Search
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1.5 text-white/80">
                  Complexity: O(log N)
                </div>
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1.5 text-cyan-300 font-medium flex items-center gap-1.5">
                  <GitCompareArrows size={12} /> 2 Viva Prompts Ready
                </div>
              </div>
            </div>

            {/* Card 3 (Bottom Spanning): Academic Integrity Without Surveillance */}
            <div className="sm:col-span-12 rounded-2xl border border-white/[0.08] bg-[#0c101a]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all hover:border-indigo-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                  <ShieldCheck size={16} className="text-indigo-400" />
                  <span>Academic Integrity by Design</span>
                </div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                  Zero Surveillance
                </span>
              </div>
              <p className="mt-2 text-xs text-white/70">
                Evaluation built from code structure, progression history, and oral defense — no invasive screen recordings or webcams.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 text-xs text-white/50 pt-4">
        &copy; {new Date().getFullYear()} TRACE. Trace the work, not the screen.
      </div>
    </div>
  );
}
