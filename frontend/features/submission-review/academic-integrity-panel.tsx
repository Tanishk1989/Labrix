"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Code2,
  Copy,
  Fingerprint,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { AttemptProcessAnalysis } from "@/server/evidence/integrity-engine";
import type { VivaGenerationResult } from "@/server/evidence/viva-generator";
import {
  normalizeSourceToASTTokens,
  type PairwiseStructuralSimilarity,
} from "@/server/evidence/structural-ast-comparator";

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
  cohortSimilarity?: PairwiseStructuralSimilarity | null;
  peerComparisons?: PairwiseStructuralSimilarity[];
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
  cohortSimilarity = null,
}: AcademicIntegrityPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [copiedAllQuestions, setCopiedAllQuestions] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState(false);
  const [simulatedQuestionId, setSimulatedQuestionId] = useState<string | null>(null);
  const [showAstTokens, setShowAstTokens] = useState(false);
  const [showMatchedBlocks, setShowMatchedBlocks] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  // Compute AST tokens from source code
  const astTokens = sourceCode ? normalizeSourceToASTTokens(sourceCode, language) : [];
  const uniqueVarCount = new Set(astTokens.filter((t) => t.token.startsWith("VAR_")).map((t) => t.token)).size;
  const keywordCount = astTokens.filter((t) => t.token.startsWith("KW_")).length;
  const opCount = astTokens.filter((t) => t.token.startsWith("OP_")).length;

  const simScore = cohortSimilarity?.structuralSimilarityPercentage ?? 0;
  const isCollusion = cohortSimilarity?.verdict === "STRUCTURAL_COLLUSION_FLAG" || simScore >= 78;
  const isSuspicious = !isCollusion && (cohortSimilarity?.verdict === "SUSPICIOUS_SIMILARITY" || simScore >= 45);

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

  function copyAllQuestions() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      const fullSheet = [
        `======================================================`,
        `TRACE ORAL DEFENSE / VIVA EVALUATION SHEET`,
        `Student: ${studentName}`,
        `Practical: ${practicalTitle} (${classroomName})`,
        `Attempt: #${attemptNumber} | Submitted: ${new Date(submittedAt).toLocaleString("en-IN")}`,
        `======================================================\n`,
        ...vivaDefense.questions.map((q, idx) =>
          `[Q${idx + 1}] ${q.title} (${q.rubricFocus})\nQuestion: ${q.question}\nTeacher Evaluation Guide: ${q.expectedAnswerHint}\n`
        ),
        `\nConstructive Feedback Draft:\n${vivaDefense.feedbackDraft}`,
      ].join("\n");

      navigator.clipboard.writeText(fullSheet);
      setCopiedAllQuestions(true);
      setTimeout(() => setCopiedAllQuestions(false), 2500);
    }
  }

  function applyFeedbackToReviewForm() {
    if (typeof document !== "undefined") {
      const feedbackTextarea = document.querySelector<HTMLTextAreaElement>('textarea[name="feedback"]');
      if (feedbackTextarea) {
        feedbackTextarea.value = vivaDefense.feedbackDraft;
        feedbackTextarea.dispatchEvent(new Event("input", { bubbles: true }));
        feedbackTextarea.focus();
        feedbackTextarea.scrollIntoView({ behavior: "smooth", block: "center" });
        setAppliedFeedback(true);
        setTimeout(() => setAppliedFeedback(false), 3000);
      }
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
        className={`rounded-2xl border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6 transition-all ${
          isCollusion
            ? "border-rose-500/30 bg-gradient-to-b from-rose-950/20 via-[var(--surface)] to-[var(--surface)]"
            : isSuspicious
            ? "border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-[var(--surface)] to-[var(--surface)]"
            : "border-white/[0.12]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`grid size-8 place-items-center rounded-xl border ${
                isCollusion
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-400"
                  : isSuspicious
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                  : "border-cyan-500/30 bg-cyan-500/15 text-cyan-400"
              }`}
            >
              {isCollusion ? <ShieldAlert size={17} /> : <Fingerprint size={17} aria-hidden="true" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="structural-ast-heading" className="text-sm font-bold tracking-tight text-white">
                  Structural AST Plagiarism &amp; Invariant Fingerprint
                </h2>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                    isCollusion
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                      : isSuspicious
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                  }`}
                >
                  {isCollusion ? "Collusion Flag" : isSuspicious ? "Suspicious Similarity" : "MOSS-Grade Invariants"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Lexical AST normalization — Variable renaming &amp; comment alterations have zero masking effect
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExplainer(!showExplainer)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:text-white"
            >
              <HelpCircle size={13} />
              <span>{showExplainer ? "Hide Invariant Guide" : "How AST Detection Works"}</span>
            </button>
            {cohortSimilarity && cohortSimilarity.matchedLineBlocks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMatchedBlocks(!showMatchedBlocks)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
              >
                <Layers size={13} />
                <span>{showMatchedBlocks ? "Hide Match Blocks" : `Matched Blocks (${cohortSimilarity.matchedBlocksCount})`}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAstTokens(!showAstTokens)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              <Code2 size={13} />
              <span>{showAstTokens ? "Hide AST Stream" : "Inspect Canonical AST"}</span>
            </button>
          </div>
        </div>

        {/* EDUCATIONAL EXPLAINER CARD */}
        {showExplainer && (
          <div className="mt-4 rounded-xl border border-cyan-500/30 bg-[#070b14] p-4.5 space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white tracking-wide">
                  How MOSS-Grade Structural AST Invariants Work
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Plagiarism Protection Primer
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs text-white/80">
              <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-1">
                <span className="font-bold text-cyan-300 block">1. Variable Renaming Immune</span>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Identifiers like <code className="text-cyan-200">arr</code> or <code className="text-cyan-200">maxVal</code> are normalized to <code className="text-cyan-200">VAR_1, VAR_2</code>. Renaming variables leaves the syntax token hashes identical.
                </p>
              </div>

              <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-1">
                <span className="font-bold text-purple-300 block">2. Comment &amp; Whitespace Neutral</span>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Adding, altering, or removing comments, blank lines, and indentation has zero impact on the polynomial rolling hash fingerprints.
                </p>
              </div>

              <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-1">
                <span className="font-bold text-amber-300 block">3. Threshold Criteria</span>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  <span className="text-rose-400 font-bold">&ge;78%</span>: Structural Collusion Flag &middot; <span className="text-amber-400 font-bold">48%–77%</span>: Suspicious Overlap &middot; <span className="text-emerald-400 font-bold">&lt;45%</span>: Authentic Divergence.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AST Invariant Metrics Grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div
            className={`rounded-xl border p-3.5 ${
              isCollusion
                ? "border-rose-500/30 bg-rose-950/30"
                : isSuspicious
                ? "border-amber-500/30 bg-amber-950/30"
                : "border-white/10 bg-black/40"
            }`}
          >
            <div className="text-[11px] font-medium text-white/50">Structural Similarity vs Cohort</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`font-mono text-xl font-bold ${
                  isCollusion ? "text-rose-400" : isSuspicious ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {simScore > 0 ? `${simScore}%` : "0% (Solo)"}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  isCollusion ? "text-rose-300" : isSuspicious ? "text-amber-300" : "text-emerald-300"
                }`}
              >
                {isCollusion
                  ? "● Structural Collusion Flag"
                  : isSuspicious
                  ? "● Moderate Overlap"
                  : "● Authentic Divergence"}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-white/60 leading-relaxed">
              {cohortSimilarity
                ? `${cohortSimilarity.explanation} (${cohortSimilarity.studentBName ? `Matched vs ${cohortSimilarity.studentBName}` : "No match"})`
                : "No matching peer submissions found in practical."}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <div className="text-[11px] font-medium text-white/50">Normalized Syntax Tokens</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold text-white">{astTokens.length}</span>
              <span className="text-[10px] text-white/50">({uniqueVarCount} vars · {keywordCount} keywords · {opCount} ops)</span>
            </div>
            <p className="mt-1 text-[10px] text-white/40 leading-relaxed">
              All variable names canonicalized into invariant symbol stream.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <div className="text-[11px] font-medium text-white/50">Renaming Invariant Shield</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>
                {cohortSimilarity?.variableRenamingDetected
                  ? "Variable Renaming Detected & Flagged"
                  : "Variable Masking Immune"}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-white/40 leading-relaxed">
              {cohortSimilarity?.variableRenamingDetected
                ? "Identical control flow tokens detected despite renaming identifiers (e.g. `i` to `j`, `arr` to `nums`)."
                : "Renaming `i` to `index` or swapping variable names produces identical token hashes."}
            </p>
          </div>
        </div>

        {/* MATCHED LINE BLOCKS PREVIEW */}
        {showMatchedBlocks && cohortSimilarity && cohortSimilarity.matchedLineBlocks.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-[#0d0f15] p-4 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 border-b border-white/5 pb-2">
              <span>Matched AST Subsequences vs {cohortSimilarity.studentBName}</span>
              <span className="font-mono text-[10px] text-amber-400">{cohortSimilarity.matchedBlocksCount} Region(s)</span>
            </div>
            <div className="space-y-2">
              {cohortSimilarity.matchedLineBlocks.map((block, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-black/40 border border-white/5 p-2 text-xs font-mono text-white/80">
                  <span>Lines {block.startLineA}–{block.endLineA} (Current)</span>
                  <span className="text-white/40">matches</span>
                  <span>Lines {block.startLineB}–{block.endLineB} ({cohortSimilarity.studentBName})</span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                    {block.matchedTokensCount} tokens
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                Process Telemetry &amp; Verification Evidence
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

          <button
            type="button"
            onClick={copyAllQuestions}
            className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-500/20 hover:text-white"
          >
            <Copy size={12} />
            <span>{copiedAllQuestions ? "Copied All 4 Questions!" : "Copy Full Viva Sheet"}</span>
          </button>
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
                  &quot;{q.question}&quot;
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

        {/* Constructive Feedback Assistant with 1-Click Apply */}
        <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-4 bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--color-brand)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">AI Constructive Feedback Draft</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applyFeedbackToReviewForm}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-all ${
                  appliedFeedback
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 hover:text-white"
                }`}
              >
                <Zap size={12} />
                <span>{appliedFeedback ? "Applied to Review Form!" : "Insert into Review Form"}</span>
              </button>
              <button
                type="button"
                onClick={() => copyFeedbackText(vivaDefense.feedbackDraft)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-white"
              >
                <Copy size={11} /> {copiedFeedback ? "Copied!" : "Copy Draft"}
              </button>
            </div>
          </div>
          <p className="mt-2.5 text-xs text-[var(--text-secondary)] leading-5 italic bg-[var(--surface-elevated)] p-3 rounded-lg border border-[var(--border)]">
            &quot;{vivaDefense.feedbackDraft}&quot;
          </p>
        </div>
      </section>
    </div>
  );
}
