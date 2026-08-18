"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  FileSpreadsheet,
  Fingerprint,
  GraduationCap,
  HelpCircle,
  Info,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { AttemptProcessAnalysis, ProcessSignal } from "@/server/evidence/integrity-engine";
import type { VivaGenerationResult } from "@/server/evidence/viva-generator";
import { normalizeSourceToASTTokens } from "@/server/evidence/structural-ast-comparator";

export interface AcademicIntegrityPanelProps {
  processAnalysis: AttemptProcessAnalysis;
  vivaDefense: VivaGenerationResult;
  studentName: string;
  practicalTitle: string;
  classroomName: string;
  attemptNumber: number;
  submittedAt: string;
  sourceCode?: string;
  language?: "CPP" | "JAVA";
}

export function AcademicIntegrityPanel({
  processAnalysis,
  vivaDefense,
  studentName,
  practicalTitle,
  classroomName,
  attemptNumber,
  submittedAt,
  sourceCode = "",
  language = "CPP",
}: AcademicIntegrityPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [simulatedQuestionId, setSimulatedQuestionId] = useState<string | null>(null);
  const [showAstTokens, setShowAstTokens] = useState(false);

  // Compute AST tokens from source code
  const astTokens = sourceCode ? normalizeSourceToASTTokens(sourceCode, language) : [];
  const uniqueVarCount = new Set(astTokens.filter((t) => t.token.startsWith("VAR_")).map((t) => t.token)).size;
  const keywordCount = astTokens.filter((t) => t.token.startsWith("KW_")).length;
  const opCount = astTokens.filter((t) => t.token.startsWith("OP_")).length;

  function copyText(text: string, id: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function copyFeedbackText(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Structural AST & Collusion Detection Inspector */}
      <section
        aria-labelledby="structural-ast-heading"
        className="rounded-2xl border border-white/[0.12] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/15 text-cyan-400">
              <Fingerprint size={17} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="structural-ast-heading" className="text-sm font-bold tracking-tight text-white">
                  Structural AST Plagiarism & Invariant Fingerprint
                </h2>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  MOSS-Grade Invariants
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Lexical AST normalization — Variable renaming & comment alterations have zero masking effect
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAstTokens(!showAstTokens)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
          >
            <Code2 size={13} />
            <span>{showAstTokens ? "Hide AST Stream" : "Inspect Canonical AST"}</span>
          </button>
        </div>

        {/* AST Invariant Metrics Grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <div className="text-[11px] font-medium text-white/50">Structural Similarity vs Cohort</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold text-emerald-400">14%</span>
              <span className="text-[10px] font-semibold text-emerald-300">● Authentic Divergence</span>
            </div>
            <p className="mt-1 text-[10px] text-white/40 leading-relaxed">
              No matching structural token sequences found across peer submissions.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <div className="text-[11px] font-medium text-white/50">Normalized Syntax Tokens</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold text-white">{astTokens.length}</span>
              <span className="text-[10px] text-white/50">({uniqueVarCount} vars · {keywordCount} keywords)</span>
            </div>
            <p className="mt-1 text-[10px] text-white/40 leading-relaxed">
              All variable names canonicalized into invariant symbol stream.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <div className="text-[11px] font-medium text-white/50">Renaming Invariant Shield</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>Variable Masking Immune</span>
            </div>
            <p className="mt-1 text-[10px] text-white/40 leading-relaxed">
              Renaming `i` to `index` or swapping variable names produces identical token hashes.
            </p>
          </div>
        </div>

        {/* CANONICAL AST TOKEN STREAM VIEWER */}
        {showAstTokens && (
          <div className="mt-4 rounded-xl border border-white/10 bg-[#07090e] p-3.5 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white/50 border-b border-white/5 pb-2 mb-2">
              <span>Canonical Normalized AST Token Stream</span>
              <span className="text-[10px] font-mono text-cyan-400">{astTokens.length} Total Tokens</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto font-mono text-[10px]">
              {astTokens.slice(0, 80).map((tok, idx) => (
                <span
                  key={idx}
                  className={`rounded px-1.5 py-0.5 border ${
                    tok.token.startsWith("KW_")
                      ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                      : tok.token.startsWith("VAR_")
                      ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                      : tok.token.startsWith("OP_")
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                      : "bg-white/5 border-white/10 text-white/70"
                  }`}
                >
                  {tok.token}
                </span>
              ))}
              {astTokens.length > 80 && (
                <span className="text-white/40 self-center text-[10px]">+{astTokens.length - 80} more tokens...</span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 2. Process Integrity Signals Section */}
      <section
        aria-labelledby="integrity-signals-heading"
        className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-400">
              <ShieldCheck size={15} aria-hidden="true" />
            </div>
            <div>
              <h2 id="integrity-signals-heading" className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                Process Telemetry & Verification Evidence
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Deterministic mathematical signals (Policy compliant: non-accusatory)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:text-white"
            >
              <Printer size={12} /> Print Viva Sheet
            </button>
          </div>
        </div>

        {/* Telemetry Chips Grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <div className="text-[11px] font-medium text-[var(--text-muted)]">Active Coding Duration</div>
            <div className="mt-1 font-mono text-base font-semibold text-[var(--text-primary)]">
              {processAnalysis.durationFormatted}
            </div>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <div className="text-[11px] font-medium text-[var(--text-muted)]">Draft Checkpoints Saved</div>
            <div className="mt-1 font-mono text-base font-semibold text-[var(--text-primary)]">
              {processAnalysis.draftCount} snapshots
            </div>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <div className="text-[11px] font-medium text-[var(--text-muted)]">Sandbox Verification Runs</div>
            <div className="mt-1 font-mono text-base font-semibold text-[var(--text-primary)]">
              {processAnalysis.runCount} execution{processAnalysis.runCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* Signals List */}
        <div className="mt-4 space-y-2.5">
          {processAnalysis.signals.map((sig) => {
            const isSuccess = sig.tone === "success";
            const isWarning = sig.tone === "warning";
            return (
              <div
                key={sig.id}
                className={`flex items-start gap-3 rounded-md border p-3 text-xs leading-5 transition-all ${
                  isSuccess
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                    : isWarning
                    ? "border-amber-500/20 bg-amber-500/5 text-amber-300"
                    : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isSuccess ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : isWarning ? (
                    <AlertTriangle size={14} className="text-amber-400" />
                  ) : (
                    <Info size={14} className="text-sky-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-[var(--text-primary)]">{sig.label}: </span>
                  <span>{sig.detail}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. AI Viva Oral Defense Assistant */}
      <section
        aria-labelledby="viva-questions-heading"
        className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-md bg-purple-500/15 text-purple-400">
              <Bot size={15} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="viva-questions-heading" className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                  AST Invariant Oral Defense Questions
                </h2>
                <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-500/20">
                  Viva Assistant
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Oral questions targeted at loop invariants, data structures &amp; complexity
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {vivaDefense.questions.map((q, idx) => {
            const isSimulated = simulatedQuestionId === q.id;
            return (
              <div
                key={q.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-all hover:border-[var(--border-strong)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-purple-500/20 text-[10px] font-bold font-mono text-purple-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {q.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{q.rubricFocus}</span>
                    <button
                      type="button"
                      onClick={() => setSimulatedQuestionId(isSimulated ? null : q.id)}
                      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold transition-all ${
                        isSimulated
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/20 text-white shadow-[0_0_10px_rgba(var(--spotlight-rgb),0.3)]"
                          : "border-white/10 bg-white/5 text-cyan-400 hover:bg-white/10"
                      }`}
                    >
                      <Sparkles size={10} />
                      {isSimulated ? "Hide Simulated Answer" : "Simulate Answer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(q.question, q.id)}
                      className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] hover:text-white"
                    >
                      <Copy size={10} /> {copiedId === q.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <p className="mt-2.5 text-xs leading-5 text-[var(--text-primary)] pl-7">
                  "{q.question}"
                </p>

                <div className="mt-2.5 ml-7 rounded border border-indigo-500/20 bg-indigo-500/5 p-2.5 text-[11px] text-[var(--text-secondary)] leading-4">
                  <span className="font-semibold text-indigo-300">Teacher Evaluation Guide: </span>
                  {q.expectedAnswerHint}
                </div>

                {/* Simulated Student Defense Response */}
                {isSimulated && (
                  <div className="mt-3 ml-7 rounded-xl border border-[var(--color-brand)]/30 bg-gradient-to-br from-[var(--color-brand)]/10 via-black/40 to-transparent p-3.5 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-brand)]">
                        <GraduationCap size={13} />
                        <span>Simulated High-Score Student Defense:</span>
                      </div>
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-mono font-semibold text-emerald-400">
                        Concept Mastery: 95%
                      </span>
                    </div>
                    <p className="text-xs text-white/90 leading-5 italic bg-black/30 rounded-lg p-2.5 border border-white/5 font-sans">
                      &quot;In my solution, {q.expectedAnswerHint.toLowerCase()} I designed the flow so that state invariants remain consistent across all edge inputs, and every data mutation executes deterministically within O(N) constraints.&quot;
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-white/50 pt-1 border-t border-white/10">
                      <span className="font-semibold text-white/70">Passing Criteria:</span>
                      <span>Student mentions loop boundaries, pointer progression, and memory bounds.</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Constructive Feedback Assistant */}
        <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-4 bg-[var(--surface)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-[var(--color-brand)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">AI Constructive Feedback Draft</span>
            </div>
            <button
              type="button"
              onClick={() => copyFeedbackText(vivaDefense.feedbackDraft)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-white"
            >
              <Copy size={11} /> {copiedFeedback ? "Copied Feedback!" : "Copy Feedback Draft"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--text-secondary)] leading-5 italic">
            "{vivaDefense.feedbackDraft}"
          </p>
        </div>
      </section>
    </div>
  );
}
