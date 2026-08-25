import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { PageHeader, ProgressBar, StatusBadge } from "@/components/design-system";
import { JoinClassroomButton } from "@/features/classes/classroom-setup-actions";
import type { StudentOverview } from "@/server/student/overview";
import {
  buildStudentClassesViewModel,
  type StudentClassWorkspace,
} from "./student-classes-view-model";

function deadlineLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ClassWorkspace({ classroom }: { classroom: StudentClassWorkspace }) {
  const nextWorkOverdue = classroom.nextWork?.statusLabel === "Overdue";
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {classroom.name}
          </h2>
          <p className="mt-2 break-words text-sm text-[var(--text-secondary)]">{classroom.subject}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{classroom.section}</p>
        </div>
        <Link
          href={`/classes/${classroom.id}`}
          aria-label={`View class work for ${classroom.name}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]"
        >
          View class work <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {classroom.state === "NO_PRACTICALS" ? (
        <div className="mt-6 border-y border-[var(--border)] py-5">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No practicals published yet</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Your teacher hasn’t published any practicals for this class.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 border-y border-[var(--border)] py-5 md:grid-cols-[auto_auto_minmax(12rem,1fr)] md:items-end md:gap-8">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Published</p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{classroom.publishedCount}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Submitted</p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{classroom.submittedCount}</p>
          </div>
          <ProgressBar
            value={classroom.completionPercentage ?? 0}
            label={`${classroom.submittedCount} of ${classroom.publishedCount} practicals submitted`}
            ariaLabel={`${classroom.name}: ${classroom.submittedCount} of ${classroom.publishedCount} practicals submitted`}
            showPercentage
          />
        </div>
      )}

      {classroom.state === "UP_TO_DATE" ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusBadge tone="success">Up to date</StatusBadge>
          <p className="text-xs text-[var(--text-secondary)]">
            {classroom.submittedCount} of {classroom.publishedCount} practicals submitted
          </p>
        </div>
      ) : classroom.nextWork ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <p className="eyebrow">Next</p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h3 className="break-words text-sm font-semibold text-[var(--text-primary)]">{classroom.nextWork.title}</h3>
              <StatusBadge tone={nextWorkOverdue ? "danger" : classroom.nextWork.statusLabel === "In progress" ? "warning" : "published"}>
                {classroom.nextWork.statusLabel}
              </StatusBadge>
            </div>
            <p className={`mt-2 inline-flex items-center gap-1.5 text-xs ${nextWorkOverdue ? "text-rose-300" : "text-[var(--text-secondary)]"}`}>
              <Clock3 size={13} aria-hidden="true" />
              {classroom.nextWork.deadline ? (
                <time dateTime={classroom.nextWork.deadline}>{nextWorkOverdue ? "Overdue since" : "Due"} {deadlineLabel(classroom.nextWork.deadline)}</time>
              ) : "No deadline"}
            </p>
          </div>
          <Link
            href={classroom.nextWork.href}
            aria-label={`${classroom.nextWork.actionLabel} ${classroom.nextWork.title}`}
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)] sm:self-auto"
          >
            {classroom.nextWork.actionLabel} <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export function StudentClassesPage({
  overview,
  allowJoin,
}: {
  overview: StudentOverview;
  allowJoin: boolean;
}) {
  const view = buildStudentClassesViewModel(overview);
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="Classes"
        description="Your classes and practical work."
        actions={allowJoin
          ? <JoinClassroomButton variant="primary" />
          : view.classes[0]
            ? <Link href={`/classes/${view.classes[0].id}`} className="button min-h-11">View class work</Link>
            : <Link href="/dashboard" className="button min-h-11">Return home</Link>}
      />

      {view.classes.length ? (
        <ul aria-label="Enrolled classes" className="grid gap-6">
          {view.classes.map((classroom) => (
            <li key={classroom.id} className="list-none">
              <ClassWorkspace classroom={classroom} />
            </li>
          ))}
        </ul>
      ) : (
        <section aria-labelledby="no-student-classes-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="no-student-classes-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            No classes yet
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
            Join a class using the code provided by your teacher.
          </p>
          {allowJoin ? <div className="mt-6"><JoinClassroomButton variant="primary" /></div> : null}
        </section>
      )}
    </div>
  );
}
