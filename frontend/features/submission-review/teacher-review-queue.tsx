import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TeacherSubmissionRecord } from "@/server/teacher/overview";
import { teacherReviewStatusMeta } from "./review-queue";

function languageLabel(language: TeacherSubmissionRecord["language"]) {
  return language === "CPP" ? "C++" : "Java";
}

function submissionResultLabel(submission: TeacherSubmissionRecord) {
  if (submission.state === "COMPILATION_ERROR") return "Compilation error";
  if (submission.state === "RUNTIME_ERROR") return "Runtime error";
  if (submission.state === "TIME_LIMIT_EXCEEDED") return "Time limit exceeded";
  if (submission.state === "INTERNAL_ERROR") return "Provider error";
  if (submission.totalTests === 0) return "No tests configured";
  if (submission.passedTests === submission.totalTests) return "Passed all provided tests";
  return `${submission.passedTests}/${submission.totalTests} tests passed`;
}

function submittedLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TeacherReviewQueue({
  submissions,
  selectedId,
  compact = false,
}: {
  submissions: TeacherSubmissionRecord[];
  selectedId?: string;
  compact?: boolean;
}) {
  return (
    <nav aria-label={compact ? "Recent review queue" : "Submission review queue"}>
      <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm divide-y divide-[var(--border)]">
        {submissions.map((submission) => {
          const review = teacherReviewStatusMeta(submission.reviewStatus);
          const selected = submission.id === selectedId;

          return (
            <li key={submission.id}>
              <Link
                href={`/submissions/${submission.id}`}
                aria-current={selected ? "page" : undefined}
                aria-label={`Review attempt ${submission.attemptNumber} by ${submission.studentName}`}
                className={`group relative grid min-h-11 gap-3 py-4 transition-colors hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] active:bg-[var(--surface-elevated)] ${
                  compact
                    ? "px-3"
                    : "px-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(9rem,0.9fr)_minmax(8rem,0.7fr)_auto] sm:items-center sm:px-4"
                } ${selected ? "bg-[var(--surface-hover)]" : ""}`}
              >
                {selected ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-0.5 bg-[var(--brand-accent)]"
                  />
                ) : null}

                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                    {submission.studentName}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">
                    {submission.taskTitle}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">
                    {compact
                      ? `Attempt #${submission.attemptNumber} · ${languageLabel(submission.language)}`
                      : `${submission.classroomName} · Attempt #${submission.attemptNumber} · ${languageLabel(submission.language)}`}
                  </span>
                </span>

                <span className={compact ? "block" : "block sm:text-right"}>
                  <span className="block text-xs font-semibold text-[var(--text-primary)]">
                    {review.label}
                  </span>
                  <time
                    dateTime={submission.submittedAt}
                    className="mt-1 block text-xs text-[var(--text-muted)]"
                  >
                    {submittedLabel(submission.submittedAt)}
                  </time>
                </span>

                {compact ? null : (
                  <span className="block text-xs text-[var(--text-secondary)] sm:text-right">
                    <span className="block">{submissionResultLabel(submission)}</span>
                    <span className="mt-1 block text-xs text-[var(--text-muted)]">
                      {submission.teacherMarks
                        ? `${submission.teacherMarks.awarded}/${submission.teacherMarks.outOf} marks`
                        : submission.totalTests > 0
                          ? `Suggested ${submission.suggestedScore.toFixed(1)}/10`
                          : "No automated score"}
                    </span>
                  </span>
                )}

                {compact ? null : (
                  <span className="hidden min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] sm:inline-flex">
                    Review <ArrowRight size={13} aria-hidden="true" />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
