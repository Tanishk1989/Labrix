import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { EmptyState, MetricCard, StatusBadge } from "@/components/design-system";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getTeacherClassroomProgress } from "@/server/attempts/service";

async function loadProgress(teacherId: string, classroomId: string) { try { return await getTeacherClassroomProgress(teacherId, classroomId); } catch { notFound(); } }

export default async function StudentProgressPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher", requiredRole: "TEACHER" });
  const progress = await loadProgress(actor.id, classroomId);
  const submitted = progress.students.filter((student) => student.latestSubmission).length;
  const passedAll = progress.students.filter((student) => student.latestSubmission && student.latestSubmission.resultSnapshot.passedTests === student.latestSubmission.resultSnapshot.totalTests).length;
  return <DemoShell actor={actor}><div className="space-y-5">
    <header><Link href={`/classes/${classroomId}`} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-white"><ArrowLeft size={13} /> Classroom overview</Link><p className="eyebrow">Teacher workspace · Practical progress</p><h1 className="page-heading">{progress.classroom.name}</h1><p className="page-subtitle">{progress.task?.title ?? "No published practical"} · Latest immutable attempt per active student.</p></header>
    <section className="grid gap-3 sm:grid-cols-3"><MetricCard label="Active students" value={progress.students.length} /><MetricCard label="Submitted" value={`${submitted}/${progress.students.length}`} detail="Distinct students" /><MetricCard label="Passed all provided tests" value={passedAll} /></section>
    {progress.students.length ? <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Student</th><th>Submission status</th><th>Stored simulated result</th><th>Attempt</th><th>Submitted</th><th><span className="sr-only">Review</span></th></tr></thead><tbody>{progress.students.map((student) => { const latest = student.latestSubmission; const allPassed = latest && latest.resultSnapshot.passedTests === latest.resultSnapshot.totalTests; return <tr key={student.id}><td className="min-w-52"><p className="font-semibold text-white">{student.name}</p><p className="text-[11px] text-[var(--text-muted)]">{student.email}</p></td><td><StatusBadge tone={latest ? "published" : "neutral"}>{latest ? "Submitted" : "Not submitted"}</StatusBadge></td><td>{latest ? <StatusBadge tone={allPassed ? "passed" : "warning"}>{latest.resultSnapshot.passedTests}/{latest.resultSnapshot.totalTests} tests</StatusBadge> : "—"}</td><td>{latest ? `#${latest.attemptNumber}` : "—"}</td><td className="min-w-44 text-xs text-[var(--text-secondary)]">{latest ? new Date(latest.submittedAt).toLocaleString("en-IN") : "—"}</td><td>{latest ? <Link className="button-secondary min-h-8 px-2.5 py-1" href={`/submissions/${latest.id}`}>Review <ArrowRight size={12} /></Link> : null}</td></tr>; })}</tbody></table></div></div> : <EmptyState title="No active students" description="Students will appear after joining this classroom." />}
  </div></DemoShell>;
}
