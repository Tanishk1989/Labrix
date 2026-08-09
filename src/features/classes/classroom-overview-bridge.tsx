"use client";

import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Circle, Play } from "lucide-react";
import { useDemoRole } from "@/components/app-shell";
import { EmptyState, StatusBadge } from "@/components/design-system";
import type { ClassroomOverviewViewModel } from "./classroom-overview-view-model";

function deadlineLabel(deadline: string | null) {
  if (!deadline) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(deadline));
}

function StudentClassroomOverview({ classroom }: { classroom: ClassroomOverviewViewModel }) {
  const task = classroom.task;
  return (
    <>
      <Link href="/classes" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500">
        <ArrowLeft size={16} aria-hidden="true" /> My Classes
      </Link>
      <section className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">{classroom.subject}</p>
        <h1 className="page-title mt-2 font-semibold tracking-tight text-slate-950">{classroom.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{classroom.section} · Demo Teacher</p>
      </section>

      <section className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Your practical progress">
        <div className="metric-card"><Circle className="metric-mark metric-indigo" aria-hidden="true" /><div><p className="text-sm text-[var(--text-secondary)]">Active practicals</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{task ? 1 : 0}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Ready to work on</p></div></div>
        <div className="metric-card"><CheckCircle2 className="metric-mark metric-emerald" aria-hidden="true" /><div><p className="text-sm text-[var(--text-secondary)]">Completed</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">0</p><p className="mt-1 text-xs text-[var(--text-muted)]">Submitted practicals</p></div></div>
        <div className="metric-card"><CalendarClock className="metric-mark metric-amber" aria-hidden="true" /><div><p className="text-sm text-[var(--text-secondary)]">Expired</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">0</p><p className="mt-1 text-xs text-[var(--text-muted)]">Past the due date</p></div></div>
      </section>

      <section className="mt-8 max-w-[760px]">
        <div className="mb-4"><h2 className="text-lg font-semibold text-slate-950">Your practicals</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Pick up where you left off and submit when you are ready.</p></div>
        {task ? (
          <article className="classroom-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-sm text-[var(--text-secondary)]">Practical</p><h3 className="mt-1 text-lg font-semibold text-slate-950">{task.title}</h3></div>
              <StatusBadge tone="info">Not started</StatusBadge>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-slate-100 py-4 text-sm text-[var(--text-secondary)]">
              <span><strong className="font-medium text-slate-700">Languages:</strong> C++ · Java</span>
              <span><strong className="font-medium text-slate-700">Due:</strong> {deadlineLabel(task.deadline)}</span>
            </div>
            <Link href={`/tasks/${task.id}`} className="button mt-5 w-fit"><Play size={16} aria-hidden="true" /> Start practical</Link>
          </article>
        ) : <EmptyState title="No active practicals" description="Your teacher has not published a practical for this classroom yet." />}
      </section>
    </>
  );
}

export function ClassroomOverviewBridge({ classroom, teacherContent }: { classroom: ClassroomOverviewViewModel; teacherContent: React.ReactNode }) {
  return useDemoRole() === "student" ? <StudentClassroomOverview classroom={classroom} /> : teacherContent;
}
