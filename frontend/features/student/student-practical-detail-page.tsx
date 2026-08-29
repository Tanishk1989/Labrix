import Link from "next/link";
import { ArrowRight, Clock3, MessageSquareText } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/design-system";
import type { StudentOverview } from "@/server/student/overview";
import { buildStudentPracticalDetailViewModel } from "./student-practicals-view-model";

type StudentPractical = StudentOverview["practicals"][number];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function languageLabel(language: "CPP" | "JAVA") {
  return language === "CPP" ? "C++" : "Java";
}

export function StudentPracticalDetailPage({ practical }: { practical: StudentPractical }) {
  const view = buildStudentPracticalDetailViewModel(practical);
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        breadcrumbs={[
          { label: "Practicals", href: "/practicals" },
          { label: view.classroom.name, href: `/classes/${view.classroom.id}` },
          { label: view.title },
        ]}
        title={view.title}
        description={`${view.classroom.subject} · ${view.classroom.name}`}
        actions={view.workspaceHref ? (
          <Link
            href={view.workspaceHref}
            aria-label={`${view.workspaceActionLabel} ${view.title}`}
            className="button min-h-11"
          >
            {view.workspaceActionLabel} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-muted)]">
            {view.workspaceActionLabel}
          </span>
        )}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-[var(--border)] py-4 text-xs text-[var(--text-secondary)]">
        <StatusBadge tone={view.state === "FEEDBACK_AVAILABLE" ? "success" : view.state === "IN_PROGRESS" ? "warning" : "neutral"}>
          {view.statusLabel}
        </StatusBadge>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={13} aria-hidden="true" />
          {view.deadline ? <time dateTime={view.deadline}>Due {dateLabel(view.deadline)}</time> : "No deadline"}
        </span>
        <span>{view.allowedLanguages.map(languageLabel).join(" · ")}</span>
      </div>

      <article className="max-w-3xl space-y-10">
        <section aria-labelledby="before-start-heading" className="border-y border-[var(--border)] py-6">
          <p className="eyebrow">Before you start</p>
          <h2 id="before-start-heading" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">How your work is saved</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
            <li>Available languages: <strong className="font-semibold text-[var(--text-primary)]">{view.allowedLanguages.map(languageLabel).join(" or ")}</strong>.</li>
            <li>{view.deadline ? <>{view.workspaceHref ? "Submit by" : "Submission closed on"} <strong className="font-semibold text-[var(--text-primary)]">{dateLabel(view.deadline)}</strong>.</> : "There is no submission deadline."}</li>
            <li>Your code is saved automatically while you work.</li>
            <li><strong className="font-semibold text-[var(--text-primary)]">Run visible tests</strong> gives practice feedback and does not submit your work.</li>
            <li><strong className="font-semibold text-[var(--text-primary)]">Submit attempt</strong> records a permanent copy and also checks any hidden tests.</li>
            <li>You can start a new numbered attempt after submitting; earlier submissions remain unchanged.</li>
          </ul>
        </section>

        <section aria-labelledby="problem-heading">
          <p className="eyebrow">Problem statement</p>
          <h2 id="problem-heading" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Problem</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{view.instructions}</p>
        </section>

        {view.constraints ? (
          <section aria-labelledby="requirements-heading" className="border-t border-[var(--border)] pt-8">
            <h2 id="requirements-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Requirements</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{view.constraints}</p>
          </section>
        ) : null}

        {view.visibleTests.length ? (
          <section aria-labelledby="visible-tests-heading" className="border-t border-[var(--border)] pt-8">
            <h2 id="visible-tests-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Visible tests</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">These tests are shown during practice runs. Hidden tests, if configured, run only when you submit.</p>
            <ol className="mt-5 space-y-5">
              {view.visibleTests.map((test, index) => (
                <li key={test.id} className="border-y border-[var(--border)] py-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Test {index + 1}</h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-[var(--text-muted)]">Input</dt>
                      <dd><pre className="mt-2 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--code-surface,#0b0d12)] p-3 text-xs text-[var(--text-secondary)]">{test.input || "(no input)"}</pre></dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-[var(--text-muted)]">Expected output</dt>
                      <dd><pre className="mt-2 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--code-surface,#0b0d12)] p-3 text-xs text-[var(--text-secondary)]">{test.expectedOutput || "(no output)"}</pre></dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {view.latestSubmission ? (
          <section aria-labelledby="latest-submission-heading" className="border-t border-[var(--border)] pt-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <h2 id="latest-submission-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Latest submission</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Attempt #{view.latestSubmission.attemptNumber} · Submitted <time dateTime={view.latestSubmission.submittedAt}>{dateLabel(view.latestSubmission.submittedAt)}</time>
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {view.latestSubmission.totalTests > 0
                    ? `${view.latestSubmission.passedTests} of ${view.latestSubmission.totalTests} provided tests passed`
                    : "No tests were configured for this submission"}
                </p>
              </div>
              <Link href={view.latestSubmission.href} className="button-secondary min-h-11">View submission</Link>
            </div>
            {view.latestSubmission.feedbackAvailable ? (
              <div className="mt-5 flex gap-3 border-l-2 border-[var(--brand-accent)] pl-4">
                <MessageSquareText size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--brand-accent)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Teacher feedback available</p>
                  <Link href={view.latestSubmission.href} className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]">
                    View feedback <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </article>
    </div>
  );
}
