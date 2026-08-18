import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleX } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { ExecutionModeBadge } from "@/components/execution-mode-badge";
import { SubmissionCodeViewer } from "@/features/submission-review/submission-code-viewer";
import { StudentJourneyTimeline } from "@/features/submission-review/student-journey-timeline";
import type { getSubmissionForStudent } from "@/server/attempts/service";

type Submission = Awaited<ReturnType<typeof getSubmissionForStudent>>;

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function resultLabel(submission: Submission) {
  const result = submission.result;
  if (result.state === "compilation_error") return "Compilation failed";
  if (result.state === "runtime_error") return "Runtime error";
  if (result.state === "time_limit_exceeded") return "Execution timed out";
  if (result.state === "internal_error") return "Result unavailable";
  if (result.visibleTotalTests === 0) return "No visible tests configured";
  if (result.visiblePassedTests === result.visibleTotalTests) return "All visible tests passed";
  return `${result.visiblePassedTests} of ${result.visibleTotalTests} visible tests passed`;
}

export function StudentSubmissionResult({ submission }: { submission: Submission }) {
  const result = resultLabel(submission);
  return (
    <div className="space-y-8">
      <Link href="/submissions" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft size={14} aria-hidden="true" /> Back to submissions
      </Link>

      <PageHeader
        eyebrow={`Attempt #${submission.attemptNumber}`}
        title={submission.task.title}
        description={`${submission.task.classroom.name} · Submitted ${dateTimeLabel(submission.submittedAt)} · ${submission.language === "CPP" ? "C++" : "Java"}`}
        compact
        actions={(
          <>
            <Link href={`/practicals/${submission.task.id}`} className="button-secondary min-h-11">Back to practical</Link>
            <Link href={`/tasks/${submission.task.id}`} className="button min-h-11">Start a new attempt</Link>
          </>
        )}
      />

      <StudentJourneyTimeline
        events={submission.events}
        attemptNumber={submission.attemptNumber}
        submittedAt={submission.submittedAt}
        reviewStatus={submission.review?.status ?? "PENDING"}
        marksAwarded={submission.review?.marksAwarded}
        marksOutOf={submission.review?.marksOutOf ?? submission.task.maximumMarks}
        runCount={submission.runCount}
        passedTests={submission.result.visiblePassedTests}
        totalTests={submission.result.visibleTotalTests}
        studentName={submission.student.name}
      />

      <section aria-labelledby="submission-result-heading" className="student-submission-detail-result">
        <div>
          <p className="eyebrow">Submission status</p>
          <h2 id="submission-result-heading">Recorded</h2>
          <ExecutionModeBadge mode={submission.result.executionMode} />
        </div>
        <dl>
          <div><dt>Test result</dt><dd>{result}</dd></div>
          <div><dt>Visible tests</dt><dd>{submission.result.visiblePassedTests} / {submission.result.visibleTotalTests}</dd></div>
          {submission.result.hiddenTotalTests > 0 ? (
            <div><dt>Hidden tests</dt><dd>{submission.result.hiddenPassedTests} / {submission.result.hiddenTotalTests}</dd></div>
          ) : null}
          <div><dt>Teacher review</dt><dd>{submission.review ? "Feedback published" : "Pending"}</dd></div>
        </dl>
        <p className="student-submission-score-note">
          Hidden test details remain hidden. Teacher-awarded marks appear only after feedback is published.
        </p>
      </section>

      {submission.review ? (
        <section aria-labelledby="teacher-feedback-heading" className="student-published-feedback">
          <div>
            <p className="eyebrow">Teacher feedback</p>
            <h2 id="teacher-feedback-heading">Published feedback</h2>
          </div>
          <dl><dt>Published marks</dt><dd>{submission.review.marksAwarded} / {submission.review.marksOutOf}</dd></dl>
          {submission.review.criterionScores.length ? <dl className="student-feedback-rubric">{submission.review.criterionScores.map((criterion) => <div key={criterion.title}><dt>{criterion.title}</dt><dd>{criterion.marksAwarded} / {criterion.maximumMarks}</dd></div>)}</dl> : null}
          <p className="student-feedback-body">{submission.review.feedback || "No written feedback was added."}</p>
          {submission.review.publishedAt ? (
            <p className="student-feedback-published">
              Published <time dateTime={submission.review.publishedAt}>{dateTimeLabel(submission.review.publishedAt)}</time>
            </p>
          ) : null}
        </section>
      ) : (
        <section aria-labelledby="teacher-feedback-heading" className="student-review-pending">
          <h2 id="teacher-feedback-heading">Teacher review pending</h2>
          <p>Published marks and feedback will appear here when they are available.</p>
        </section>
      )}

      <SubmissionCodeViewer sourceCode={submission.sourceCode} language={submission.language} />

      <section aria-labelledby="student-visible-results-heading" className="border-y border-[var(--border)]">
        <header className="py-4">
          <h2 id="student-visible-results-heading" className="text-sm font-semibold text-[var(--text-primary)]">Visible test results</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Hidden test inputs, outputs, and identifiers are not shown.</p>
        </header>
        {submission.result.testResults.length ? (
          <ol className="student-visible-result-list">
            {submission.result.testResults.map((test, index) => (
              <li key={`${test.testId}-${index}`}>
                <div className="student-visible-result-heading">
                  {test.passed ? <CheckCircle2 size={15} aria-hidden="true" /> : <CircleX size={15} aria-hidden="true" />}
                  <h3>Test {test.position ?? index + 1}</h3>
                  <span>{test.passed ? "Passed" : "Failed"}</span>
                </div>
                <dl>
                  {test.input !== null ? <div><dt>Input</dt><dd><pre><code>{test.input || "(empty)"}</code></pre></dd></div> : null}
                  {test.expectedOutput !== null ? <div><dt>Expected output</dt><dd><pre><code>{test.expectedOutput || "(empty)"}</code></pre></dd></div> : null}
                  <div><dt>Your output</dt><dd><pre><code>{test.actualOutput || "(empty)"}</code></pre></dd></div>
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <p className="border-t border-[var(--border)] py-5 text-xs text-[var(--text-muted)]">No visible per-test output was stored.</p>
        )}
      </section>

      <footer className="flex flex-wrap gap-2">
        <p className="w-full text-xs leading-5 text-[var(--text-secondary)]">Starting a new attempt will not change Attempt #{submission.attemptNumber}. Your next submission will be saved as a separate permanent attempt.</p>
        <Link href={`/practicals/${submission.task.id}`} className="button-secondary min-h-11">Return to practical</Link>
        <Link href={`/tasks/${submission.task.id}`} className="button min-h-11">Start a new attempt</Link>
      </footer>
    </div>
  );
}
