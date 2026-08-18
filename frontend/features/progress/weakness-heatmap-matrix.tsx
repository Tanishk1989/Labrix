"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Filter, HelpCircle, Lightbulb, Sparkles, TrendingDown, Users, X } from "lucide-react";
import {
  CORE_CONCEPTS,
  type ClassWeaknessSummary,
  type ConceptCategory,
  type StudentConceptScore,
  type StudentWeaknessProfile,
} from "./weakness-heatmap";

export function WeaknessHeatmapMatrix({
  summary,
}: {
  summary: ClassWeaknessSummary;
}) {
  const [filter, setFilter] = useState<"ALL" | "AT_RISK" | "DEVELOPING" | "EXCELLING">("ALL");
  const [selectedStudent, setSelectedStudent] = useState<StudentWeaknessProfile | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<StudentConceptScore | null>(null);

  const filteredProfiles = summary.profiles.filter((p) => {
    if (filter === "ALL") return true;
    return p.riskStatus === filter;
  });

  return (
    <section aria-labelledby="weakness-heatmap-heading" className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
              <Sparkles size={11} />
              AI Cognitive Diagnostics
            </span>
            <span className="text-xs text-[var(--text-muted)]">Real-time AST & Test Pattern Analysis</span>
          </div>
          <h2 id="weakness-heatmap-heading" className="mt-1 text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Per-Student Concept Mastery & Weakness Heatmap
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-muted)]">
            Automated concept decomposition from compiler errors, runtime timeouts, and edge-case assertions.
          </p>
        </div>

        {/* SUMMARY STAT PILLS */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-[var(--surface)] px-3 py-1.5 shadow-sm">
            <span className="text-[var(--text-muted)]">Class Avg Mastery: </span>
            <span className="font-mono font-bold text-white">{summary.classAverageMastery}%</span>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-rose-300 shadow-sm">
            <span className="font-bold">{summary.totalAtRiskStudents}</span>
            <span className="opacity-80"> Need Intervention</span>
          </div>
        </div>
      </div>

      {/* CLASS-WIDE BOTTLENECK DIAGNOSIS CARD */}
      {summary.topClassBottleneck && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-white/[0.02] to-black/40 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="grid size-10 place-items-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-300 shrink-0 mt-0.5 shadow-inner">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Primary Cohort Bottleneck Detected
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-mono font-semibold text-amber-200">
                    {summary.topClassBottleneck.concept.icon} {summary.topClassBottleneck.concept.name}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-white">
                  {summary.topClassBottleneck.failureRate}% of students experienced regression on {summary.topClassBottleneck.concept.shortLabel}
                </p>
                <p className="mt-1 text-xs text-white/70 leading-relaxed flex items-center gap-1.5">
                  <span className="font-semibold text-amber-300">Actionable Intervention:</span>
                  <span>{summary.topClassBottleneck.recommendation}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFilter("AT_RISK")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 transition-all hover:bg-amber-500/25 active:scale-95"
            >
              <span>View At-Risk Students</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* FILTER BAR & MATRIX TABLE CONTAINER */}
      <div className="rounded-2xl border border-white/[0.12] bg-[var(--surface)] p-4 sm:p-5 shadow-[var(--shadow-card)]">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-white/40" />
            <span className="text-xs font-semibold text-white/60">Filter Cohort:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                filter === "ALL"
                  ? "bg-white/15 text-white font-bold shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              All ({summary.profiles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("AT_RISK")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                filter === "AT_RISK"
                  ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40"
                  : "text-rose-400/60 hover:text-rose-300"
              }`}
            >
              🔴 At Risk ({summary.profiles.filter((p) => p.riskStatus === "AT_RISK").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("DEVELOPING")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                filter === "DEVELOPING"
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                  : "text-amber-400/60 hover:text-amber-300"
              }`}
            >
              🟡 Developing ({summary.profiles.filter((p) => p.riskStatus === "DEVELOPING").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("EXCELLING")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                filter === "EXCELLING"
                  ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                  : "text-emerald-400/60 hover:text-emerald-300"
              }`}
            >
              🟢 Excelling ({summary.profiles.filter((p) => p.riskStatus === "EXCELLING").length})
            </button>
          </div>
        </div>

        {/* 2D HEATMAP GRID TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-white/50">
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 px-2 text-center">Overall</th>
                {CORE_CONCEPTS.map((concept) => (
                  <th key={concept.id} className="pb-3 px-2 text-center" title={concept.description}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm">{concept.icon}</span>
                      <span className="font-semibold text-white/70">{concept.shortLabel}</span>
                    </div>
                  </th>
                ))}
                <th className="pb-3 pl-3 text-right">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-xs">
              {filteredProfiles.map((student) => (
                <tr
                  key={student.studentId}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  {/* Student info */}
                  <td className="py-3 pr-4 min-w-[160px]">
                    <div className="font-semibold text-white">{student.studentName}</div>
                    <div className="text-[11px] text-white/40 truncate max-w-[140px]">{student.studentEmail}</div>
                  </td>

                  {/* Overall mastery score */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 font-mono font-bold text-xs ${
                        student.overallMasteryPercentage >= 80
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : student.overallMasteryPercentage >= 55
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {student.overallMasteryPercentage}%
                    </span>
                  </td>

                  {/* Concept Cells */}
                  {CORE_CONCEPTS.map((concept) => {
                    const scoreObj = student.concepts[concept.id];
                    const isUnassessed = !scoreObj || scoreObj.level === "UNASSESSED";

                    return (
                      <td key={concept.id} className="py-3 px-2 text-center">
                        {isUnassessed ? (
                          <span className="inline-block font-mono text-white/20">—</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(student);
                              setSelectedConcept(scoreObj);
                            }}
                            className={`group relative inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition-all hover:scale-110 active:scale-95 ${
                              scoreObj.level === "MASTERED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                                : scoreObj.level === "DEVELOPING"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] animate-pulse"
                            }`}
                            title="Click for diagnostic breakdown"
                          >
                            <span>{scoreObj.score}%</span>
                          </button>
                        )}
                      </td>
                    );
                  })}

                  {/* Top Diagnostic Weakness */}
                  <td className="py-3 pl-3 text-right min-w-[140px]">
                    {student.topWeakness ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                        <AlertCircle size={10} />
                        {student.topWeakness.conceptName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                        <CheckCircle2 size={11} />
                        Stable Mastery
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRILL-DOWN DIAGNOSTIC DRAWER / MODAL */}
      {selectedStudent && selectedConcept && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-[#0c0d14] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Concept Mastery Breakdown
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedStudent.studentName} · {selectedConcept.conceptName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedStudent(null); setSelectedConcept(null); }}
                className="grid size-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="text-white/60">Estimated Mastery Score:</span>
                <span className={`font-mono text-base font-bold ${
                  selectedConcept.score >= 85 ? "text-emerald-400" : selectedConcept.score >= 55 ? "text-amber-400" : "text-rose-400"
                }`}>
                  {selectedConcept.score}% ({selectedConcept.level})
                </span>
              </div>

              {selectedConcept.failingPattern && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-200">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-rose-300">
                    <TrendingDown size={12} />
                    Failing AST / Test Pattern
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/90">
                    {selectedConcept.failingPattern}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 p-3 text-white/90">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-[var(--color-brand)]">
                  <Lightbulb size={12} />
                  Recommended Action for Teacher
                </div>
                <p className="mt-1 text-xs text-white/80 leading-relaxed">
                  Ask this student to walk through the loop boundary conditions or simulate the edge case viva question during next review.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => { setSelectedStudent(null); setSelectedConcept(null); }}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
