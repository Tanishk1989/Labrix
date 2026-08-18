import Link from "next/link";
import { ArrowRight, Clock3, Plus, Users } from "lucide-react";
import { EmptyState, ProgressBar, StatusBadge } from "@/components/design-system";
import { JoinCode } from "@/components/interactive-design-system";
import { LiveLabMonitor } from "./live-lab-monitor";
import type { ClassroomOverviewViewModel } from "./classroom-overview-view-model";

function dateLabel(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function ClassroomOverviewPage({ classroom }: { classroom: ClassroomOverviewViewModel }) {
  const task = classroom.task;
  return (
    <div className="space-y-6">
      <header>
        <nav aria-label="Breadcrumbs" className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link href="/classes" className="hover:text-white">Classes</Link><span>/</span><span className="text-[var(--text-secondary)]">{classroom.name}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3"><h1 className="page-heading mt-0">{classroom.name}</h1><span className="count-chip">{classroom.subject}</span></div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)]">
              <span>{classroom.section}</span><span>{classroom.studentCount} students</span><span>{classroom.practicalCount} published</span><span>Join code <JoinCode code={classroom.joinCode} /></span>
            </div>
          </div>
          <Link href={`/classes/${classroom.id}/tasks/new`} className="button"><Plus size={15} /> Create practical</Link>
        </div>
      </header>

      <nav aria-label="Classroom sections" className="tabs overflow-x-auto">
        <a href="#overview" aria-current="page" className="tab-item tab-item-active">Overview</a>
        <a href="#practicals" className="tab-item">Practicals</a>
        <Link href={`/classes/${classroom.id}/students`} className="tab-item">Students</Link>
        <Link href={`/submissions?classroom=${encodeURIComponent(classroom.id)}`} className="tab-item">Review</Link>
        <Link href={`/progress?classroom=${encodeURIComponent(classroom.id)}`} className="tab-item">Progress</Link>
      </nav>

      {task ? (
        <LiveLabMonitor taskTitle={task.title} classroomId={classroom.id} />
      ) : null}

      <div id="overview" className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <section className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="eyebrow">Latest published practical</p><h2 className="mt-2 text-lg font-semibold text-white">{task?.title ?? "No practical published"}</h2></div>
              {task ? <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"><Clock3 size={13} />{dateLabel(task.deadline)}</span> : null}
            </div>
            {task ? (
              <div className="mt-5">
                <ProgressBar value={task.completion} label={`${classroom.submittedCount}/${classroom.studentCount} students submitted`} />
                <div className="mt-4 flex gap-2"><Link href={`/progress?classroom=${encodeURIComponent(classroom.id)}`} className="button">Review progress <ArrowRight size={13} /></Link><Link href={`/submissions?classroom=${encodeURIComponent(classroom.id)}&practical=${encodeURIComponent(task.id)}`} className="button-secondary">View attempts</Link></div>
              </div>
            ) : <p className="mt-3 text-xs text-[var(--text-muted)]">Publish a practical to start tracking student submissions.</p>}
          </section>

          <section className="panel overflow-hidden">
            <div className="panel-header"><div><h2 className="section-heading">Needs attention</h2><p className="section-description">Students who have not submitted the latest practical.</p></div><span className="count-chip">{classroom.outstandingStudents.length}</span></div>
            {classroom.outstandingStudents.length ? (
              <div className="divide-y divide-[var(--border-subtle)]">
                {classroom.outstandingStudents.slice(0, 6).map((student) => <div key={student.id} className="flex items-center gap-3 px-4 py-3"><span className="grid size-7 place-items-center rounded-full bg-[var(--surface-elevated)]"><Users size={13} /></span><div><p className="text-xs font-semibold text-white">{student.name}</p><p className="text-xs text-[var(--text-muted)]">{student.email}</p></div><span className="ml-auto status-badge status-warning">Not submitted</span></div>)}
              </div>
            ) : <div className="p-4"><EmptyState title={task ? "Everyone has submitted" : "No active practical"} description={task ? "Every enrolled student has submitted this practical." : "Attention items appear after a practical is published."} actionLabel={task ? "View submissions" : "Create practical"} actionHref={task ? `/submissions?classroom=${encodeURIComponent(classroom.id)}` : `/classes/${classroom.id}/tasks/new`} /></div>}
          </section>
        </div>

        <section id="practicals" className="panel self-start overflow-hidden">
          <div className="panel-header"><div><h2 className="section-heading">Recent practicals</h2><p className="section-description">Draft and published work for this class.</p></div><span className="count-chip">{classroom.practicals.length}</span></div>
          {classroom.practicals.length ? <div className="divide-y divide-[var(--border-subtle)]">{classroom.practicals.map((practical) => <div key={practical.id} className="px-4 py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white">{practical.title}</p><p className="mt-1 text-[11px] text-[var(--text-muted)]">{practical.status === "PUBLISHED" ? `${practical.submittedCount}/${classroom.studentCount} submitted` : "Not visible to students"} · {dateLabel(practical.deadline)}</p></div><StatusBadge tone={practical.status === "PUBLISHED" ? "published" : "draft"}>{practical.status === "PUBLISHED" ? "Published" : "Draft"}</StatusBadge></div>{practical.status === "PUBLISHED" ? <div className="mt-3"><ProgressBar value={practical.completionPercentage} showPercentage={false} /></div> : null}</div>)}</div> : <div className="p-4"><EmptyState title="No practicals" description="Create a draft to begin." actionLabel="Create practical" actionHref={`/classes/${classroom.id}/tasks/new`} /></div>}
        </section>
      </div>
    </div>
  );
}
