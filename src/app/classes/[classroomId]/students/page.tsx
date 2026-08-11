import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { EmptyState, MetricCard, StatusBadge } from "@/components/design-system";
import {
  DeactivateMembershipButton,
  JoinCodeControls,
  ReactivateMembershipButton,
} from "@/features/classes/roster-controls";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getTeacherClassroomProgress } from "@/server/attempts/service";
import { getTeacherClassroomRoster } from "@/server/classrooms/roster";

async function loadClassroomManagement(
  teacherId: string,
  classroomId: string,
) {
  try {
    const [progress, roster] = await Promise.all([
      getTeacherClassroomProgress(teacherId, classroomId),
      getTeacherClassroomRoster(teacherId, classroomId),
    ]);
    return { progress, roster };
  } catch {
    notFound();
  }
}

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const actor = await resolveCurrentActorForPage({
    demoActor: "teacher",
    requiredRole: "TEACHER",
  });
  const { progress, roster } = await loadClassroomManagement(
    actor.id,
    classroomId,
  );
  const submitted = progress.students.filter(
    (student) => student.latestSubmission,
  ).length;
  const passedAll = progress.students.filter(
    (student) =>
      student.latestSubmission &&
      student.latestSubmission.resultSnapshot.passedTests ===
        student.latestSubmission.resultSnapshot.totalTests,
  ).length;

  return <DemoShell actor={actor}><div className="space-y-5">
    <header>
      <Link href={`/classes/${classroomId}`} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-white"><ArrowLeft size={13} /> Classroom overview</Link>
      <p className="eyebrow">Teacher workspace · Roster and progress</p>
      <h1 className="page-heading">{progress.classroom.name}</h1>
      <p className="page-subtitle">Manage active and inactive classroom access without deleting students or their historical work.</p>
    </header>

    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Active students" value={roster.students.length} />
        <MetricCard label="Latest practical submitted" value={`${submitted}/${progress.students.length}`} detail="Distinct active students" />
        <MetricCard label="Passed all provided tests" value={passedAll} />
      </section>
      <JoinCodeControls classroomId={classroomId} code={roster.joinCode} />
    </div>

    <section className="panel overflow-hidden">
      <div className="panel-header"><div><h2 className="section-heading">Active student roster</h2><p className="section-description">Deactivation removes future classroom access but preserves every historical record.</p></div><span className="count-chip">{roster.students.length}</span></div>
      {roster.students.length ? <div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Student</th><th>Membership</th><th>Joined</th><th>Submissions</th><th>Review summary</th><th>Latest submission</th><th><span className="sr-only">Access control</span></th></tr></thead><tbody>{roster.students.map((student) => <tr key={student.membershipId}>
        <td className="min-w-52"><p className="font-semibold text-white">{student.name}</p><p className="text-[11px] text-[var(--text-muted)]">{student.email}</p></td>
        <td><StatusBadge tone="success">Active</StatusBadge></td>
        <td className="min-w-40 text-xs text-[var(--text-secondary)]">{new Date(student.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
        <td><span className="font-semibold text-white">{student.submissionCount}</span><p className="text-[10px] text-[var(--text-muted)]">Immutable attempts</p></td>
        <td className="min-w-40"><p className="text-xs text-[var(--text-secondary)]">{student.publishedReviewCount} published</p><p className="text-[10px] text-[var(--text-muted)]">{student.draftReviewCount} private drafts</p></td>
        <td className="min-w-52">{student.latestSubmission ? <Link href={`/submissions/${student.latestSubmission.id}`} className="text-link"><span>{student.latestSubmission.taskTitle} · #{student.latestSubmission.attemptNumber}</span><ArrowRight size={12} /></Link> : <span className="text-xs text-[var(--text-muted)]">No submission yet</span>}</td>
        <td><DeactivateMembershipButton classroomId={classroomId} membershipId={student.membershipId} studentName={student.name} /></td>
      </tr>)}</tbody></table></div> : <div className="p-4"><EmptyState title="No active students" description="Students appear here after joining with the current classroom code." /></div>}
    </section>

    <section className="panel overflow-hidden">
      <div className="panel-header"><div><h2 className="section-heading">Inactive student roster</h2><p className="section-description">Only the classroom owner can restore access. Reactivation reuses the existing membership and preserves all historical work.</p></div><span className="count-chip">{roster.inactiveStudents.length}</span></div>
      {roster.inactiveStudents.length ? <div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Student</th><th>Membership</th><th>Originally joined</th><th>Submissions</th><th>Review summary</th><th>Latest submission</th><th><span className="sr-only">Access control</span></th></tr></thead><tbody>{roster.inactiveStudents.map((student) => <tr key={student.membershipId}>
        <td className="min-w-52"><p className="font-semibold text-white">{student.name}</p><p className="text-[11px] text-[var(--text-muted)]">{student.email}</p></td>
        <td><StatusBadge tone="neutral">Inactive</StatusBadge></td>
        <td className="min-w-40 text-xs text-[var(--text-secondary)]">{new Date(student.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
        <td><span className="font-semibold text-white">{student.submissionCount}</span><p className="text-[10px] text-[var(--text-muted)]">Preserved attempts</p></td>
        <td className="min-w-40"><p className="text-xs text-[var(--text-secondary)]">{student.publishedReviewCount} published</p><p className="text-[10px] text-[var(--text-muted)]">{student.draftReviewCount} private drafts</p></td>
        <td className="min-w-52">{student.latestSubmission ? <Link href={`/submissions/${student.latestSubmission.id}`} className="text-link"><span>{student.latestSubmission.taskTitle} · #{student.latestSubmission.attemptNumber}</span><ArrowRight size={12} /></Link> : <span className="text-xs text-[var(--text-muted)]">No submission yet</span>}</td>
        <td><ReactivateMembershipButton classroomId={classroomId} membershipId={student.membershipId} studentName={student.name} /></td>
      </tr>)}</tbody></table></div> : <div className="p-4"><EmptyState title="No inactive students" description="Students whose access is deactivated will remain visible here with their historical summaries." /></div>}
    </section>

    <section className="panel overflow-hidden">
      <div className="panel-header"><div><h2 className="section-heading">Recent membership activity</h2><p className="section-description">Owner-authorized access changes recorded by Labrix. Students cannot view this audit trail.</p></div><span className="count-chip">{roster.auditEntries.length}</span></div>
      {roster.auditEntries.length ? <div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Action</th><th>Student</th><th>Changed by</th><th>Recorded</th></tr></thead><tbody>{roster.auditEntries.map((entry) => <tr key={entry.id}>
        <td><StatusBadge tone={entry.action === "REACTIVATED" ? "success" : "warning"}>{entry.action === "REACTIVATED" ? "Reactivated" : "Deactivated"}</StatusBadge></td>
        <td className="min-w-52"><p className="font-semibold text-white">{entry.student.name}</p><p className="text-[11px] text-[var(--text-muted)]">{entry.student.email}</p></td>
        <td className="min-w-40 text-xs text-[var(--text-secondary)]">{entry.actorTeacher.name}</td>
        <td className="min-w-44 text-xs text-[var(--text-secondary)]">{new Date(entry.createdAt).toLocaleString("en-IN")}</td>
      </tr>)}</tbody></table></div> : <div className="p-4"><EmptyState title="No membership activity" description="Deactivation and reactivation changes will appear here." /></div>}
    </section>

    <section className="panel overflow-hidden">
      <div className="panel-header"><div><h2 className="section-heading">Latest practical progress</h2><p className="section-description">{progress.task?.title ?? "No published practical"} · Latest immutable attempt per active student.</p></div><span className="count-chip">{progress.students.length}</span></div>
      {progress.students.length ? <div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Student</th><th>Submission status</th><th>Stored simulated result</th><th>Attempt</th><th>Submitted</th><th><span className="sr-only">Review</span></th></tr></thead><tbody>{progress.students.map((student) => {
        const latest = student.latestSubmission;
        const allPassed = latest && latest.resultSnapshot.passedTests === latest.resultSnapshot.totalTests;
        return <tr key={student.id}>
          <td className="min-w-52"><p className="font-semibold text-white">{student.name}</p><p className="text-[11px] text-[var(--text-muted)]">{student.email}</p></td>
          <td><StatusBadge tone={latest ? "published" : "neutral"}>{latest ? "Submitted" : "Not submitted"}</StatusBadge></td>
          <td>{latest ? <StatusBadge tone={allPassed ? "passed" : "warning"}>{latest.resultSnapshot.passedTests}/{latest.resultSnapshot.totalTests} tests</StatusBadge> : "—"}</td>
          <td>{latest ? `#${latest.attemptNumber}` : "—"}</td>
          <td className="min-w-44 text-xs text-[var(--text-secondary)]">{latest ? new Date(latest.submittedAt).toLocaleString("en-IN") : "—"}</td>
          <td>{latest ? <Link className="button-secondary min-h-8 px-2.5 py-1" href={`/submissions/${latest.id}`}>Review <ArrowRight size={12} /></Link> : null}</td>
        </tr>;
      })}</tbody></table></div> : <div className="p-4"><EmptyState title="No active students" description="Students will appear after joining this classroom." /></div>}
    </section>
  </div></DemoShell>;
}
