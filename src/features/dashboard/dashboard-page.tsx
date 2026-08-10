import Link from "next/link";
import { ArrowRight, Clock3, Plus } from "lucide-react";
import { EmptyState, MetricCard, ProgressBar, StatusBadge } from "@/components/design-system";
import type { TeacherOverview } from "@/server/teacher/overview";

function dateLabel(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function TeacherDashboardPage({ overview }: { overview: TeacherOverview }) {
  const published = overview.practicals.filter((item) => item.status === "PUBLISHED");
  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Teacher workspace</p>
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-subtitle">Classes, practical activity and recent immutable submissions.</p>
        </div>
        <Link href={overview.classrooms[0] ? `/classes/${overview.classrooms[0].id}/tasks/new` : "/classes"} className="button">
          <Plus size={15} /> Create practical
        </Link>
      </header>

      <section aria-label="Workspace summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Classes" value={overview.summary.classroomCount} />
        <MetricCard label="Students" value={overview.summary.distinctStudentCount} detail="Distinct active memberships" />
        <MetricCard label="Published practicals" value={overview.summary.publishedPracticalCount} />
        <MetricCard label="Submission attempts" value={overview.summary.submissionAttemptCount} detail="Immutable attempts" />
      </section>

      <section>
        <div className="section-heading-row">
          <div>
            <h2 className="section-heading">Needs attention</h2>
            <p className="section-description">Objective deadlines, missing submissions and unpublished drafts.</p>
          </div>
          <span className="count-chip">{overview.attention.length}</span>
        </div>
        {overview.attention.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {overview.attention.map((item) => (
              <article key={item.id} className="panel p-4">
                <div className="flex items-center justify-between">
                  <span className={`signal-dot signal-${item.tone}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Objective signal</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 min-h-9 text-xs leading-5 text-[var(--text-secondary)]">{item.detail}</p>
                <Link className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-[var(--brand-accent)]" href={item.href}>
                  {item.action} <ArrowRight size={12} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing needs attention" description="No approaching deadlines, missing submissions or unpublished drafts were found." />
        )}
      </section>

      <section>
        <div className="section-heading-row">
          <h2 className="section-heading">Your classes</h2>
          <Link href="/classes" className="text-link">View all</Link>
        </div>
        {overview.classrooms.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {overview.classrooms.slice(0, 4).map((classroom) => (
              <Link key={classroom.id} href={`/classes/${classroom.id}`} className="panel group p-4 hover:border-[var(--border-strong)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{classroom.subject} · {classroom.section}</p>
                    <h3 className="mt-1 text-sm font-semibold text-white">{classroom.name}</h3>
                  </div>
                  <ArrowRight size={14} className="text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)]">
                  <span>{classroom.studentCount} students</span>
                  <span>{classroom.publishedPracticalCount} published</span>
                  <span className="truncate">{classroom.activePracticalTitle ?? "No published practical"}</span>
                </div>
                <div className="mt-3"><ProgressBar value={classroom.completionPercentage} label="Latest practical completion" /></div>
              </Link>
            ))}
          </div>
        ) : <EmptyState title="No classes yet" description="Create a classroom before publishing your first practical." />}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="panel-header">
            <div><h2 className="section-heading">Published practicals</h2><p className="section-description">Completion counts each enrolled student once.</p></div>
            <Link href="/practicals" className="text-link">Manage</Link>
          </div>
          {published.length ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {published.slice(0, 5).map((practical) => (
                <Link key={practical.id} href={`/classes/${practical.classroomId}`} className="block px-4 py-3 hover:bg-[var(--surface-hover)]">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-sm font-semibold text-white">{practical.title}</h3><p className="mt-0.5 text-xs text-[var(--text-muted)]">{practical.classroomSubject} · {practical.classroomName}</p></div>
                    <StatusBadge tone="published">Published</StatusBadge>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-4">
                    <ProgressBar value={practical.completionPercentage} label={`${practical.submittedCount}/${practical.studentCount} submitted`} showPercentage={false} />
                    <span className="pb-0.5 text-xs text-[var(--text-secondary)]"><Clock3 className="mr-1 inline" size={12} />{dateLabel(practical.deadline)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : <div className="p-4"><EmptyState title="No published practicals" description="Published work will appear here." /></div>}
        </section>

        <section className="panel overflow-hidden">
          <div className="panel-header"><div><h2 className="section-heading">Recent submissions</h2><p className="section-description">Latest persisted attempts.</p></div><Link href="/submissions" className="text-link">View all</Link></div>
          {overview.submissions.length ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {overview.submissions.slice(0, 6).map((submission) => {
                const passed = submission.state === "COMPLETED" && submission.passedTests === submission.totalTests;
                return (
                  <Link key={submission.id} href={`/submissions/${submission.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)]">
                    <span className={`signal-dot ${passed ? "signal-success" : submission.state === "COMPILATION_ERROR" ? "signal-danger" : "signal-warning"}`} />
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{submission.studentName}</p><p className="truncate text-[11px] text-[var(--text-muted)]">{submission.taskTitle} · Attempt {submission.attemptNumber}</p></div>
                    <div className="text-right"><p className="text-[11px] font-medium text-[var(--text-secondary)]">{submission.passedTests}/{submission.totalTests} tests</p><p className="text-[10px] text-[var(--text-muted)]">{relativeTime(submission.submittedAt)}</p></div>
                  </Link>
                );
              })}
            </div>
          ) : <div className="p-4"><EmptyState title="No submissions yet" description="Student attempts will appear here after submission." /></div>}
        </section>
      </div>
    </div>
  );
}
