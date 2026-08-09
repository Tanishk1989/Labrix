import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  Plus,
  UsersRound,
} from "lucide-react";
import {
  MetricCard,
  ProgressBar,
  StatusBadge,
} from "@/components/design-system";
import { JoinCode } from "@/components/interactive-design-system";
import type { ClassroomOverviewViewModel } from "./classroom-overview-view-model";

export function ClassroomOverviewPage({
  classroom,
}: {
  classroom: ClassroomOverviewViewModel;
}) {
  const deadline = classroom.task?.deadline
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(classroom.task.deadline))
    : "No deadline";
  return (
    <>
      <Link
        href="/classes"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700"
      >
        <ArrowLeft size={16} aria-hidden="true" /> My Classes
      </Link>
      <section className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">
            {classroom.subject}
          </p>
          <h1 className="page-title mt-2 font-semibold tracking-tight text-slate-950">
            {classroom.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {classroom.section} · Join code{" "}
            <JoinCode code={classroom.joinCode} />
          </p>
        </div>
        <Link href={`/classes/${classroom.id}/tasks/new`} className="button">
          <Plus size={17} aria-hidden="true" />
          Create practical
        </Link>
      </section>
      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Students"
          value={classroom.studentCount}
          detail="In this classroom"
        />
        <MetricCard
          label="Active practicals"
          value={classroom.practicalCount}
          detail="Published to students"
          tone="emerald"
        />
        <MetricCard
          label="Submitted"
          value={classroom.submittedCount}
          detail={`${classroom.pendingCount} pending`}
          tone="amber"
        />
      </section>
      <section className="mt-8 grid max-w-[900px] gap-5 lg:grid-cols-[1.55fr_1fr]">
        <article className="classroom-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Latest practical
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {classroom.task?.title ?? "No practical published"}
              </h2>
            </div>
            <StatusBadge tone="success">Published</StatusBadge>
          </div>
          {classroom.task && (
            <>
              <div className="mt-5 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CalendarClock size={16} aria-hidden="true" /> Deadline{" "}
                {deadline}
              </div>
              <div className="mt-5">
                <ProgressBar
                  value={classroom.task.completion}
                  label="Latest practical completion"
                />
                <div className="mt-3 flex gap-2">
                  <StatusBadge tone="success">
                    {classroom.submittedCount} submitted
                  </StatusBadge>
                  <StatusBadge tone="warning">
                    {classroom.pendingCount} pending
                  </StatusBadge>
                </div>
              </div>
              <Link
                href={`/tasks/${classroom.task.id}`}
                className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Open practical →
              </Link>
            </>
          )}
        </article>
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Classroom actions</h2>
          <Link
            href={`/classes/${classroom.id}/students`}
            className="mt-4 flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-700"
          >
            <UsersRound size={17} aria-hidden="true" /> View student progress
          </Link>
          <Link
            href={`/classes/${classroom.id}/tasks`}
            className="mt-2 flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-700"
          >
            <ClipboardList size={17} aria-hidden="true" /> View practicals
          </Link>
        </aside>
      </section>
    </>
  );
}
