import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { EmptyState, MetricCard, StatusBadge } from "@/components/design-system";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getTeacherOverview } from "@/server/teacher/overview";
import { getStudentOverview } from "@/server/student/overview";
import { StudentSubmissions } from "@/features/student/student-pages";

function resultMeta(state: string, passed: number, total: number) {
  if (state === "COMPILATION_ERROR") return { label: "Compilation error", tone: "compilation-error" as const };
  if (state === "RUNTIME_ERROR") return { label: "Runtime error", tone: "danger" as const };
  if (state === "TIME_LIMIT_EXCEEDED") return { label: "Time limit", tone: "warning" as const };
  if (state === "INTERNAL_ERROR") return { label: "Provider error", tone: "danger" as const };
  if (passed === total) return { label: "Passed all provided tests", tone: "passed" as const };
  return { label: "Tests incomplete", tone: "warning" as const };
}

export default async function SubmissionsQueuePage({ searchParams }: { searchParams: Promise<{ q?: string; classroom?: string; practical?: string; result?: string }> }) {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  if (actor.role === "STUDENT") {
    const overview = await getStudentOverview(actor.id);
    return <DemoShell actor={actor}><StudentSubmissions overview={overview} /></DemoShell>;
  }
  const overview = await getTeacherOverview(actor.id);
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const submissions = overview.submissions.filter((submission) => {
    const passed = submission.state === "COMPLETED" && submission.passedTests === submission.totalTests;
    const error = submission.state !== "COMPLETED";
    return (!query || `${submission.studentName} ${submission.taskTitle} ${submission.classroomName}`.toLowerCase().includes(query)) &&
      (!params.classroom || submission.classroomId === params.classroom) &&
      (!params.practical || submission.taskId === params.practical) &&
      (!params.result || params.result === "ALL" || (params.result === "PASSED" && passed) || (params.result === "ERROR" && error) || (params.result === "INCOMPLETE" && !passed && !error));
  });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const passedCount = overview.submissions.filter((item) => item.state === "COMPLETED" && item.passedTests === item.totalTests).length;
  const compileErrors = overview.submissions.filter((item) => item.state === "COMPILATION_ERROR").length;

  return <DemoShell actor={actor}><div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Teacher workspace</p><h1 className="page-heading">Submissions</h1><p className="page-subtitle">Inspect immutable student attempts and their stored simulated result snapshots.</p></div>{submissions[0] ? <Link href={`/submissions/${submissions[0].id}`} className="button">Review latest <ArrowRight size={14} /></Link> : null}</header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total attempts" value={overview.submissions.length} /><MetricCard label="Submitted today" value={overview.submissions.filter((item) => new Date(item.submittedAt) >= today).length} /><MetricCard label="Passed all provided tests" value={passedCount} /><MetricCard label="Compilation errors" value={compileErrors} /></section>
    <form action="/submissions" className="panel flex flex-wrap items-center gap-3 p-3">
      <label className="relative min-w-64 flex-1"><span className="sr-only">Search submissions</span><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input className="input pl-8" name="q" defaultValue={params.q} placeholder="Search student, practical or class" /></label>
      <select name="classroom" defaultValue={params.classroom ?? ""} className="input w-auto min-w-44"><option value="">All classes</option>{overview.classrooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
      <select name="result" defaultValue={params.result ?? "ALL"} className="input w-auto min-w-44"><option value="ALL">All results</option><option value="PASSED">Passed all tests</option><option value="INCOMPLETE">Tests incomplete</option><option value="ERROR">Execution errors</option></select>
      <button className="button-secondary">Apply filters</button>
    </form>
    {submissions.length ? <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Student</th><th>Class</th><th>Practical</th><th>Attempt</th><th>Tests</th><th>Submitted</th><th>Stored result</th><th><span className="sr-only">Review</span></th></tr></thead><tbody>{submissions.map((submission) => { const meta = resultMeta(submission.state, submission.passedTests, submission.totalTests); return <tr key={submission.id}><td className="font-semibold text-white">{submission.studentName}</td><td><p className="text-xs">{submission.classroomName}</p><p className="text-[11px] text-[var(--text-muted)]">{submission.classroomSubject}</p></td><td className="min-w-48 text-xs">{submission.taskTitle}</td><td>#{submission.attemptNumber}</td><td>{submission.passedTests}/{submission.totalTests}</td><td className="min-w-44 text-xs text-[var(--text-secondary)]">{new Date(submission.submittedAt).toLocaleString("en-IN")}</td><td><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></td><td><Link href={`/submissions/${submission.id}`} className="button-secondary min-h-8 px-2.5 py-1">Review <ArrowRight size={12} /></Link></td></tr>; })}</tbody></table></div></div> : <EmptyState title="No submissions found" description="No immutable attempts match the selected filters." />}
  </div></DemoShell>;
}
