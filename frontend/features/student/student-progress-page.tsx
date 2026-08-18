import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState, PageHeader, ProgressBar } from "@/components/design-system";
import type { StudentOverview } from "@/server/student/overview";
import { buildStudentProgressViewModel } from "./student-progress-view-model";

function deadlineLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function StudentProgressPage({
  overview,
  classroomId,
}: {
  overview: StudentOverview;
  classroomId?: string;
}) {
  const progress = buildStudentProgressViewModel(overview);
  const selectedClass = classroomId
    ? overview.classes.find((classroom) => classroom.id === classroomId)
    : undefined;

  if (classroomId && !selectedClass) {
    return (
      <div className="space-y-8">
        <PageHeader title="Class unavailable" description="This class is not part of your active memberships." actions={<Link href="/classes" className="button min-h-11">Return to classes</Link>} />
      </div>
    );
  }

  const visibleClasses = selectedClass
    ? progress.classes.filter((classroom) => classroom.id === selectedClass.id)
    : progress.classes;
  const selectedProgress = visibleClasses[0];
  const summary = selectedProgress
    ? {
        total: selectedProgress.totalCount,
        submitted: selectedProgress.submittedCount,
        passedAllProvidedTests: selectedProgress.passedAllProvidedTestsCount,
        publishedReviews: selectedProgress.publishedReviewCount,
        percentage: selectedProgress.completionPercentage,
      }
    : progress.summary;
  const allSubmitted = summary.total > 0 && summary.submitted === summary.total;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={selectedClass ? [
          { label: "Classes", href: "/classes" },
          { label: selectedClass.name, href: `/classes/${selectedClass.id}` },
          { label: "Progress" },
        ] : undefined}
        title="Progress"
        description={selectedClass
          ? `Track your practicals and teacher feedback for ${selectedClass.name}.`
          : "Track your practicals and teacher feedback."}
        actions={<Link href={selectedClass ? `/practicals?classroom=${encodeURIComponent(selectedClass.id)}` : "/practicals"} className="button min-h-11">View practicals</Link>}
      />

      {progress.state === "NO_CLASSES" ? (
        <EmptyState
          title="No classes yet"
          description="Join a class to start tracking progress."
          actionLabel="View classes"
          actionHref="/classes"
        />
      ) : progress.state === "NO_PRACTICALS" ? (
        <EmptyState
          title="No progress yet"
          description="Your progress will appear after practicals are published."
          actionLabel="View classes"
          actionHref="/classes"
        />
      ) : (
        <>
          <section aria-labelledby="student-progress-summary-heading" className="student-progress-summary">
            <div>
              <p className="eyebrow">Practicals submitted</p>
              <h2 id="student-progress-summary-heading">
                {summary.submitted} of {summary.total} practicals submitted
              </h2>
              <ProgressBar
                value={summary.percentage}
                label={`${summary.percentage}% submitted`}
                ariaLabel={`${summary.submitted} of ${summary.total} published practicals submitted`}
              />
            </div>
            <dl>
              <div><dt>Published practicals</dt><dd>{summary.total}</dd></div>
              <div><dt>Submitted</dt><dd>{summary.submitted}</dd></div>
              <div><dt>Passed all provided tests</dt><dd>{summary.passedAllProvidedTests}</dd></div>
              <div><dt>Feedback published</dt><dd>{summary.publishedReviews}</dd></div>
            </dl>
            <p className="student-progress-summary-note">
              {allSubmitted
                ? "You’re up to date. All currently published practicals have a submission."
                : summary.submitted === 0
                  ? "Your published practicals are ready to start."
                  : "Submission, provided-test success, and teacher review are counted separately."}
            </p>
          </section>

          <section aria-labelledby="practical-progress-heading">
            <h2 id="practical-progress-heading" className="text-sm font-semibold text-[var(--text-primary)]">Practical progress</h2>
            <div className="student-progress-classes">
              {visibleClasses.map((classroom) => (
                <section key={classroom.id} aria-labelledby={`progress-class-${classroom.id}`} className="student-progress-class">
                  <header>
                    <div>
                      <h3 id={`progress-class-${classroom.id}`}>{classroom.name}</h3>
                      <p>{classroom.subject} · {classroom.section}</p>
                    </div>
                    <div className="student-progress-class-meter">
                      <span>{classroom.submittedCount} / {classroom.totalCount} submitted</span>
                      <ProgressBar
                        value={classroom.completionPercentage}
                        showPercentage={false}
                        ariaLabel={`${classroom.name}: ${classroom.submittedCount} of ${classroom.totalCount} practicals submitted`}
                      />
                    </div>
                  </header>
                  <ul>
                    {classroom.practicals.map((practical) => (
                      <li key={practical.id} className="student-progress-practical">
                        <div className="student-progress-practical-title">
                          <p>{practical.title}</p>
                          {practical.deadline ? (
                            <span>Due <time dateTime={practical.deadline}>{deadlineLabel(practical.deadline)}</time></span>
                          ) : <span>No deadline</span>}
                        </div>
                        <dl className="grid gap-2 text-xs">
                          <div><dt className="text-[var(--text-muted)]">Submission</dt><dd className="font-semibold text-[var(--text-primary)]">{practical.workStatusLabel}</dd></div>
                          <div><dt className="text-[var(--text-muted)]">Test result</dt><dd className="text-[var(--text-secondary)]">{practical.outcomeLabel ?? "Not available"}</dd></div>
                          <div><dt className="text-[var(--text-muted)]">Teacher review</dt><dd className="text-[var(--text-secondary)]">{practical.reviewLabel ?? "Not available"}</dd></div>
                        </dl>
                        <div className="student-progress-practical-marks">
                          {practical.publishedMarks ? (
                            <><span>Teacher marks</span><strong>{practical.publishedMarks.awarded} / {practical.publishedMarks.outOf}</strong></>
                          ) : practical.reviewLabel ? <span>No published marks</span> : null}
                        </div>
                        <Link href={practical.actionHref} className="student-progress-action">
                          {practical.actionLabel}<span className="sr-only">: {practical.title}</span>
                          <ArrowRight size={13} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
