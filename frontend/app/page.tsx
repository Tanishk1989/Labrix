"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowDown,
  Beaker,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Cpu,
  FileCode2,
  Fingerprint,
  GraduationCap,
  Layers,
  Mic,
  Plus,
  Minus,
  Play,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  Zap,
} from "lucide-react";
import { TraceMark } from "@/components/trace-logo";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does TRACE verify real student code authoring?",
      a: "TRACE captures continuous background keystroke telemetry, edit velocity, and AST (Abstract Syntax Tree) invariance checkpoints during the practical. It mathematically compares the structural cadence with expected student problem-solving patterns to guarantee authentic code creation.",
    },
    {
      q: "How does the AI Oral Viva defense work?",
      a: "As students write code, TRACE analyzes their unique AST diffs, variable renamings, and algorithmic complexity choices. It then generates targeted, dynamic oral defense questions specifically testing the student's conceptual comprehension of their own submitted logic.",
    },
    {
      q: "Are C++, Java, and Python execution environments fully isolated?",
      a: "Yes. Every practical executes inside a containerized sandbox with hard CPU, memory, and network isolation limits. Code runs against automated test cases without exposing host machine vulnerabilities.",
    },
    {
      q: "Can university instructors customize rubrics and viva strictness?",
      a: "Absolutely. Teachers can author custom assignments, configure starter code templates, select automated unit tests, and adjust viva AI defense difficulty directly from the teacher workspace.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#05070d] text-white selection:bg-lime-400 selection:text-black font-sans antialiased overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 size-[800px] rounded-full bg-lime-500/[0.07] blur-[150px]" />
      <div className="pointer-events-none fixed top-[30%] -left-40 size-[600px] rounded-full bg-emerald-500/[0.05] blur-[140px]" />
      <div className="pointer-events-none fixed top-[65%] -right-40 size-[600px] rounded-full bg-cyan-500/[0.05] blur-[140px]" />

      {/* ─── 1. NAVBAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#05070d]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
          {/* Brand Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="grid size-9 place-items-center rounded-xl border border-lime-500/30 bg-black/70 shadow-[0_0_15px_rgba(163,230,53,0.25)] transition-all group-hover:scale-105 group-hover:border-lime-400">
              <TraceMark size={19} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              TRACE<span className="text-lime-400">OS</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#blueprint" className="hover:text-white transition-colors">Blueprint</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-xs sm:text-sm font-medium text-white/80 hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#a3e635] px-4 py-2 text-xs sm:text-sm font-bold text-black shadow-[0_0_20px_rgba(163,230,53,0.35)] transition-all hover:bg-[#bef264] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] active:scale-95"
            >
              <span>Launch Lab</span>
              <ArrowRight size={14} className="stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ──────────────────────────────────── */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 px-6 lg:px-12">
        <div className="mx-auto max-w-7xl text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-500/30 bg-lime-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-lime-300 mb-8 shadow-[0_0_20px_rgba(163,230,53,0.15)]">
            <Sparkles size={13} />
            <span>Autonomous CS Lab Operating System</span>
          </div>

          {/* Big Headline */}
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] text-white">
            Turn coding practicals <br />
            into <span className="text-lime-400 drop-shadow-[0_0_40px_rgba(163,230,53,0.45)]">mastery.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-7 max-w-2xl text-base sm:text-lg lg:text-xl text-white/65 font-normal leading-relaxed">
            Continuous keystroke telemetry, AST invariance proofs, and real-time oral viva grading built specifically for computer science departments.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#a3e635] px-7 py-4 text-sm sm:text-base font-bold text-black shadow-[0_0_35px_rgba(163,230,53,0.4)] transition-all hover:bg-[#bef264] hover:shadow-[0_0_45px_rgba(163,230,53,0.6)] active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} className="stroke-[2.5]" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.05] px-7 py-4 text-sm sm:text-base font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/25 active:scale-95"
            >
              <Terminal size={17} className="text-lime-400" />
              <span>Try Interactive Demo</span>
            </Link>
          </div>

          {/* ─── Hero Floating Visual Network Graphic ───────────── */}
          <div className="mt-16 sm:mt-24 relative max-w-5xl mx-auto">
            {/* Center Main Card */}
            <div className="relative z-20 rounded-3xl border border-white/15 bg-[#0b0e17]/90 p-6 sm:p-10 shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(163,230,53,0.1)] backdrop-blur-3xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-rose-500/80 animate-ping" />
                  <span className="font-mono text-xs text-lime-400 font-bold uppercase tracking-wider">
                    TRACE Core Active · Session Telemetry Stream
                  </span>
                </div>
                <span className="font-mono text-xs text-white/50">AST-2026.4</span>
              </div>

              {/* Node Network Map */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Node 1 */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-left">
                  <div className="flex items-center gap-2 text-lime-400 text-xs font-mono font-bold mb-1">
                    <Terminal size={14} />
                    <span>Keystroke Cadence</span>
                  </div>
                  <p className="text-xs text-white/60 font-mono">142 WPM · 99.2% Organic</p>
                </div>

                {/* Center Core Pulse */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-lime-500/40 bg-lime-500/10 shadow-[0_0_30px_rgba(163,230,53,0.2)]">
                  <TraceMark size={36} />
                  <span className="mt-2 text-xs font-bold text-lime-300 font-mono">INVARIANT MATCHED</span>
                </div>

                {/* Node 2 */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-left">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold mb-1">
                    <BrainCircuit size={14} />
                    <span>Oral Viva Defense</span>
                  </div>
                  <p className="text-xs text-white/60 font-mono">Score: 98/100 · A+ Grade</p>
                </div>
              </div>
            </div>

            {/* Orbiting Glass Cards */}
            <div className="hidden lg:block absolute -top-8 -left-12 z-30 rounded-2xl border border-white/10 bg-[#0d1017]/95 p-4 shadow-2xl backdrop-blur-2xl text-left w-64">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Activity size={13} className="text-lime-400" />
                  Live Invariant
                </span>
                <span className="text-[10px] font-mono text-lime-400">98.4%</span>
              </div>
              <div className="flex items-end gap-1 h-6">
                {[30, 70, 45, 90, 60, 100, 75, 40, 85, 95, 50, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-lime-400 rounded-full" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            <div className="hidden lg:block absolute -bottom-6 -right-10 z-30 rounded-2xl border border-white/10 bg-[#0d1017]/95 p-4 shadow-2xl backdrop-blur-2xl text-left w-64">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
                <Target size={14} className="text-rose-400" />
                <span>Zero Plagiarism Proof</span>
              </div>
              <p className="text-xs text-white/60 font-mono">AST Canonical Hash Verified</p>
              <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-lime-400 w-[96%]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. WHY TRACE (Feature Showcase Alternating Rows) ──── */}
      <section id="features" className="py-24 border-t border-white/[0.08] px-6 lg:px-12 bg-gradient-to-b from-transparent via-black/40 to-transparent">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl text-white tracking-tight">
              Why TRACE OS?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/60 max-w-xl mx-auto">
              Automate verification and viva defense without disrupting student coding focus.
            </p>
          </div>

          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="rounded-3xl border border-white/10 bg-[#0c0f18] p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="font-mono text-lime-400 font-bold flex items-center gap-1.5">
                    <Terminal size={14} />
                    Live Telemetry Stream
                  </span>
                  <span className="text-rose-400 font-mono text-[10px] font-bold">● LIVE</span>
                </div>
                <div className="flex items-end gap-1.5 h-12 mb-4">
                  {[20, 60, 40, 80, 100, 70, 90, 30, 85, 95, 60, 75, 100, 45, 90].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-lime-600 to-lime-400 rounded-full" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <p className="font-mono text-xs text-white/60">
                  &quot;The AST invariant &lambda; satisfies O(1) amortized growth...&quot;
                </p>
              </div>

              <div>
                <span className="font-mono text-xs font-bold text-lime-400 uppercase tracking-wider">
                  01. Telemetry Capture
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
                  Labs move faster than you can proctor.
                </h3>
                <p className="mt-4 text-white/65 leading-relaxed text-sm sm:text-base">
                  Every keystroke, compilation error, and structural refactor is logged as a mathematical proof timeline. Teachers see who actually wrote the code, not just who submitted it.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
              <div className="lg:order-2 rounded-3xl border border-white/10 bg-[#0c0f18] p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-4">
                  <BrainCircuit size={16} className="text-lime-400" />
                  <span>Dynamic Viva Question Tree</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-300">
                    &quot;Why did you choose an amortized array resizing over a linked list?&quot;
                  </div>
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-white/70">
                    &quot;Explain how line 42 avoids off-by-one memory corruption in pointer traversal.&quot;
                  </div>
                </div>
              </div>

              <div className="lg:order-1">
                <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  02. AI Viva Defense
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
                  Viva defense questions that write themselves.
                </h3>
                <p className="mt-4 text-white/65 leading-relaxed text-sm sm:text-base">
                  TRACE examines the exact AST differential of each submission, generating hyper-targeted questions that test genuine student mastery in seconds.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="rounded-3xl border border-white/10 bg-[#0c0f18] p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-white">Data Structures Lab (CS201)</span>
                  <span className="text-lime-400 font-mono font-bold">94% Score</span>
                </div>
                <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-lime-400 w-[94%] shadow-[0_0_15px_rgba(163,230,53,0.8)]" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-lime-400 font-bold text-sm">98%</p>
                    <p className="text-white/40 text-[10px] mt-0.5">Integrity</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-cyan-400 font-bold text-sm">O(N)</p>
                    <p className="text-white/40 text-[10px] mt-0.5">Complexity</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-emerald-400 font-bold text-sm">A+</p>
                    <p className="text-white/40 text-[10px] mt-0.5">Predicted</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  03. Integrity Proofs
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
                  Scores &amp; proofs tailored to every practical.
                </h3>
                <p className="mt-4 text-white/65 leading-relaxed text-sm sm:text-base">
                  Provide unambiguous grading proofs to department heads and accreditation boards with immutable cryptographic telemetry records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. METRICS / STATS BAR ───────────────────────────── */}
      <section className="py-16 border-y border-white/[0.08] bg-black/60 px-6 lg:px-12">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl sm:text-5xl font-extrabold text-lime-400 font-mono">0.4s</p>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">AST Invariant Verification</p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-extrabold text-white font-mono">12</p>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">Monitored Invariant Checks</p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-extrabold text-cyan-400 font-mono">98.8%</p>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">Confidence Accuracy</p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono">A+</p>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">Auto Grade Prediction</p>
          </div>
        </div>
      </section>

      {/* ─── 5. ARCHITECTURE SECTION ──────────────────────────── */}
      <section id="architecture" className="py-24 px-6 lg:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl text-white tracking-tight">
            Built with a modern <span className="text-lime-400">AI architecture</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
            High-throughput container isolation, abstract syntax tree parsers, and realtime telemetry.
          </p>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Code2, title: "Next.js 16", desc: "Turbopack App Router" },
              { icon: Cpu, title: "Docker Sandboxes", desc: "C++ & Java Isolation" },
              { icon: Terminal, title: "Prisma ORM", desc: "PostgreSQL Database" },
              { icon: BrainCircuit, title: "AST Parser", desc: "Tree Invariant Engine" },
              { icon: Zap, title: "Fast Keystrokes", desc: "Cadence Verification" },
              { icon: ShieldCheck, title: "Clerk SSO", desc: "Google & GitHub OAuth" },
              { icon: Layers, title: "Tailwind CSS", desc: "Glassmorphism UI" },
              { icon: Activity, title: "Live Telemetry", desc: "Realtime Audio/Viva" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-[#0d1018] p-5 text-left transition-all hover:border-lime-500/30 hover:scale-[1.02]"
                >
                  <Icon size={20} className="text-lime-400 mb-3" />
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-white/50 mt-1">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 6. ENGINEERING BLUEPRINT ─────────────────────────── */}
      <section id="blueprint" className="py-24 border-t border-white/[0.08] px-6 lg:px-12 bg-black/40">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-bold text-lime-400 uppercase tracking-widest">
              HOW IT WORKS
            </span>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl text-white tracking-tight">
              The Engineering Blueprint
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                badge: "TELEMETRY",
                title: "Cadence Capture",
                text: "Captures typing bursts, backspaces, and compilation cycles without intrusive camera proctoring.",
              },
              {
                step: "02",
                badge: "AST PROOF",
                title: "Syntax Invariants",
                text: "Validates code structure against LLM paste anomalies and illicit copy-paste injection.",
              },
              {
                step: "03",
                badge: "ORAL VIVA",
                title: "Automated Defense",
                text: "Prompts student with questions uniquely derived from their written algorithmic flow.",
              },
              {
                step: "04",
                badge: "INTEGRITY",
                title: "Final Certification",
                text: "Compiles a certified grading ledger for teachers with zero grading backlog.",
              },
            ].map((col, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-[#0d1017] p-6 text-left transition-all hover:border-lime-500/30"
              >
                <div className="flex items-center justify-between text-xs font-mono mb-4">
                  <span className="text-white/40 font-bold">{col.step}</span>
                  <span className="rounded-md border border-lime-500/30 bg-lime-500/10 px-2 py-0.5 text-[10px] font-bold text-lime-300">
                    {col.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{col.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{col.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. FAQ ACCORDION ─────────────────────────────────── */}
      <section id="faq" className="py-24 border-t border-white/[0.08] px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold sm:text-4xl text-white tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-[#0c0e17] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-white hover:text-lime-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <Minus size={18} className="text-lime-400" /> : <Plus size={18} className="text-white/40" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-white/60 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 8. FINAL BOTTOM CALL TO ACTION ───────────────────── */}
      <section className="py-24 border-t border-white/[0.08] px-6 lg:px-12 bg-gradient-to-b from-transparent to-lime-500/[0.04]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
            Built for CS practicals. <br />
            <span className="text-lime-400">Designed for academic mastery.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/60 max-w-xl mx-auto">
            Experience the autonomous computer science laboratory environment now.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#a3e635] px-8 py-4 text-sm sm:text-base font-bold text-black shadow-[0_0_35px_rgba(163,230,53,0.4)] transition-all hover:bg-[#bef264] active:scale-95"
            >
              <span>Launch Free Lab</span>
              <ArrowRight size={18} className="stroke-[2.5]" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.05] px-8 py-4 text-sm sm:text-base font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95"
            >
              <span>Sign In with SSO</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 9. FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] py-12 px-6 lg:px-12 bg-[#030508]">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-lg border border-lime-500/30 bg-black">
              <TraceMark size={15} />
            </div>
            <span className="text-sm font-bold text-white">
              TRACE<span className="text-lime-400">OS</span>
            </span>
          </div>

          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} TRACE OS. Built for autonomous computer science practicals.
          </p>

          <div className="flex items-center gap-6 text-xs text-white/60">
            <Link href="/dashboard" className="hover:text-lime-400">Dashboard</Link>
            <Link href="/sign-in" className="hover:text-lime-400">Sign In</Link>
            <Link href="/sign-up" className="hover:text-lime-400">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
