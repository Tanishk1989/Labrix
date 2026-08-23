import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap } from "lucide-react";
import { EmptyState, ProgressBar } from "@/components/design-system";
import { CreateClassroomButton } from "@/features/classes/classroom-setup-actions";
import { SpotlightCard } from "@/components/spotlight-card";
import type { DashboardTeachingContext } from "./dashboard-view-model";

function deadlineLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function LatestTeachingContext({ context }: { context: DashboardTeachingContext }) {
  return (
    <section aria-labelledby="latest-context-heading">
      <div className="mb-4">
        <p className="eyebrow">Most recent</p>
        <h2 id="latest-context-heading" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Latest teaching context
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          Your most recently published practical and its class.
        </p>
      </div>

      {context.kind === "no-classrooms" ? (
        <EmptyState
          title="No classes yet"
          description="Create a class to start publishing practicals and inviting students."
          action={<div className="mt-4"><CreateClassroomButton /></div>}
        />
      ) : context.kind === "no-published-practical" ? (
        <EmptyState
          title="No published practicals yet"
          description="Create a practical to start tracking student submissions."
          action={(
            <Link href={context.createPracticalHref} className="button min-h-11">
              Create practical <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
        />
      ) : (
        <SpotlightCard spotlightColor="rgba(var(--spotlight-rgb), 0.12)" className="p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide uppercase text-[var(--text-muted)] flex items-center gap-1.5">
              <GraduationCap size={14} className="text-[var(--color-brand)]" />
              {context.classroom.name} · {context.classroom.subject}
            </p>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
              {context.classroom.section}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-semibold leading-7 text-[var(--text-primary)]">
            {context.practical.title}
          </h3>

          <div className="mt-5">
            {context.practical.studentCount > 0 ? (
              <ProgressBar
                value={context.practical.completionPercentage}
                label={`${context.practical.submittedCount}/${context.practical.studentCount} students submitted`}
              />
            ) : (
              <div className="border-y border-[var(--border)] py-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">No enrolled students</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                  Submission progress will appear after students join this class.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)]">
            {context.practical.studentCount > 0 ? (
              <p>
                {context.classroom.outstandingStudentCount === 0
                  ? "Every enrolled student has submitted."
                  : `${context.classroom.outstandingStudentCount} ${context.classroom.outstandingStudentCount === 1 ? "student is" : "students are"} awaiting submission.`}
              </p>
            ) : null}
            <p className="flex items-center gap-2 text-[var(--text-muted)]">
              <CalendarDays size={14} aria-hidden="true" />
              {context.practical.deadline ? (
                <time dateTime={context.practical.deadline}>Due {deadlineLabel(context.practical.deadline)}</time>
              ) : "No deadline"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href={`/progress?classroom=${encodeURIComponent(context.classroom.id)}`} className="button min-h-11">
              View progress <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link href={`/classes/${context.classroom.id}`} className="button-secondary min-h-11">
              View class work
            </Link>
          </div>
        </SpotlightCard>
      )}
    </section>
  );
}
