import Link from "next/link";
import { ArrowRight, Plus, Search } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, StatusBadge } from "@/components/design-system";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getTeacherOverview } from "@/server/teacher/overview";
import { getStudentOverview } from "@/server/student/overview";
import { StudentPracticals } from "@/features/student/student-pages";

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "No deadline";
}

export default async function PracticalsOverviewPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; classroom?: string }> }) {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  if (actor.role === "STUDENT") {
    const overview = await getStudentOverview(actor.id);
    return <DemoShell actor={actor}><StudentPracticals overview={overview} /></DemoShell>;
  }
  const overview = await getTeacherOverview(actor.id);
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const status = params.status === "DRAFT" || params.status === "PUBLISHED" ? params.status : "ALL";
  const practicals = overview.practicals.filter((practical) =>
    (!query || `${practical.title} ${practical.classroomName} ${practical.classroomSubject}`.toLowerCase().includes(query)) &&
    (status === "ALL" || practical.status === status) &&
    (!params.classroom || practical.classroomId === params.classroom),
  );
  const createHref = overview.classrooms[0] ? `/classes/${overview.classrooms[0].id}/tasks/new` : "/classes";

  return (
    <DemoShell actor={actor}>
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Teacher workspace</p><h1 className="page-heading">Practicals</h1><p className="page-subtitle">Create, publish and monitor practicals across your classes.</p></div><Link href={createHref} className="button"><Plus size={15} /> Create practical</Link></header>

        <form className="panel flex flex-wrap items-center gap-3 p-3" action="/practicals">
          <label className="relative min-w-64 flex-1"><span className="sr-only">Search practicals</span><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input name="q" defaultValue={params.q} className="input pl-8" placeholder="Search practicals or classes" /></label>
          <select name="classroom" defaultValue={params.classroom ?? ""} className="input w-auto min-w-44" aria-label="Filter by class"><option value="">All classes</option>{overview.classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}</select>
          <select name="status" defaultValue={status} className="input w-auto min-w-36" aria-label="Filter by status"><option value="ALL">All statuses</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select>
          <button className="button-secondary" type="submit">Apply filters</button>
        </form>

        <div className="flex gap-1 border-b border-[var(--border)] pb-2 text-xs">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((item) => {
            const count = item === "ALL" ? overview.practicals.length : overview.practicals.filter((practical) => practical.status === item).length;
            return <Link key={item} href={`/practicals?status=${item}`} className={`rounded-md px-3 py-1.5 font-semibold ${status === item ? "border border-[var(--border-strong)] bg-[var(--surface-elevated)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-white"}`}>{item === "ALL" ? "All" : item === "PUBLISHED" ? "Published" : "Draft"} <span className="ml-1 text-[var(--text-muted)]">{count}</span></Link>;
          })}
        </div>

        {practicals.length ? <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Practical</th><th>Class</th><th>Visible tests</th><th>Submissions</th><th>Completion</th><th>Deadline</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{practicals.map((practical) => <tr key={practical.id}><td className="min-w-52 font-semibold text-white">{practical.title}</td><td className="min-w-48"><p className="text-xs text-white">{practical.classroomName}</p><p className="text-[11px] text-[var(--text-muted)]">{practical.classroomSubject}</p></td><td>{practical.testCount}</td><td>{practical.status === "PUBLISHED" ? `${practical.submittedCount}/${practical.studentCount}` : "—"}</td><td className="min-w-44">{practical.status === "PUBLISHED" ? <ProgressBar value={practical.completionPercentage} /> : <span className="text-xs text-[var(--text-muted)]">Not published</span>}</td><td className="min-w-32 text-xs text-[var(--text-secondary)]">{dateLabel(practical.deadline)}</td><td><StatusBadge tone={practical.status === "PUBLISHED" ? "published" : "draft"}>{practical.status}</StatusBadge></td><td><Link className="icon-button" aria-label={`Open ${practical.title}`} href={practical.status === "DRAFT" ? `/classes/${practical.classroomId}/tasks/${practical.id}/edit` : `/classes/${practical.classroomId}`}><ArrowRight size={14} /></Link></td></tr>)}</tbody></table></div></div> : <EmptyState title="No practicals found" description="Adjust the filters or create a practical in one of your classes." />}
      </div>
    </DemoShell>
  );
}
