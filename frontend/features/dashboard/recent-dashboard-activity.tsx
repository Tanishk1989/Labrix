import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/design-system";
import { SpotlightCard } from "@/components/spotlight-card";
import type { DashboardRecentSubmission } from "./dashboard-view-model";

function submittedAtLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RecentDashboardActivity({ submissions }: { submissions: DashboardRecentSubmission[] }) {
  return (
    <section aria-labelledby="recent-activity-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Student submissions</p>
          <h2 id="recent-activity-heading" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Recent activity
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            The latest student submissions across your classes.
          </p>
        </div>
        <Link href="/submissions" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--color-brand)] hover:underline">
          View all submissions <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {submissions.length ? (
        <SpotlightCard spotlightColor="rgba(var(--spotlight-rgb), 0.08)" className="p-2 divide-y divide-[var(--border)] shadow-[var(--shadow-card)]">
          {submissions.map((submission) => (
            <div key={submission.id} className="first:pt-0 last:pb-0">
              <Link
                href={`/submissions/${submission.id}`}
                aria-label={`Review submission attempt ${submission.attemptNumber} by ${submission.studentName}`}
                className="group grid min-h-20 gap-3 px-4 py-3.5 rounded-[var(--radius-md)] transition-all hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Submission · Attempt {submission.attemptNumber}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-brand)] transition-colors">
                    {submission.studentName}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                    {submission.taskTitle} · {submission.classroomName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge tone="neutral">{submission.resultLabel}</StatusBadge>
                  <span className="text-xs text-[var(--text-secondary)]">{submission.reviewLabel}</span>
                </div>
                <div className="flex min-w-40 items-center justify-between gap-3 text-xs text-[var(--text-muted)] sm:justify-end">
                  <time dateTime={submission.submittedAt}>{submittedAtLabel(submission.submittedAt)}</time>
                  <ArrowRight size={14} aria-hidden="true" className="text-[var(--color-brand)] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          ))}
        </SpotlightCard>
      ) : (
        <SpotlightCard className="p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No recent submissions</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Student attempts will appear here after they submit practicals.
          </p>
        </SpotlightCard>
      )}
    </section>
  );
}
