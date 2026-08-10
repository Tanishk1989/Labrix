"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState, MetricCard, ProgressBar } from "@/components/design-system";
import { useDemoRole } from "@/components/app-shell";
import { JoinClassroomButton } from "./classroom-setup-actions";
import type { MyClassesViewModel } from "./my-classes-view-model";

function StudentMyClasses({ viewModel, allowJoin }: { viewModel: MyClassesViewModel; allowJoin: boolean }) {
  const totalPracticals = viewModel.activeClasses.reduce((sum,item)=>sum+item.activePracticalCount,0);
  const overall = viewModel.activeClasses.length ? Math.round(viewModel.activeClasses.reduce((sum,item)=>sum+(item.latestPractical?.completionPercentage??0),0)/viewModel.activeClasses.length) : 0;
  return <div className="space-y-5"><header className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Student workspace</p><h1 className="page-heading">Classes</h1><p className="page-subtitle">Your enrolled programming classes and published practical progress.</p></div>{allowJoin?<JoinClassroomButton/>:null}</header>{viewModel.activeClasses.length?<div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Class</th><th>Published practicals</th><th>Latest practical</th><th>Latest completion</th><th></th></tr></thead><tbody>{viewModel.activeClasses.map((item)=><tr key={item.id}><td className="min-w-64"><Link href={`/classes/${item.id}`} className="font-semibold text-white hover:text-[var(--brand-accent)]">{item.name}</Link><p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{item.subject} · {item.section}</p></td><td>{item.activePracticalCount}</td><td className="min-w-44 text-xs text-[var(--text-secondary)]">{item.latestPractical?.title??"No published practical"}</td><td className="min-w-48"><ProgressBar value={item.latestPractical?.completionPercentage??0}/></td><td><Link href={`/classes/${item.id}`} className="icon-button"><ArrowRight size={13}/></Link></td></tr>)}</tbody></table></div></div>:<EmptyState title="No active classes" description="Join a classroom with a valid code to begin."/>}<section className="grid gap-3 sm:grid-cols-3"><MetricCard label="Classes" value={viewModel.activeClasses.length}/><MetricCard label="Published practicals" value={totalPracticals}/><MetricCard label="Latest completion average" value={`${overall}%`}/></section></div>;
}

export function MyClassesBridge({ viewModel, teacherContent, resolvedRole, allowJoin = true }: { viewModel: MyClassesViewModel; teacherContent: React.ReactNode; resolvedRole?: "TEACHER" | "STUDENT"; allowJoin?: boolean }) {
  const demoRole = useDemoRole();
  const student = resolvedRole ? resolvedRole === "STUDENT" : demoRole === "student";
  return student ? <StudentMyClasses viewModel={viewModel} allowJoin={allowJoin} /> : teacherContent;
}
