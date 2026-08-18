"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDown,
  BrainCircuit,
  Code2,
  Cpu,
  FileCode2,
  Fingerprint,
  GraduationCap,
  Layers,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
} from "lucide-react";
import { TraceLogo } from "@/components/trace-logo";

export function AuthVisualSide() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden p-8 sm:p-12 lg:p-16 h-full min-h-[680px]">
      {/* Ambient background glow orbs */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 size-[420px] rounded-full bg-lime-500/10 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 size-[420px] rounded-full bg-cyan-500/10 blur-[100px]"
        aria-hidden="true"
      />

      {/* Top Brand Logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="grid size-12 place-items-center rounded-2xl border border-lime-500/30 bg-black/70 shadow-[0_0_25px_rgba(163,230,53,0.25)] transition-all group-hover:scale-105 group-hover:border-lime-400">
            <TraceLogo size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            TRACE<span className="text-lime-400">OS</span>
          </span>
        </Link>
      </div>

      {/* Hero Headline & Value Props */}
      <div className="relative z-10 my-auto py-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[56px] leading-[1.08]">
          Turn coding practicals <br className="hidden sm:inline" />
          into <span className="text-lime-400 drop-shadow-[0_0_30px_rgba(163,230,53,0.4)]">mastery.</span>
        </h1>

        <div className="mt-6 space-y-2 text-sm sm:text-base text-white/70 font-medium max-w-md">
          <p>Capture keystrokes &amp; real-time session telemetry.</p>
          <p>Understand structural AST invariants.</p>
          <p>Master oral viva code defense.</p>
          <p className="text-lime-400 font-semibold pt-1">AI-powered academic integrity built for CS labs.</p>
        </div>

        {/* Floating Glassmorphism Preview Cards matching the exact layout */}
        <div className="mt-10 relative max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
            
            {/* Card 1 (Left Top): Live Telemetry */}
            <div className="sm:col-span-7 rounded-2xl border border-white/10 bg-[#0d1017]/90 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-lime-500/30 hover:shadow-lime-500/5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Terminal size={14} className="text-lime-400" />
                  <span>Live Telemetry</span>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
                  LIVE
                </span>
              </div>
              {/* Waveform graphic */}
              <div className="mt-3 flex items-end gap-1 h-7">
                {[35, 60, 25, 80, 95, 40, 70, 90, 55, 85, 30, 75, 100, 45, 65, 85, 30, 60].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-gradient-to-t from-lime-600/40 to-lime-400"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-[11px] font-mono text-white/60 truncate">
                &quot;The AST invariant &lambda; satisfies O(1) amortized...&quot;
              </p>
            </div>

            {/* Card 2 (Right Side): Viva Defense Node Hierarchy */}
            <div className="sm:col-span-5 rounded-2xl border border-white/10 bg-[#0d1017]/90 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-lime-500/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2.5">
                <BrainCircuit size={14} className="text-lime-400" />
                <span>Viva Defense</span>
              </div>
              
              <div className="flex flex-col items-center gap-1 text-[10px] font-mono font-medium">
                <span className="w-full text-center py-1 px-2 rounded-lg border border-lime-400/30 bg-lime-400/10 text-lime-300 font-bold">
                  Dynamic Array
                </span>
                <ArrowDown size={10} className="text-white/40" />
                <span className="w-full text-center py-1 px-2 rounded-lg border border-white/10 bg-white/5 text-white/80">
                  Amortized O(1)
                </span>
                <ArrowDown size={10} className="text-white/40" />
                <span className="w-full text-center py-1 px-2 rounded-lg border border-white/10 bg-white/5 text-white/60">
                  Memory Growth
                </span>
              </div>
            </div>

            {/* Card 3 (Bottom Spanning): Integrity & Grade Forecast */}
            <div className="sm:col-span-8 rounded-2xl border border-white/10 bg-[#0d1017]/90 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-lime-500/30">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Target size={14} className="text-rose-400" />
                  <span>Integrity &amp; Grade Forecast</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-lime-400">94%</span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-white">Data Structures Lab (CS201)</p>
              
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[94%] rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.9)]" />
              </div>
              
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-lime-300 font-bold">A+ Predicted</span>
                <span className="text-white/50">Zero Plagiarism Invariant</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 text-xs text-white/40">
        &copy; {new Date().getFullYear()} TRACE Lab OS. Built for autonomous computer science practicals.
      </div>
    </div>
  );
}
