import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { PageHeader, ProgressBar } from "@/components/design-system";
import type { ClassroomCardViewModel, MyClassesViewModel } from "./my-classes-view-model";
import { CreateClassroomButton } from "./classroom-setup-actions";

function deadlineLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ClassroomWorkspace({ classroom }: { classroom: ClassroomCardViewModel }) {
  const practical = classroom.latestPractical;
  const completionLabel = practical && classroom.studentCount > 0
    ? `${practical.completionPercentage}%`
    : "Not available";

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {classroom.name}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{classroom.subject}</p>
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

      <dl className="mt-6 grid grid-cols-2 gap-y-5 border-y border-[var(--border)] py-5 sm:grid-cols-3">
        <div className="pr-4">
          <dt className="text-xs text-[var(--text-muted)]">Students</dt>
          <dd className="mt-1 text-base font-semibold text-[var(--text-primary)]">{classroom.studentCount}</dd>
        </div>
        <div className="border-l border-[var(--border)] px-4 sm:px-6">
          <dt className="text-xs text-[var(--text-muted)]">Published practicals</dt>
          <dd className="mt-1 text-base font-semibold text-[var(--text-primary)]">{classroom.activePracticalCount}</dd>
        </div>
        <div className="col-span-2 border-t border-[var(--border)] pt-5 sm:col-span-1 sm:border-l sm:border-t-0 sm:px-6 sm:pt-0">
          <dt className="text-xs text-[var(--text-muted)]">Latest practical submissions</dt>
          <dd className={`mt-1 font-semibold ${practical && classroom.studentCount > 0 ? "text-base text-[var(--text-primary)]" : "text-sm text-[var(--text-secondary)]"}`}>
            {completionLabel}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.8fr)] md:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Latest teaching context
          </p>
          {practical ? (
            <>
              <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{practical.title}</h3>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)]">
                {classroom.nearestDeadline ? (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={14} aria-hidden="true" />
                    <time dateTime={classroom.nearestDeadline}>Due {deadlineLabel(classroom.nearestDeadline)}</time>
                  </span>
                ) : <span>No deadline</span>}
                {classroom.studentCount > 0 ? (
                  <span>
                    {practical.pendingCount === 0
                      ? "Every enrolled student has submitted"
                      : `${practical.pendingCount} ${practical.pendingCount === 1 ? "student is" : "students are"} awaiting submission`}
                  </span>
                ) : <span>No enrolled students</span>}
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">No published practical</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                Publish a practical to start tracking class submissions.
              </p>
            </>
          )}
        </div>

        {practical && classroom.studentCount > 0 ? (
          <ProgressBar
            value={practical.completionPercentage}
            label={`${practical.submittedCount}/${classroom.studentCount} students submitted`}
            showPercentage={false}
          />
        ) : practical ? (
          <p className="text-xs leading-5 text-[var(--text-secondary)]">
            Completion will appear after students join this class.
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function MyClassesPage({ viewModel }: { viewModel: MyClassesViewModel }) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="Classes"
        description="Create classes, share join codes, and manage practicals and students."
        actions={<CreateClassroomButton />}
      />

      {viewModel.activeClasses.length ? (
        <ul aria-label="Owned classes" className="grid gap-6">
          {viewModel.activeClasses.map((classroom) => (
            <li key={classroom.id} className="list-none">
              <ClassroomWorkspace classroom={classroom} />
            </li>
          ))}
        </ul>
      ) : (
        <section aria-labelledby="no-classes-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="no-classes-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            No classes yet
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
            Create a class to start publishing practicals and inviting students.
          </p>
          <div className="mt-6"><CreateClassroomButton /></div>
        </section>
      )}
    </div>
  );
}
