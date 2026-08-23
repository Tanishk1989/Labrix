import Link from "next/link";
import { ArrowRight, Clock3, Code2, Sparkles } from "lucide-react";
import type { TeacherOverview, TeacherSubmissionRecord } from "@/server/teacher/overview";

function pendingSubmissions(overview: TeacherOverview) {
  return overview.submissions.filter(
    (submission) => submission.reviewStatus !== "PUBLISHED_FEEDBACK",
  );
}

function relativeAge(timestamp: string) {
  const elapsedMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const minutes = Math.max(1, Math.floor(elapsedMs / 60_000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function studentInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function oldestSubmission(submissions: TeacherSubmissionRecord[]) {
  return submissions.reduce<TeacherSubmissionRecord | null>((oldest, submission) => {
    if (!oldest) return submission;
    return new Date(submission.submittedAt) < new Date(oldest.submittedAt)
      ? submission
      : oldest;
  }, null);
}

export function PendingReviewsCard({ overview }: { overview: TeacherOverview }) {
  const submissions = pendingSubmissions(overview);
  const reviewCount = overview.summary.needsReviewCount;

  if (reviewCount === 0) return null;

  const oldest = oldestSubmission(submissions);
  const students = [...new Map(
    submissions.map((submission) => [submission.studentId, {
      id: submission.studentId,
      name: submission.studentName,
    }]),
  ).values()];
  const practicals = [...new Set(submissions.map((submission) => submission.taskTitle))];
  const studentCount = students.length || reviewCount;
  const practicalLabel = practicals.length === 1
    ? practicals[0]
    : `${practicals.length} practicals`;

  return (
    <section
      aria-labelledby="pending-reviews-heading"
      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-amber-400/25 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-amber-400/80" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-16 -top-24 size-56 rounded-full bg-amber-400/[0.07] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.10)]" aria-hidden="true" />
            Review queue
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-semibold tabular-nums tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
              {reviewCount}
            </span>
            <h2 id="pending-reviews-heading" className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)] sm:text-xl">
              Pending {reviewCount === 1 ? "Review" : "Reviews"}
            </h2>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
            {studentCount} {studentCount === 1 ? "student is" : "students are"} waiting for evaluation and feedback.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-[var(--text-secondary)]">
            {oldest ? (
              <span className="inline-flex items-center gap-1.5" title={`Submitted ${new Date(oldest.submittedAt).toLocaleString()}`}>
                <Clock3 size={13} className="text-amber-300" aria-hidden="true" />
                <span className="text-[var(--text-muted)]">Oldest</span>
                <strong className="font-semibold text-[var(--text-primary)]">{relativeAge(oldest.submittedAt)}</strong>
              </span>
            ) : null}
            {practicals.length ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Code2 size={13} className="shrink-0 text-cyan-400" aria-hidden="true" />
                <span className="max-w-52 truncate font-medium text-[var(--text-primary)]">{practicalLabel}</span>
              </span>
            ) : null}
            {students.length ? (
              <div className="flex items-center" aria-label={`${students.length} students in the review queue`}>
                <div className="flex -space-x-1.5">
                  {students.slice(0, 4).map((student) => (
                    <span
                      key={student.id}
                      title={student.name}
                      className="grid size-6 place-items-center rounded-full border-2 border-[var(--surface)] bg-[var(--surface-elevated)] text-[9px] font-semibold text-[var(--text-secondary)]"
                    >
                      {studentInitials(student.name)}
                    </span>
                  ))}
                </div>
                {students.length > 4 ? (
                  <span className="ml-2 text-[11px] text-[var(--text-muted)]">+{students.length - 4}</span>
                ) : null}
              </div>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
              <Sparkles size={13} className="text-cyan-400" aria-hidden="true" />
              AI-assisted grading ready
            </span>
          </div>
        </div>

        <Link
          href="/submissions"
          className="button group/button min-h-11 w-full shrink-0 px-4 font-semibold sm:w-auto"
        >
          Review Submissions
          <ArrowRight size={15} className="transition-transform duration-200 group-hover/button:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
