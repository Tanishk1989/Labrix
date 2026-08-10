"use client";

import Link from "next/link";
import { ArrowRight, Clock3, TriangleAlert } from "lucide-react";
import { useDemoRole } from "@/components/app-shell";
import { EmptyState, ProgressBar, StatusBadge } from "@/components/design-system";
import type { ClassroomOverviewViewModel } from "./classroom-overview-view-model";

function StudentClassroomOverview({ classroom }: { classroom: ClassroomOverviewViewModel }) {
  const task=classroom.task;
  const latest=classroom.studentLatestSubmission;
  const failed=latest&&latest.passedTests<latest.totalTests;
  return <div className="space-y-5"><header><nav className="mb-3 flex gap-2 text-xs text-[var(--text-muted)]"><Link href="/classes" className="hover:text-white">Classes</Link><span>/</span><span>{classroom.name}</span></nav><p className="eyebrow">Student workspace</p><h1 className="page-heading">{classroom.name}</h1><p className="page-subtitle">{classroom.subject} · {classroom.section} · {classroom.practicalCount} published practicals</p></header>
    <nav className="flex gap-1 border-b border-[var(--border)] pb-2 text-xs"><span className="rounded-md border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-3 py-1.5 font-semibold text-white">Overview</span><a href="#practicals" className="rounded-md px-3 py-1.5 text-[var(--text-secondary)] hover:text-white">Practicals</a><Link href="/submissions" className="rounded-md px-3 py-1.5 text-[var(--text-secondary)] hover:text-white">Submissions</Link><Link href="/progress" className="rounded-md px-3 py-1.5 text-[var(--text-secondary)] hover:text-white">Progress</Link></nav>
    {failed?<section className="flex items-center gap-3 rounded-[var(--radius)] border border-rose-500/25 bg-rose-500/5 p-4"><TriangleAlert size={15} className="text-rose-400"/><div className="flex-1"><p className="text-xs font-semibold text-white">Latest attempt did not pass every provided test</p><p className="mt-1 text-[11px] text-[var(--text-muted)]">{latest.passedTests}/{latest.totalTests} tests passed · Attempt #{latest.attemptNumber}</p></div><Link href={task?`/tasks/${task.id}`:"/classes"} className="button-secondary">Fix submission <ArrowRight size={12}/></Link></section>:null}
    <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]"><main>{task?<section className="panel p-5"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Latest published practical</p><h2 className="mt-2 text-base font-semibold text-white">{task.title}</h2></div><StatusBadge tone={latest?"success":"published"}>{latest?"Submitted":"Available"}</StatusBadge></div><div className="mt-5"><ProgressBar value={latest?100:0} label={latest?"Submitted":"Ready to start"}/></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4"><span className="text-xs text-[var(--text-secondary)]"><Clock3 size={12} className="mr-1 inline"/>{task.deadline?new Date(task.deadline).toLocaleString("en-IN"):"No deadline"}</span><Link href={`/practicals/${task.id}`} className="button">View practical <ArrowRight size={12}/></Link></div></section>:<EmptyState title="No published practicals" description="Your teacher has not published work for this class."/>}</main><aside id="practicals" className="panel self-start overflow-hidden"><div className="panel-header"><div><h2 className="section-heading">Practical history</h2><p className="section-description">Published work</p></div><span className="count-chip">{classroom.practicals.filter(item=>item.status==="PUBLISHED").length}</span></div><div className="divide-y divide-[var(--border-subtle)]">{classroom.practicals.filter(item=>item.status==="PUBLISHED").map(item=><Link href={`/practicals/${item.id}`} key={item.id} className="block px-4 py-3 hover:bg-[var(--surface-hover)]"><div className="flex justify-between gap-3"><p className="text-xs font-semibold text-white">{item.title}</p><StatusBadge tone="published">Published</StatusBadge></div><p className="mt-1 text-[10px] text-[var(--text-muted)]">{item.deadline?new Date(item.deadline).toLocaleString("en-IN"):"No deadline"}</p></Link>)}</div></aside></div>
  </div>;
}

export function ClassroomOverviewBridge({ classroom, teacherContent, resolvedRole }: { classroom: ClassroomOverviewViewModel; teacherContent: React.ReactNode; resolvedRole?: "TEACHER" | "STUDENT" }) {
  const demoRole=useDemoRole();
  const student=resolvedRole?resolvedRole==="STUDENT":demoRole==="student";
  return student?<StudentClassroomOverview classroom={classroom}/>:teacherContent;
}
