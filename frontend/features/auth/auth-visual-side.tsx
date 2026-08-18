"use client";

import React from "react";
import Link from "next/link";
import {
  Code2,
  Cpu,
  Fingerprint,
  GraduationCap,
  Layers,
  Mic,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { TraceLogo } from "@/components/trace-logo";

export function AuthVisualSide() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden p-8 sm:p-12 lg:p-16 h-full min-h-[640px]">
      {/* Background glow gradients */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-lime-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 size-96 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Top Brand Logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="grid size-11 place-items-center rounded-2xl border border-lime-500/30 bg-black/60 shadow-[0_0_20px_rgba(163,230,53,0.2)] transition-all group-hover:scale-105 group-hover:border-lime-400">
            <TraceLogo size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            TRACE<span className="text-lime-400">OS</span>
          </span>
        </Link>
      </div>

      {/* Hero Headline & Value Props */}
      <div className="relative z-10 my-auto py-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
          Turn coding practicals into <span className="text-lime-400 drop-shadow-[0_0_25px_rgba(163,230,53,0.35)]">mastery.</span>
        </h1>

        <div className="mt-6 space-y-2 text-sm sm:text-base text-white/70 font-medium">
          <p>Capture every keystroke &amp; session telemetry.</p>
          <p>Understand structural AST invariants.</p>
          <p>Master oral viva code defense.</p>
          <p className="text-lime-400/90 font-semibold pt-1">AI-grounded academic integrity built for CS labs.</p>
        </div>

        {/* Floating Glassmorphism Preview Cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-lg">
          {/* Card 1: Live Telemetry */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1017]/85 p-4.5 shadow-2xl backdrop-blur-xl transition-all hover:border-lime-500/30 hover:shadow-lime-500/5">
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
              {[40, 65, 30, 80, 95, 45, 70, 90, 60, 85, 35, 75, 100, 50, 65].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-gradient-to-t from-lime-600/40 to-lime-400"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] font-mono text-white/60 truncate">
              &quot;AST canonical hash &lambda; matches invariant...&quot;
            </p>
          </div>

          {/* Card 2: Integrity & Viva Focus */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1017]/85 p-4.5 shadow-2xl backdrop-blur-xl transition-all hover:border-lime-500/30 hover:shadow-lime-500/5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Fingerprint size={14} className="text-lime-400" />
                <span>Integrity Score</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-lime-400">98% Verified</span>
            </div>
            <p className="mt-2 text-xs font-bold text-white">Authentic Divergence</p>
            {/* Confidence Bar */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[94%] rounded-full bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
            </div>
            <p className="mt-2 text-[10px] font-mono text-lime-300 font-semibold">
              A+ Defense Predicted
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 text-xs text-white/40">
        &copy; {new Date().getFullYear()} TRACE Lab OS. Designed for autonomous CS academic integrity.
      </div>
    </div>
  );
}
