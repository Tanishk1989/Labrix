import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/design-system";
import type { StudentOverview } from "@/server/student/overview";
import { createStudentSubmissionHistoryViewModel } from "./student-submissions-view-model";

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StudentSubmissionsPage({
  overview,
  classroomId,
}: {
  overview: StudentOverview;
  classroomId?: string;
}) {
  const selectedClass = classroomId
    ? overview.classes.find((classroom) => classroom.id === classroomId)
    : undefined;
  const attempts = createStudentSubmissionHistoryViewModel(overview).filter(
    (attempt) => !selectedClass || attempt.classroom.id === selectedClass.id,
  );

  if (classroomId && !selectedClass) {
    return (
      <div className="space-y-8">
        <PageHeader title="Class unavailable" description="This class is not part of your active memberships." actions={<Link href="/classes" className="button min-h-11">Return to classes</Link>} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={selectedClass ? [
          { label: "Classes", href: "/classes" },
          { label: selectedClass.name, href: `/classes/${selectedClass.id}` },
          { label: "Submissions" },
        ] : undefined}
        title="Submissions"
        description={selectedClass
          ? `Your submitted attempts and teacher feedback for ${selectedClass.name}.`
          : "Your submitted attempts and teacher feedback."}
        actions={<Link href={selectedClass ? `/practicals?classroom=${encodeURIComponent(selectedClass.id)}` : "/practicals"} className="button min-h-11">View practicals</Link>}
      />
      {attempts.length ? (
        <section aria-labelledby="student-attempts-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="student-attempts-heading" className="text-sm font-semibold text-[var(--text-primary)]">
              Attempt history
            </h2>
            <span className="text-xs text-[var(--text-muted)]">{attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}</span>
          </div>
          <ol className="student-submission-list">
            {attempts.map((attempt) => (
              <li key={attempt.id} className="student-submission-row">
                <div className="student-submission-primary">
                  <p>{attempt.practical.title}</p>
                  <span>{attempt.classroom.name}</span>
                </div>
                <div className="student-submission-context">
                  <span>Submission</span>
                  <p>Recorded · Attempt #{attempt.attemptNumber} · {attempt.languageLabel}</p>
                  <time dateTime={attempt.submittedAt}>{dateTimeLabel(attempt.submittedAt)}</time>
                </div>
                <dl className="student-submission-result">
                  <div><dt>Test result</dt><dd>{attempt.resultLabel}</dd></div>
                  <div><dt>Teacher review</dt><dd>{attempt.reviewLabel}</dd></div>
                  <div><dt>Marks</dt><dd>{attempt.publishedMarks
                    ? `${attempt.publishedMarks.awarded} / ${attempt.publishedMarks.outOf}`
                    : "Not published"}</dd></div>
                </dl>
                <Link href={attempt.detailHref} className="student-submission-link">
                  View attempt <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <EmptyState
          title="No submissions yet"
          description={selectedClass
            ? "Your submitted attempts for this class will appear here."
            : "Your submitted practical attempts will appear here."}
          actionLabel="View practicals"
          actionHref="/practicals"
        />
      )}
    </div>
  );
}
