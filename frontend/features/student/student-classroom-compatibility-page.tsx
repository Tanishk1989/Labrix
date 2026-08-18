import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { PageHeader, ProgressBar, StatusBadge } from "@/components/design-system";
import type { StudentOverview } from "@/server/student/overview";
import { buildStudentClassesViewModel } from "./student-classes-view-model";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function StudentClassroomCompatibilityPage({
  overview,
  classroomId,
}: {
  overview: StudentOverview;
  classroomId: string;
}) {
  const classroom = buildStudentClassesViewModel(overview).classes.find(
    (item) => item.id === classroomId,
  );
  if (!classroom) {
    return (
      <div className="space-y-8">
        <PageHeader title="Class unavailable" description="This class is not part of your active student memberships." actions={<Link href="/classes" className="button min-h-11">Return to classes</Link>} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: "Classes", href: "/classes" }, { label: classroom.name }]}
        title={classroom.name}
        description={`${classroom.subject} · ${classroom.section}. View practicals, submissions, and progress for this class.`}
        actions={classroom.nextWork ? <Link href={classroom.nextWork.href} className="button min-h-11">{classroom.nextWork.actionLabel} <ArrowRight size={14} aria-hidden="true" /></Link> : <Link href={`/practicals?classroom=${encodeURIComponent(classroom.id)}`} className="button min-h-11">View practicals</Link>}
      />

      <nav aria-label="Classroom sections" className="tabs overflow-x-auto">
        <a href="#overview" aria-current="page" className="tab-item tab-item-active">Overview</a>
        <Link href={`/practicals?classroom=${encodeURIComponent(classroom.id)}`} className="tab-item">Practicals</Link>
        <Link href={`/submissions?classroom=${encodeURIComponent(classroom.id)}`} className="tab-item">Submissions</Link>
        <Link href={`/progress?classroom=${encodeURIComponent(classroom.id)}`} className="tab-item">Progress</Link>
      </nav>

      <section id="overview" aria-labelledby="class-work-heading" className="border-y border-[var(--border)] py-6 sm:py-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.7fr)] md:items-end">
          <div>
            <p className="eyebrow">Class work</p>
            <h2 id="class-work-heading" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {classroom.state === "NO_PRACTICALS"
                ? "No practicals published yet"
                : classroom.state === "UP_TO_DATE"
                  ? "You’re up to date"
                  : "Continue your practical work"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {classroom.state === "NO_PRACTICALS"
                ? "Your teacher hasn’t published any practicals for this class."
                : `${classroom.submittedCount} of ${classroom.publishedCount} practicals submitted.`}
            </p>
          </div>
          {classroom.completionPercentage !== null ? (
            <ProgressBar
              value={classroom.completionPercentage}
              label={`${classroom.submittedCount} of ${classroom.publishedCount} submitted`}
              ariaLabel={`${classroom.name}: ${classroom.submittedCount} of ${classroom.publishedCount} practicals submitted`}
            />
          ) : null}
        </div>
      </section>

      {classroom.nextWork ? (
        <section aria-labelledby="class-next-heading">
          <p className="eyebrow">Next</p>
          <div className="mt-2 grid gap-5 border-y border-[var(--border)] py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="class-next-heading" className="text-lg font-semibold text-[var(--text-primary)]">{classroom.nextWork.title}</h2>
                <StatusBadge tone={classroom.nextWork.statusLabel === "In progress" ? "warning" : "published"}>
                  {classroom.nextWork.statusLabel}
                </StatusBadge>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Clock3 size={13} aria-hidden="true" />
                {classroom.nextWork.deadline ? (
                  <time dateTime={classroom.nextWork.deadline}>Due {dateLabel(classroom.nextWork.deadline)}</time>
                ) : "No deadline"}
              </p>
            </div>
            <Link href={classroom.nextWork.href} className="button min-h-11 self-start sm:self-auto">
              {classroom.nextWork.actionLabel} practical <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
