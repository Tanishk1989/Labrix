import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { PageHeader, ProgressBar, StatusBadge } from "@/components/design-system";
import { JoinClassroomButton } from "@/features/classes/classroom-setup-actions";
import { PriorityPracticalBanner } from "./priority-practical-banner";
import type { StudentOverview } from "@/server/student/overview";
import {
  buildStudentDashboardViewModel,
  type StudentDashboardPractical,
} from "./student-dashboard-view-model";

function deadlineLabel(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function submittedAtLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function PracticalDeadline({ practical }: { practical: StudentDashboardPractical }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <Clock3 size={13} aria-hidden="true" />
      {practical.deadline ? (
        <time dateTime={practical.deadline}>Due {deadlineLabel(practical.deadline)}</time>
      ) : "No deadline"}
    </span>
  );
}

export function StudentDashboard({ overview }: { overview: StudentOverview }) {
  const dashboard = buildStudentDashboardViewModel(overview);

  if (dashboard.state === "NO_CLASSES") {
    return (
      <div className="space-y-10">
        <PageHeader eyebrow="Home" title={dashboard.headline} description={dashboard.description} actions={<JoinClassroomButton />} />
        <section aria-labelledby="no-classes-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="no-classes-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            No classes yet
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
            Join a class using the code provided by your teacher.
          </p>
        </section>
      </div>
    );
  }

  if (dashboard.state === "NO_PRACTICALS") {
    return (
      <div className="space-y-10">
        <PageHeader eyebrow="Home" title={dashboard.headline} description={dashboard.description} actions={<Link href="/classes" className="button min-h-11">View classes</Link>} />
        <section aria-labelledby="no-practicals-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="no-practicals-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Nothing waiting for you
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
            Published work will appear here when your teacher makes it available.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow="Home" title={dashboard.headline} description={dashboard.description} actions={dashboard.nextUp ? <Link href={dashboard.nextUp.href} className="button min-h-11">{dashboard.nextUp.actionLabel} <ArrowRight size={14} aria-hidden="true" /></Link> : <Link href="/submissions" className="button min-h-11">View submissions</Link>} />

      {dashboard.nextUp ? (
        <PriorityPracticalBanner practical={dashboard.nextUp} />
      ) : null}

      {dashboard.nextUp ? (
        <section aria-labelledby="next-up-heading">
          <p className="eyebrow">Primary work</p>
          <h2 id="next-up-heading" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Next up
          </h2>
          <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] sm:p-8">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="break-words text-2xl font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
                    {dashboard.nextUp.title}
                  </h3>
                  <StatusBadge tone={dashboard.nextUp.statusLabel === "In progress" ? "warning" : "published"}>
                    {dashboard.nextUp.statusLabel}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {dashboard.nextUp.classroomSubject} · {dashboard.nextUp.classroomName}
                </p>
                <div className="mt-4"><PracticalDeadline practical={dashboard.nextUp} /></div>
              </div>
              <Link href={dashboard.nextUp.href} className="button-secondary min-h-11 self-start md:self-auto">
                {dashboard.nextUp.actionLabel} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section aria-labelledby="up-to-date-heading" className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <h2 id="up-to-date-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            All current work is submitted
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            You can review your recent submissions or revisit a practical at any time.
          </p>
          <Link href="/submissions" className="button-secondary mt-5 min-h-11">View submissions</Link>
        </section>
      )}

      {dashboard.upcoming.length ? (
        <section aria-labelledby="upcoming-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="upcoming-heading" className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Upcoming</h2>
            <Link href="/practicals" className="text-link">View all</Link>
          </div>
          <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm divide-y divide-[var(--border)]">
            {dashboard.upcoming.map((practical) => (
              <li key={practical.id} className="list-none">
                <Link
                  href={practical.href}
                  aria-label={`${practical.actionLabel}: ${practical.title}`}
                  className="group grid min-h-16 gap-3 px-4 py-3 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] active:bg-[var(--surface-elevated)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6"
                >
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold text-[var(--text-primary)]">{practical.title}</span>
                    <span className="mt-1 block break-words text-xs text-[var(--text-muted)]">{practical.classroomName}</span>
                  </span>
                  <PracticalDeadline practical={practical} />
                  <span className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] group-hover:text-[var(--text-primary)]">
                    {practical.actionLabel} <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <section aria-labelledby="student-progress-heading" className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <p className="eyebrow">Published practicals</p>
          <h2 id="student-progress-heading" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Your progress
          </h2>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {dashboard.progress.submitted} of {dashboard.progress.total}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">practicals submitted</p>
          <div className="mt-5">
            <ProgressBar
              value={dashboard.progress.percentage}
              label={`${dashboard.progress.percentage}% submitted`}
              showPercentage={false}
            />
          </div>
          <Link href="/progress" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]">
            View progress <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </section>

        <section aria-labelledby="recent-submissions-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="recent-submissions-heading" className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              Recent submissions
            </h2>
            {dashboard.recentSubmissions.length ? <Link href="/submissions" className="text-link">View all</Link> : null}
          </div>
          {dashboard.recentSubmissions.length ? (
            <ol className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm divide-y divide-[var(--border)]">
              {dashboard.recentSubmissions.map((submission) => (
                <li key={submission.id} className="list-none">
                  <Link
                    href={`/submissions/${submission.id}`}
                    aria-label={`View ${submission.practicalTitle}, attempt ${submission.attemptNumber}`}
                    className="grid min-h-16 gap-3 px-4 py-3 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] active:bg-[var(--surface-elevated)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5"
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold text-[var(--text-primary)]">{submission.practicalTitle}</span>
                      <span className="mt-1 block break-words text-xs text-[var(--text-muted)]">
                        {submission.classroomName} · Attempt #{submission.attemptNumber} · <time dateTime={submission.submittedAt}>{submittedAtLabel(submission.submittedAt)}</time>
                      </span>
                    </span>
                    <StatusBadge tone={submission.resultTone}>{submission.resultLabel}</StatusBadge>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <p className="text-sm font-semibold text-[var(--text-primary)]">No submissions yet</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                Your submitted attempts will appear here.
              </p>
              <Link href="/practicals" className="button-secondary mt-5 min-h-11">View practicals</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
