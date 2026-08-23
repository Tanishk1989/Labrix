"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Fingerprint,
  HelpCircle,
  Layers,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { CohortPlagiarismReport } from "@/server/evidence/cohort-service";

export function CohortPlagiarismAudit({
  report,
}: {
  report: CohortPlagiarismReport;
  selectedClassroomId?: string | null;
  selectedTaskId?: string | null;
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedVerdict, setSelectedVerdict] = useState<"ALL" | "FLAGGED" | "SUSPICIOUS">("ALL");
  const [expandedPairIndex, setExpandedPairIndex] = useState<number | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);

  const filteredPairs = report.pairs.filter((pair) => {
    const matchesSearch =
      !filterQuery ||
      `${pair.studentAName} ${pair.studentBName} ${pair.taskTitle} ${pair.classroomName}`
        .toLowerCase()
        .includes(filterQuery.toLowerCase());

    const matchesVerdict =
      selectedVerdict === "ALL" ||
      (selectedVerdict === "FLAGGED" && pair.verdict === "STRUCTURAL_COLLUSION_FLAG") ||
      (selectedVerdict === "SUSPICIOUS" && pair.verdict === "SUSPICIOUS_SIMILARITY");

    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards Header */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.12] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Total Analyzed</span>
            <Users size={14} className="text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white">
              {report.totalSubmissionsAnalyzed}
            </span>
            <span className="text-xs text-[var(--text-muted)]">submissions</span>
          </div>
          <p className="mt-1 text-[11px] text-white/50">Across active cohort practicals</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>Collusion Flags</span>
            <ShieldAlert size={14} className="text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-rose-400">
              {report.flaggedPairsCount}
            </span>
            <span className="text-xs text-rose-300/70">pairs (&ge;78% match)</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-300/60">High structural AST identity</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>Suspicious Overlaps</span>
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-amber-400">
              {report.suspiciousPairsCount}
            </span>
            <span className="text-xs text-amber-300/70">pairs (48%–77%)</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-300/60">Moderate structural overlap</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span>Invariant Engine</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold text-emerald-400 font-mono">MOSS-Grade</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-300/60">Variable renaming immune</p>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--border)] py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[15rem]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search student or practical..."
              className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedVerdict("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                selectedVerdict === "ALL"
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              All Pairs ({report.pairs.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedVerdict("FLAGGED")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                selectedVerdict === "FLAGGED"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-white/60 hover:text-rose-300"
              }`}
            >
              Collusion Flags ({report.flaggedPairsCount})
            </button>
            <button
              type="button"
              onClick={() => setShowExplainer(!showExplainer)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:text-white"
            >
              <HelpCircle size={12} />
              <span>{showExplainer ? "Hide Invariant Guide" : "How AST Detection Works"}</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-[var(--text-muted)]">
          Showing {filteredPairs.length} of {report.pairs.length} comparisons
        </div>
      </div>

      {/* EDUCATIONAL EXPLAINER CARD */}
      {showExplainer && (
        <div className="rounded-2xl border border-cyan-500/30 bg-[#070b14] p-5 space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                How TRACE Detects Plagiarism &amp; Structural Collusion
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              AST Invariant Protocol
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-3 text-xs text-white/80">
            <div className="rounded-xl bg-black/40 border border-white/5 p-3.5 space-y-1.5">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Fingerprint size={13} /> 1. Variable Renaming Immune
              </span>
              <p className="text-[11px] text-white/60 leading-relaxed">
                When a student renames variables (e.g. <code className="text-cyan-200">i &rarr; j</code> or <code className="text-cyan-200">arr &rarr; nums</code>), TRACE normalizes them to canonical AST symbols (<code className="text-cyan-200">VAR_1, VAR_2</code>). The structural signature remains 100% identical.
              </p>
            </div>

            <div className="rounded-xl bg-black/40 border border-white/5 p-3.5 space-y-1.5">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Code2 size={13} /> 2. Comment &amp; Formatting Immune
              </span>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Adding comments, deleting spacing, or rearranging indentation has zero effect on the polynomial rolling hash K-grams.
              </p>
            </div>

            <div className="rounded-xl bg-black/40 border border-white/5 p-3.5 space-y-1.5">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert size={13} /> 3. Three-Tier Policy Verdicts
              </span>
              <p className="text-[11px] text-white/60 leading-relaxed">
                <strong className="text-rose-400">&ge;78%</strong>: Structural Collusion Flag &middot; <strong className="text-amber-400">48%–77%</strong>: Suspicious Overlap &middot; <strong className="text-emerald-400">&lt;45%</strong>: Authentic Independent Divergence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Pairwise Audit Table / Cards */}
      {filteredPairs.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
            {report.pairs.length === 0
              ? "No Significant Structural Plagiarism Detected"
              : "No Pairs Match Selected Filters"}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-5">
            {report.pairs.length === 0
              ? "All submitted programs demonstrate authentic structural variance across AST control flow, nesting depth, and algorithmic tokens."
              : "Try clearing search keywords or selecting 'All Pairs' to view other student comparisons."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPairs.map((pair, index) => {
            const isFlagged = pair.verdict === "STRUCTURAL_COLLUSION_FLAG";
            const isExpanded = expandedPairIndex === index;

            return (
              <div
                key={`${pair.submissionAId}-${pair.submissionBId}`}
                className={`rounded-2xl border transition-all ${
                  isFlagged
                    ? "border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-[var(--surface)] to-[var(--surface)]"
                    : "border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-[var(--surface)] to-[var(--surface)]"
                } p-5 shadow-sm`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Left: Students pair */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {pair.studentAName}
                      </span>
                      <span className="text-xs text-white/40 font-mono">&harr;</span>
                      <span className="font-semibold text-sm text-white">
                        {pair.studentBName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                          isFlagged
                            ? "border border-rose-500/40 bg-rose-500/15 text-rose-300"
                            : "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {isFlagged ? "Structural Collusion Flag" : "Suspicious Overlap"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span>{pair.taskTitle}</span>
                      <span>&middot;</span>
                      <span>{pair.classroomName}</span>
                      {pair.variableRenamingDetected && (
                        <>
                          <span>&middot;</span>
                          <span className="font-semibold text-amber-300 flex items-center gap-1">
                            <Fingerprint size={12} /> Variable Renaming Masking Detected
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Similarity Gauge & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`font-mono text-xl font-bold ${
                          isFlagged ? "text-rose-400" : "text-amber-400"
                        }`}
                      >
                        {pair.structuralSimilarityPercentage}%
                      </div>
                      <div className="text-[10px] text-white/50">AST Overlap</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedPairIndex(isExpanded ? null : index)}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        <Layers size={13} />
                        <span>{isExpanded ? "Hide Blocks" : `Matched Blocks (${pair.matchedBlocksCount})`}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      <Link
                        href={`/submissions/${pair.submissionAId}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                        title={`Review ${pair.studentAName}'s submission`}
                      >
                        <span>Review A</span>
                        <ArrowRight size={12} />
                      </Link>

                      <Link
                        href={`/submissions/${pair.submissionBId}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                        title={`Review ${pair.studentBName}'s submission`}
                      >
                        <span>Review B</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-white/70 leading-relaxed border-t border-white/5 pt-2.5">
                  <span className="font-semibold text-white/90">Audit Explanation: </span>
                  {pair.explanation}
                </p>

                {/* Expanded Region Blocks */}
                {isExpanded && pair.matchedLineBlocks.length > 0 && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 space-y-2 animate-in fade-in">
                    <div className="text-[11px] font-bold text-white/60 border-b border-white/5 pb-1 mb-2">
                      Structural Token Matches by Line Span
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {pair.matchedLineBlocks.map((block, bIdx) => (
                        <div
                          key={bIdx}
                          className="flex items-center justify-between rounded-lg bg-white/5 border border-white/5 p-2 text-xs font-mono text-white/80"
                        >
                          <div>
                            <span className="text-cyan-300">{pair.studentAName}:</span> L{block.startLineA}–L{block.endLineA}
                          </div>
                          <span className="text-white/30">&harr;</span>
                          <div>
                            <span className="text-purple-300">{pair.studentBName}:</span> L{block.startLineB}–L{block.endLineB}
                          </div>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                            {block.matchedTokensCount} tok
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
