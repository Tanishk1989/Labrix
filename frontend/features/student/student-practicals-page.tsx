import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/design-system";
import { JoinClassroomButton } from "@/features/classes/classroom-setup-actions";
import type { StudentOverview } from "@/server/student/overview";
import {
  buildStudentPracticalsViewModel,
  matchesStudentPracticalFilter,
  normalizeStudentPracticalFilter,
  type StudentPracticalFilter,
} from "./student-practicals-view-model";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function StudentPracticalsPage({
  overview,
  allowJoin,
  classroomId,
  status,
}: {
  overview: StudentOverview;
  allowJoin: boolean;
  classroomId?: string;
  status?: string;
}) {
  const selectedClass = classroomId
    ? overview.classes.find((classroom) => classroom.id === classroomId)
    : undefined;
  const scopedOverview = selectedClass
    ? {
        ...overview,
        classes: [selectedClass],
        practicals: overview.practicals.filter(
          (practical) => practical.classroom.id === selectedClass.id,
        ),
      }
    : overview;
  const view = buildStudentPracticalsViewModel(scopedOverview);
  const filter = normalizeStudentPracticalFilter(status);
  const practicals = view.practicals.filter((practical) =>
    matchesStudentPracticalFilter(practical.state, filter));
  const tabs: Array<{ value: StudentPracticalFilter; label: string }> = [
    { value: "ALL", label: "All" },
    { value: "TO_DO", label: "To do" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "FEEDBACK", label: "Feedback available" },
  ];

  if (classroomId && !selectedClass) {
    return (
      <div className="space-y-8">
        <PageHeader title="Class unavailable" description="This class is not part of your active memberships." actions={<Link href="/classes" className="button min-h-11">Return to classes</Link>} />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        breadcrumbs={selectedClass ? [
          { label: "Classes", href: "/classes" },
          { label: selectedClass.name, href: `/classes/${selectedClass.id}` },
          { label: "Practicals" },
        ] : undefined}
        title="Practicals"
        description={selectedClass
          ? `Published practicals for ${selectedClass.name}.`
          : "Your published practicals."}
        actions={view.practicals.find((practical) => practical.state === "IN_PROGRESS" || practical.state === "NOT_SUBMITTED") ? (() => {
          const next = view.practicals.find((practical) => practical.state === "IN_PROGRESS" || practical.state === "NOT_SUBMITTED")!;
          return <Link href={next.href} className="button min-h-11">{next.actionLabel}</Link>;
        })() : <Link href="/submissions" className="button min-h-11">View submissions</Link>}
      />

      {view.state === "READY" ? (
        <nav aria-label="Practical progress" className="flex overflow-x-auto border-b border-[var(--border)]">
          {tabs.map((tab) => {
            const query = new URLSearchParams({ status: tab.value });
            if (classroomId) query.set("classroom", classroomId);
            const count = view.practicals.filter((practical) =>
              matchesStudentPracticalFilter(practical.state, tab.value)).length;
            return <Link
              key={tab.value}
              href={`/practicals?${query.toString()}`}
              aria-current={filter === tab.value ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-xs font-semibold ${filter === tab.value ? "border-[var(--brand)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
            >{tab.label}<span className="text-[var(--text-muted)]">{count}</span></Link>;
          })}
        </nav>
      ) : null}

      {view.state === "NO_CLASSES" ? (
        <section aria-labelledby="no-practical-classes-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="no-practical-classes-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">No classes yet</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">Join a class before accessing practicals.</p>
          {allowJoin ? <div className="mt-6"><JoinClassroomButton variant="primary" /></div> : <Link href="/dashboard" className="button-secondary mt-6 min-h-11">Return home</Link>}
        </section>
      ) : view.state === "NO_PRACTICALS" ? (
        <section aria-labelledby="no-student-practicals-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="no-student-practicals-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">No practicals yet</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
            {selectedClass
              ? "Your teacher hasn’t published any practicals for this class."
              : "Your teacher hasn’t published any practicals for your classes."}
          </p>
          <Link href={selectedClass ? `/classes/${selectedClass.id}` : "/classes"} className="button-secondary mt-6 min-h-11">View classes</Link>
        </section>
      ) : practicals.length ? (
        <ul aria-label="Published practicals" className="grid gap-5">
          {practicals.map((practical) => (
            <li key={practical.id} className="list-none">
              <article className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="break-words text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{practical.title}</h2>
                    <StatusBadge tone={practical.state === "FEEDBACK_AVAILABLE" ? "success" : practical.state === "IN_PROGRESS" ? "warning" : "neutral"}>
                      {practical.statusLabel}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 break-words text-sm text-[var(--text-secondary)]">{practical.classroomName}</p>
                  <p className="mt-1 break-words text-xs text-[var(--text-muted)]">{practical.classroomSubject}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)]">
                    {practical.deadline ? (
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={13} aria-hidden="true" /><time dateTime={practical.deadline}>Due {dateLabel(practical.deadline)}</time></span>
                    ) : <span>No deadline</span>}
                    {practical.latestSubmittedAt ? <span>Submitted <time dateTime={practical.latestSubmittedAt}>{dateLabel(practical.latestSubmittedAt)}</time></span> : null}
                  </div>
                </div>
                <Link
                  href={practical.href}
                  aria-label={`${practical.actionLabel}: ${practical.title}`}
                  className="inline-flex min-h-11 items-center gap-1.5 self-start text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)] sm:self-auto"
                >
                  {practical.actionLabel} <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <section className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Nothing here yet</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Practicals will move into this view as your work progresses.</p>
          <Link href="/practicals?status=ALL" className="button-secondary mt-6 min-h-11">View all practicals</Link>
        </section>
      )}
    </div>
  );
}
