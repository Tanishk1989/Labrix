import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, ProgressBar } from "@/components/design-system";
import type { TeacherOverview } from "@/server/teacher/overview";
import {
  buildTeacherProgressViewModel,
  type TeacherProgressViewModel,
} from "./teacher-progress-view-model";
import { buildClassWeaknessHeatmap } from "./weakness-heatmap";
import { WeaknessHeatmapMatrix } from "./weakness-heatmap-matrix";

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function ProgressSummary({ view }: { view: TeacherProgressViewModel }) {
  return (
    <section aria-labelledby="overall-progress-heading" className="w-full">
      <h2 id="overall-progress-heading" className="sr-only">Overall progress</h2>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--border-strong)] sm:p-6">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Submission progress</dt>
          <dd className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-2xl">
            {view.hasCompletionScope
              ? `${view.completedPairs} of ${view.totalPairs} received`
              : "Progress unavailable"}
          </dd>
          <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
            {view.hasCompletionScope
              ? `${view.submissionCoveragePercentage}% of expected work has at least one submission.`
              : view.hasPublishedPracticals
                ? "Unavailable without enrolled students."
                : "Appears after practicals are published."}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--border-strong)] sm:p-6">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Passed all provided tests</dt>
          <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{view.passedAllProvidedTestsPairs}</dd>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Latest submitted attempts only</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--border-strong)] sm:p-6">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Published reviews</dt>
          <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{view.publishedReviewPairs}</dd>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Student-visible teacher feedback</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--border-strong)] sm:p-6">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Awaiting submission</dt>
          <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {view.hasCompletionScope ? view.incompletePairs : "—"}
          </dd>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            {view.hasCompletionScope ? "Published work without a submission" : "No eligible work yet"}
          </p>
        </div>
      </dl>
    </section>
  );
}

function PracticalProgress({ view }: { view: TeacherProgressViewModel }) {
  return (
    <section aria-labelledby="practical-completion-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="practical-completion-heading" className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Practical submissions and outcomes
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Submission, provided-test, and review states are shown separately.
          </p>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{view.publishedPracticalCount} published</span>
      </div>

      {view.publishedPracticals.length ? (
        <ul className="grid gap-5">
          {view.publishedPracticals.map((practical) => (
            <li key={practical.id} className="list-none">
              <article className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] sm:p-6">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{practical.title}</h3>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {practical.classroomName} · {practical.classroomSubject}
                    </p>
                  </div>
                  <dl className="flex flex-wrap gap-4 text-right text-xs sm:gap-6">
                    <div><dt className="text-[var(--text-muted)]">Submissions</dt><dd className="mt-1 font-mono font-semibold tabular-nums text-[var(--text-primary)]">{practical.studentCount > 0 ? `${practical.submittedCount}/${practical.studentCount}` : "—"}</dd></div>
                    <div><dt className="text-[var(--text-muted)]">Test outcomes</dt><dd className="mt-1 font-mono font-semibold tabular-nums text-[var(--text-primary)]">{practical.passedAllProvidedTestsCount} passed all</dd></div>
                    <div><dt className="text-[var(--text-muted)]">Reviews</dt><dd className="mt-1 font-mono font-semibold tabular-nums text-[var(--text-primary)]">{practical.publishedReviewCount} published</dd></div>
                  </dl>
                </div>
                {practical.studentCount > 0 ? (
                  <div className="mt-4">
                    <ProgressBar
                      value={practical.completionPercentage}
                      label={`${practical.title} submissions received`}
                      showPercentage={false}
                      height="h-1.5"
                    />
                  </div>
                ) : null}
                <Link
                  href={view.selectedClassroom
                    ? `/classes/${practical.classroomId}/students`
                    : `/progress?classroom=${encodeURIComponent(practical.classroomId)}`}
                  className="mt-4 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]"
                >
                  {view.selectedClassroom ? "View students and access" : "View class progress"} <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 text-left shadow-sm">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">No published practicals</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Progress appears after a practical is published.
          </p>
          <Link href="/practicals?status=DRAFT" className="button-secondary mt-5 min-h-11">
            View practical drafts
          </Link>
        </div>
      )}
    </section>
  );
}

function CompletionAttention({ view }: { view: TeacherProgressViewModel }) {
  let message = "Every expected submission has been received.";
  if (!view.hasPublishedPracticals) {
    message = "Attention summaries appear after practicals are published.";
  } else if (!view.hasStudents) {
    message = "Submission follow-up is unavailable without enrolled students.";
  } else if (view.incompletePairs > 0) {
    message = `${view.incompletePairs} expected ${view.incompletePairs === 1 ? "submission is" : "submissions are"} still missing.`;
  }

  return (
    <section aria-labelledby="completion-attention-heading" className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h2 id="completion-attention-heading" className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        Needs attention
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{message}</p>
      {view.lowestSubmissionCoverage ? (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">
            Lowest submission progress
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
            {view.lowestSubmissionCoverage.title} · {view.lowestSubmissionCoverage.completionPercentage}% submitted
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {view.lowestSubmissionCoverage.classroomName} · {view.lowestSubmissionCoverage.submittedCount}/{view.lowestSubmissionCoverage.studentCount} submitted
          </p>
          <Link
            href={
              view.selectedClassroom
                ? `/classes/${view.selectedClassroom.id}/students`
                : `/progress?classroom=${encodeURIComponent(view.lowestSubmissionCoverage.classroomId)}`
            }
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]"
          >
            {view.selectedClassroom ? "View students and access" : "Review class progress"}{" "}
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function StudentProgressList({ view }: { view: TeacherProgressViewModel }) {
  return (
    <section aria-labelledby="student-progress-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="student-progress-heading" className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Student progress
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Submission, provided-test, and published-review counts for available practicals.
          </p>
        </div>
        <span className="shrink-0 text-xs text-[var(--text-muted)]">{view.students.length} students</span>
      </div>

      {view.students.length ? (
        <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm divide-y divide-[var(--border)]">
          {view.students.map((student) => (
            <li key={student.id} className="grid gap-4 px-4 py-3.5 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--surface-hover)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(12rem,0.7fr)] list-none">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{student.name}</h3>
                <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{student.email}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)] lg:hidden">
                  {student.latestActivityAt
                    ? <>Latest submission <time dateTime={student.latestActivityAt}>{dateTimeLabel(student.latestActivityAt)}</time></>
                    : "No submission"}
                </p>
              </div>
              <dl className="flex flex-wrap gap-4 text-right text-xs sm:gap-6">
                <div><dt className="text-[var(--text-muted)]">Submitted</dt><dd className="mt-1 font-mono font-semibold tabular-nums text-[var(--text-primary)]">{student.submittedPracticalCount}/{student.availablePracticalCount}</dd></div>
                <div><dt className="text-[var(--text-muted)]">Passed tests</dt><dd className="mt-1 font-mono font-semibold tabular-nums text-[var(--text-primary)]">{student.passedAllProvidedTestsCount}</dd></div>
                <div><dt className="text-[var(--text-muted)]">Reviewed</dt><dd className="mt-1 font-mono font-semibold tabular-nums text-[var(--text-primary)]">{student.publishedReviewCount}</dd></div>
              </dl>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                {student.availablePracticalCount > 0 ? (
                  <ProgressBar
                    value={student.completionPercentage}
                    label={`${student.name} practicals submitted`}
                    showPercentage={false}
                    height="h-1.5"
                  />
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">No published work</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">No enrolled students</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Active student memberships will appear here without treating missing data as a failed outcome.
          </p>
          {view.hasClassrooms ? (
            <Link href="/classes" className="button-secondary mt-5 min-h-11">
              View classes
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function TeacherProgressPage({ overview, classroomId }: { overview: TeacherOverview; classroomId?: string }) {
  const view = buildTeacherProgressViewModel(overview, classroomId);
  const weaknessSummary = buildClassWeaknessHeatmap(overview, classroomId);

  if (!view.classroomSelectionAvailable) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Class progress unavailable"
          description="This class is not part of your active teaching classrooms."
          actions={<Link href="/progress" className="button min-h-11">View all progress</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        breadcrumbs={view.selectedClassroom ? [
          { label: "Classes", href: "/classes" },
          { label: view.selectedClassroom.name, href: `/classes/${view.selectedClassroom.id}` },
          { label: "Progress" },
        ] : undefined}
        title={view.selectedClassroom ? `${view.selectedClassroom.name} progress` : "Progress"}
        description={view.selectedClassroom
          ? "Review this class’s submissions, provided-test outcomes, and published feedback separately."
          : "Track submissions, provided-test outcomes, and published reviews separately."}
        actions={<>
          {view.selectedClassroom ? <Link href={`/classes/${view.selectedClassroom.id}/students`} className="button-secondary min-h-11">Students and access</Link> : null}
          <Link href={view.selectedClassroom
            ? `/submissions?review=NEW&classroom=${encodeURIComponent(view.selectedClassroom.id)}`
            : "/submissions?review=NEW"} className="button min-h-11">Review submissions</Link>
        </>}
      />

      {!view.hasClassrooms ? (
        <section aria-labelledby="progress-empty-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="progress-empty-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            No classes yet
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
            Create a class to start tracking progress.
          </p>
          <Link href="/classes" className="button mt-6 min-h-11">Create a class</Link>
        </section>
      ) : (
        <>
          <ProgressSummary view={view} />
          <WeaknessHeatmapMatrix summary={weaknessSummary} />
          <PracticalProgress view={view} />
          <CompletionAttention view={view} />
          <StudentProgressList view={view} />
        </>
      )}
    </div>
  );
}
