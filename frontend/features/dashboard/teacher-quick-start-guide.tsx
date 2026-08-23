"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Plus,
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
  const completedCount = Number(hasClassroom) + Number(hasStudents) + Number(hasPracticals);
  const joinCode = primaryClassroom
    ? `CLASS-${primaryClassroom.id.slice(0, 6).toUpperCase()}`
    : null;

  async function copyJoinCode(code: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        return;
      }
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  }

  return (
    <section
      aria-labelledby="quickstart-heading"
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-cyan-400">
            <Sparkles size={14} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="quickstart-heading" className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                Getting Started with TRACE
              </h2>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                allCompleted
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
              }`}>
                {allCompleted ? <CheckCircle2 size={11} aria-hidden="true" /> : null}
                {allCompleted ? "Setup complete" : `${completedCount} / 3 completed`}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-5 text-[var(--text-muted)]">
              Classroom, roster, and practical review workflow
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="icon-button -mr-1 -mt-0.5 size-8 min-h-8 min-w-8 border-transparent bg-transparent"
          aria-label="Dismiss getting started guide"
          title="Dismiss guide"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <ol className="grid md:grid-cols-2 lg:grid-cols-3">
        <li className="group relative min-w-0 border-b border-[var(--border-subtle)] p-4 transition-colors duration-200 hover:bg-[var(--surface-hover)]/40 md:border-r lg:border-b-0">
          <div className="flex items-center gap-2.5">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${
              hasClassroom
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-indigo-400/30 bg-indigo-400/10 text-indigo-300"
            }`}>
              {hasClassroom ? <CheckCircle2 size={13} aria-hidden="true" /> : "1"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Step 1</span>
            {hasClassroom ? <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-400" />Active</span> : null}
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Create Classroom</h3>
          <p className="mt-1 min-h-5 truncate text-xs text-[var(--text-secondary)]">
            {hasClassroom ? primaryClassroom.name : "Configure your subject and section"}
          </p>
          <div className="mt-3 min-h-8">
            {hasClassroom ? (
              <Link href={`/classes/${primaryClassroom.id}`} className="group/link inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--color-brand-hover)]">
                View classroom <ChevronRight size={13} className="transition-transform duration-200 group-hover/link:translate-x-0.5" aria-hidden="true" />
              </Link>
            ) : <CreateClassroomButton />}
          </div>
        </li>

        <li className={`group relative min-w-0 border-b border-[var(--border-subtle)] p-4 transition-colors duration-200 hover:bg-[var(--surface-hover)]/40 lg:border-b-0 lg:border-r ${hasClassroom ? "" : "opacity-60"}`}>
          <div className="flex items-center gap-2.5">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${
              hasStudents
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
            }`}>
              {hasStudents ? <CheckCircle2 size={13} aria-hidden="true" /> : "2"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Step 2</span>
            {hasStudents ? <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300"><Users size={11} aria-hidden="true" />Enrolled</span> : null}
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Invite Students</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {hasStudents
              ? `${overview.summary.distinctStudentCount} ${overview.summary.distinctStudentCount === 1 ? "student" : "students"} enrolled`
              : hasClassroom ? "Share the classroom join code" : "Available after Step 1"}
          </p>
          <div className="mt-3 min-h-8">
            {joinCode ? (
              <div className="flex max-w-full items-stretch overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--color-canvas)]">
                <code className="min-w-0 flex-1 truncate px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-cyan-300">
                  {joinCode}
                </code>
                <button
                  type="button"
                  onClick={() => copyJoinCode(joinCode)}
                  className="inline-flex min-h-8 shrink-0 items-center gap-1.5 border-l border-[var(--border)] px-2.5 text-[11px] font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  aria-label={`Copy classroom join code ${joinCode}`}
                >
                  {copiedCode === joinCode ? <CheckCircle2 size={12} className="text-emerald-400" aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                  <span aria-live="polite">{copiedCode === joinCode ? "Copied" : "Copy"}</span>
                </button>
              </div>
            ) : null}
          </div>
        </li>

        <li className={`group relative min-w-0 p-4 transition-colors duration-200 hover:bg-[var(--surface-hover)]/40 md:col-span-2 lg:col-span-1 ${hasClassroom ? "" : "opacity-60"}`}>
          <div className="flex items-center gap-2.5">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${
              hasPracticals
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
            }`}>
              {hasPracticals ? <CheckCircle2 size={13} aria-hidden="true" /> : "3"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Step 3</span>
            {hasPracticals ? <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300"><CheckCircle2 size={11} aria-hidden="true" />Published</span> : null}
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Publish Practical</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {hasPracticals
              ? `${overview.summary.publishedPracticalCount} ${overview.summary.publishedPracticalCount === 1 ? "practical" : "practicals"} published`
              : hasClassroom ? "Add tests, rubric, and oral defense" : "Available after Step 1"}
          </p>
          <div className="mt-3 min-h-8">
            {hasClassroom ? (
              <Link href={`/classes/${primaryClassroom.id}/tasks/new`} className="button-secondary group/link min-h-8 px-2.5 text-xs">
                <Plus size={12} aria-hidden="true" />
                Create practical
                <ChevronRight size={13} className="transition-transform duration-200 group-hover/link:translate-x-0.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </li>
      </ol>
    </section>
  );
}
