"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  GraduationCap,
  Plus,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { TeacherOverview } from "@/server/teacher/overview";
import { CreateClassroomButton } from "@/features/classes/classroom-setup-actions";

export function TeacherQuickStartGuide({
  overview,
}: {
  overview: TeacherOverview;
}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const hasClassroom = overview.classrooms.length > 0;
  const hasStudents = overview.summary.distinctStudentCount > 0;
  const hasPracticals = overview.summary.publishedPracticalCount > 0;

  const allCompleted = hasClassroom && hasStudents && hasPracticals;

  // Don't show if dismissed or if all 3 steps are complete and user closed it
  if (isDismissed) return null;

  const primaryClassroom = overview.classrooms[0] ?? null;

  function copyJoinCode(code: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  }

  return (
    <section
      aria-labelledby="quickstart-heading"
      className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/25 via-[var(--surface)] to-indigo-950/20 p-5 shadow-[var(--shadow-card)] sm:p-6"
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/15 text-cyan-400">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="quickstart-heading" className="text-sm font-bold tracking-tight text-white">
                Getting Started with TRACE
              </h2>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                {allCompleted ? "3/3 Ready" : `${Number(hasClassroom) + Number(hasStudents) + Number(hasPracticals)}/3 Steps`}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              3 simple steps to launch automated coding practicals and oral defense grading
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          title="Dismiss guide"
        >
          <X size={15} />
        </button>
      </div>

      {/* 3 Step Cards Grid */}
      <div className="mt-4 grid gap-3.5 md:grid-cols-3">
        {/* Step 1: Create Classroom */}
        <div
          className={`relative rounded-xl border p-4 transition-all ${
            hasClassroom
              ? "border-emerald-500/30 bg-emerald-950/20"
              : "border-white/10 bg-black/40 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs font-bold font-mono text-white/80">
              1
            </span>
            {hasClassroom ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 size={13} /> Active
              </span>
            ) : (
              <span className="text-[10px] font-mono text-cyan-300">Start here</span>
            )}
          </div>

          <h3 className="mt-2 text-xs font-bold text-white">Create a Classroom</h3>
          <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
            {hasClassroom
              ? `Connected: ${primaryClassroom.name} (${primaryClassroom.subject})`
              : "Set up your subject, course section, and grading settings."}
          </p>

          <div className="mt-3 pt-2 border-t border-white/5">
            {hasClassroom ? (
              <Link
                href={`/classes/${primaryClassroom.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
              >
                <span>View classroom</span>
                <ChevronRight size={13} />
              </Link>
            ) : (
              <div className="mt-1">
                <CreateClassroomButton />
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Invite Students */}
        <div
          className={`relative rounded-xl border p-4 transition-all ${
            hasStudents
              ? "border-emerald-500/30 bg-emerald-950/20"
              : hasClassroom
              ? "border-cyan-500/30 bg-cyan-950/20"
              : "border-white/10 bg-black/40 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs font-bold font-mono text-white/80">
              2
            </span>
            {hasStudents ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 size={13} /> {overview.summary.distinctStudentCount} Enrolled
              </span>
            ) : (
              <span className="text-[10px] font-mono text-cyan-300">Share Join Code</span>
            )}
          </div>

          <h3 className="mt-2 text-xs font-bold text-white">Invite Students</h3>
          <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
            {hasClassroom
              ? "Share your unique class join code with students to join in 1 click."
              : "Students join using your classroom join code."}
          </p>

          <div className="mt-3 pt-2 border-t border-white/5">
            {hasClassroom ? (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  CLASS-{primaryClassroom.id.slice(0, 6).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => copyJoinCode(`CLASS-${primaryClassroom.id.slice(0, 6).toUpperCase()}`)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/80 hover:text-white bg-white/10 px-2 py-0.5 rounded"
                >
                  <Copy size={11} />
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-white/40">Available after Step 1</span>
            )}
          </div>
        </div>

        {/* Step 3: Post Practical Task */}
        <div
          className={`relative rounded-xl border p-4 transition-all ${
            hasPracticals
              ? "border-emerald-500/30 bg-emerald-950/20"
              : hasClassroom
              ? "border-indigo-500/30 bg-indigo-950/20"
              : "border-white/10 bg-black/40 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs font-bold font-mono text-white/80">
              3
            </span>
            {hasPracticals ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 size={13} /> {overview.summary.publishedPracticalCount} Published
              </span>
            ) : (
              <span className="text-[10px] font-mono text-indigo-300">Set Tests &amp; Rubric</span>
            )}
          </div>

          <h3 className="mt-2 text-xs font-bold text-white">Publish Practical</h3>
          <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
            {hasPracticals
              ? "Students can write code, run visible tests, and submit for oral defense."
              : "Add starter code, visible test cases, and hidden benchmark tests."}
          </p>

          <div className="mt-3 pt-2 border-t border-white/5">
            {hasClassroom ? (
              <Link
                href={`/classes/${primaryClassroom.id}/tasks/new`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
              >
                <Plus size={12} />
                <span>Create practical</span>
                <ChevronRight size={13} />
              </Link>
            ) : (
              <span className="text-[11px] text-white/40">Available after Step 1</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
