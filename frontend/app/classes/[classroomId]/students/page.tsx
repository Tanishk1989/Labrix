import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { EmptyState, MetricCard, PageHeader, StatusBadge } from "@/components/design-system";
import {
  ClassroomHintPolicyControls,
  DeactivateMembershipButton,
  JoinCodeControls,
  ReactivateMembershipButton,
  StudentHintToggle,
} from "@/features/classes/roster-controls";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { AccessDeniedError } from "@/server/authorization/classroom-access";
import { getClassroomHintOverview } from "@/server/hints/permissions";
import { getTeacherClassroomManagement } from "@/server/teacher/classroom-management";

type ClassroomManagement = Awaited<ReturnType<typeof getTeacherClassroomManagement>>;
type RosterStudent = ClassroomManagement["roster"]["students"][number];
type AuditEntry = ClassroomManagement["roster"]["auditEntries"][number];
type RosterView = "active" | "inactive" | "access";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadClassroomManagement(teacherId: string, classroomId: string) {
  try {
    return await getTeacherClassroomManagement(teacherId, classroomId);
  } catch (error) {
    if (error instanceof AccessDeniedError) notFound();
    throw error;
  }
}

function ClassroomStudentsSkeleton({ classroomId }: { classroomId: string }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <PageHeader
        breadcrumbs={[
          { label: "Classes", href: "/classes" },
          { label: "Classroom", href: `/classes/${classroomId}` },
          { label: "Students and access" },
        ]}
        eyebrow="Classroom roster"
        title="Loading students…"
        description="Loading classroom membership and access information."
      />
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Loading classroom summary">
        {[0, 1, 2].map((item) => <div key={item} className="panel h-24 animate-pulse bg-[var(--surface-elevated)]" />)}
      </section>
      <section className="panel space-y-4 p-4" aria-label="Loading student roster">
        <div className="h-4 w-44 animate-pulse rounded bg-[var(--surface-elevated)]" />
        {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded bg-[var(--surface-elevated)]" />)}
      </section>
      <p className="text-sm text-[var(--text-muted)]">Loading students and access…</p>
    </div>
  );
}

function StudentSummary({ student }: { student: RosterStudent }) {
  return (
    <dl className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <dt className="text-[var(--text-muted)]">Joined</dt>
        <dd className="mt-1 font-semibold text-[var(--text-primary)]">{dateLabel(student.joinedAt)}</dd>
      </div>
      <div>
        <dt className="text-[var(--text-muted)]">Attempts</dt>
        <dd className="mt-1 font-semibold text-[var(--text-primary)]">{student.submissionCount}</dd>
      </div>
      <div>
        <dt className="text-[var(--text-muted)]">Published feedback</dt>
        <dd className="mt-1 font-semibold text-[var(--text-primary)]">{student.publishedReviewCount}</dd>
      </div>
      <div>
        <dt className="text-[var(--text-muted)]">Private drafts</dt>
        <dd className="mt-1 font-semibold text-[var(--text-primary)]">{student.draftReviewCount}</dd>
      </div>
    </dl>
  );
}

function LatestSubmission({ student }: { student: RosterStudent }) {
  return student.latestSubmission ? (
    <Link href={`/submissions/${student.latestSubmission.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]">
      {student.latestSubmission.taskTitle} · attempt {student.latestSubmission.attemptNumber}
      <ArrowRight size={13} aria-hidden="true" />
    </Link>
  ) : <span className="text-sm text-[var(--text-muted)]">No submission yet</span>;
}

function StudentCard({
  student,
  status,
  action,
}: {
  student: RosterStudent;
  status: "active" | "inactive";
  action: ReactNode;
}) {
  return (
    <li className="space-y-5 px-4 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)]">{student.name}</h3>
          <p className="mt-1 break-all text-sm text-[var(--text-muted)]">{student.email}</p>
        </div>
        <StatusBadge tone={status === "active" ? "success" : "neutral"}>{status === "active" ? "Active" : "Inactive"}</StatusBadge>
      </div>
      <StudentSummary student={student} />
      <div className="border-t border-[var(--border)] pt-3">
        <p className="text-sm font-semibold text-[var(--text-secondary)]">Latest submission</p>
        <LatestSubmission student={student} />
      </div>
      {action}
    </li>
  );
}

function StudentTable({
  classroomId,
  students,
  status,
  hintOverview,
}: {
  classroomId: string;
  students: RosterStudent[];
  status: "active" | "inactive";
  hintOverview?: Awaited<ReturnType<typeof getClassroomHintOverview>>;
}) {
  const classDefault = hintOverview?.classDefault ?? false;

  return (
    <>
      <ul aria-label={`${status === "active" ? "Active" : "Inactive"} students`} className="divide-y divide-[var(--border)] md:hidden">
        {students.map((student) => {
          const override = hintOverview?.permissionsMap.get(student.studentId) ?? null;
          const effective = override !== null ? override : classDefault;
          const hintsCount = hintOverview?.usageMap.get(student.studentId) ?? 0;

          return (
            <StudentCard
              key={student.membershipId}
              student={student}
              status={status}
              action={
                <div className="space-y-3">
                  {status === "active" ? (
                    <div className="border-t border-[var(--border)] pt-2 flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">AI Hints</span>
                      <StudentHintToggle
                        classroomId={classroomId}
                        studentId={student.studentId}
                        studentName={student.name}
                        effectiveAllowed={effective}
                        overrideState={override}
                        hintsUsedCount={hintsCount}
                      />
                    </div>
                  ) : null}
                  {status === "active"
                    ? <DeactivateMembershipButton classroomId={classroomId} membershipId={student.membershipId} studentName={student.name} />
                    : <ReactivateMembershipButton classroomId={classroomId} membershipId={student.membershipId} studentName={student.name} />}
                </div>
              }
            />
          );
        })}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="dense-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>Joined</th>
              <th>AI Hints</th>
              <th>Attempts</th>
              <th>Feedback</th>
              <th>Latest submission</th>
              <th><span className="sr-only">Access control</span></th>
            </tr>
          </thead>
          <tbody>{students.map((student) => {
            const override = hintOverview?.permissionsMap.get(student.studentId) ?? null;
            const effective = override !== null ? override : classDefault;
            const hintsCount = hintOverview?.usageMap.get(student.studentId) ?? 0;

            return (
              <tr key={student.membershipId}>
                <td className="min-w-52"><p className="font-semibold text-white">{student.name}</p><p className="text-xs text-[var(--text-muted)]">{student.email}</p></td>
                <td><StatusBadge tone={status === "active" ? "success" : "neutral"}>{status === "active" ? "Active" : "Inactive"}</StatusBadge></td>
                <td className="min-w-36 text-sm text-[var(--text-secondary)]">{dateLabel(student.joinedAt)}</td>
                <td className="min-w-44">
                  {status === "active" ? (
                    <StudentHintToggle
                      classroomId={classroomId}
                      studentId={student.studentId}
                      studentName={student.name}
                      effectiveAllowed={effective}
                      overrideState={override}
                      hintsUsedCount={hintsCount}
                    />
                  ) : (
                    <span className="text-xs text-white/30">—</span>
                  )}
                </td>
                <td><span className="font-semibold text-white">{student.submissionCount}</span></td>
                <td className="min-w-40"><p className="text-sm text-[var(--text-secondary)]">{student.publishedReviewCount} published</p><p className="text-xs text-[var(--text-muted)]">{student.draftReviewCount} private drafts</p></td>
                <td className="min-w-52"><LatestSubmission student={student} /></td>
                <td>{status === "active"
                  ? <DeactivateMembershipButton classroomId={classroomId} membershipId={student.membershipId} studentName={student.name} />
                  : <ReactivateMembershipButton classroomId={classroomId} membershipId={student.membershipId} studentName={student.name} />}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </>
  );
}

function AccessHistory({ entries }: { entries: AuditEntry[] }) {
  return (
    <>
      <ol aria-label="Membership access history" className="divide-y divide-[var(--border)] md:hidden">
        {entries.map((entry) => (
          <li key={entry.id} className="space-y-3 px-4 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-semibold text-[var(--text-primary)]">{entry.student.name}</h3><p className="mt-1 break-all text-sm text-[var(--text-muted)]">{entry.student.email}</p></div>
              <StatusBadge tone={entry.action === "REACTIVATED" ? "success" : "warning"}>{entry.action === "REACTIVATED" ? "Reactivated" : "Deactivated"}</StatusBadge>
            </div>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">Changed by {entry.actorTeacher.name} on <time dateTime={entry.createdAt}>{dateTimeLabel(entry.createdAt)}</time>.</p>
          </li>
        ))}
      </ol>
      <div className="hidden overflow-x-auto md:block">
        <table className="dense-table">
          <thead><tr><th>Action</th><th>Student</th><th>Changed by</th><th>Recorded</th></tr></thead>
          <tbody>{entries.map((entry) => (
            <tr key={entry.id}>
              <td><StatusBadge tone={entry.action === "REACTIVATED" ? "success" : "warning"}>{entry.action === "REACTIVATED" ? "Reactivated" : "Deactivated"}</StatusBadge></td>
              <td className="min-w-52"><p className="font-semibold text-white">{entry.student.name}</p><p className="text-xs text-[var(--text-muted)]">{entry.student.email}</p></td>
              <td className="min-w-40 text-sm text-[var(--text-secondary)]">{entry.actorTeacher.name}</td>
              <td className="min-w-44 text-sm text-[var(--text-secondary)]"><time dateTime={entry.createdAt}>{dateTimeLabel(entry.createdAt)}</time></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}

async function ClassroomStudentsContent({
  teacherId,
  classroomId,
  view,
}: {
  teacherId: string;
  classroomId: string;
  view: RosterView;
}) {
  const [{ roster }, hintOverview] = await Promise.all([
    loadClassroomManagement(teacherId, classroomId),
    getClassroomHintOverview(teacherId, classroomId),
  ]);
  const students = [...roster.students, ...roster.inactiveStudents];
  const submissionCount = students.reduce((total, student) => total + student.submissionCount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Classes", href: "/classes" },
          { label: roster.name, href: `/classes/${classroomId}` },
          { label: "Students and access" },
        ]}
        eyebrow="Classroom roster"
        title={`${roster.name} students`}
        description="Manage who can enter this classroom. Learning progress is kept on the separate class progress page."
        actions={<div className="flex flex-wrap gap-2"><Link href={`/classes/${classroomId}/pulse`} className="button min-h-11">Open live pulse</Link><Link href={`/progress?classroom=${encodeURIComponent(classroomId)}`} className="button-secondary min-h-11">View class progress</Link></div>}
      />

      <nav aria-label="Student and access views" className="flex overflow-x-auto border-b border-[var(--border)]">
        {([
          ["active", "Active students", roster.students.length],
          ["inactive", "Inactive students", roster.inactiveStudents.length],
          ["access", "Access history", roster.auditEntries.length],
        ] as const).map(([value, label, count]) => (
          <Link key={value} href={`/classes/${classroomId}/students?view=${value}`} aria-current={view === value ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${view === value ? "border-[var(--brand)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
            {label}<span className="text-[var(--text-muted)]">{count}</span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.8fr)]">
        <section aria-label="Classroom membership summary" className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Active students" value={roster.students.length} />
          <MetricCard label="Inactive students" value={roster.inactiveStudents.length} />
          <MetricCard label="Submission attempts" value={submissionCount} detail="Historical attempts remain preserved" />
        </section>
        <JoinCodeControls classroomId={classroomId} code={roster.joinCode} />
      </div>

      <ClassroomHintPolicyControls classroomId={classroomId} enabledForAll={hintOverview.classDefault} />

      {view === "active" ? (
        <section className="panel overflow-hidden" aria-labelledby="active-student-roster-heading">
          <div className="panel-header"><div><h2 id="active-student-roster-heading" className="section-heading">Active student roster</h2><p className="section-description">These students can open classroom practicals. Deactivation preserves all historical work.</p></div><span className="count-chip">{roster.students.length}</span></div>
          {roster.students.length
            ? <StudentTable classroomId={classroomId} students={roster.students} status="active" hintOverview={hintOverview} />
            : <div className="p-4"><EmptyState title="No active students" description="Share the join code above with students who should enter this classroom." /></div>}
        </section>
      ) : null}

      {view === "inactive" ? (
        <section className="panel overflow-hidden" aria-labelledby="inactive-student-roster-heading">
          <div className="panel-header"><div><h2 id="inactive-student-roster-heading" className="section-heading">Inactive student roster</h2><p className="section-description">Restore access without creating a new membership or losing historical work.</p></div><span className="count-chip">{roster.inactiveStudents.length}</span></div>
          {roster.inactiveStudents.length
            ? <StudentTable classroomId={classroomId} students={roster.inactiveStudents} status="inactive" hintOverview={hintOverview} />
            : <div className="p-4"><EmptyState title="No inactive students" description="Students whose access is deactivated will remain visible here." actionLabel="View active students" actionHref={`/classes/${classroomId}/students?view=active`} /></div>}
        </section>
      ) : null}

      {view === "access" ? (
        <section className="panel overflow-hidden" aria-labelledby="membership-activity-heading">
          <div className="panel-header"><div><h2 id="membership-activity-heading" className="section-heading">Recent membership activity</h2><p className="section-description">Owner-authorized access changes. Students cannot view this history.</p></div><span className="count-chip">{roster.auditEntries.length}</span></div>
          {roster.auditEntries.length
            ? <AccessHistory entries={roster.auditEntries} />
            : <div className="p-4"><EmptyState title="No membership activity" description="Deactivation and reactivation changes will appear here." actionLabel="View active students" actionHref={`/classes/${classroomId}/students?view=active`} /></div>}
        </section>
      ) : null}
    </div>
  );
}

export default async function ClassroomStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ classroomId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { classroomId } = await params;
  const requestedView = (await searchParams).view;
  const view: RosterView = requestedView === "inactive" || requestedView === "access"
    ? requestedView
    : "active";
  const actor = await resolveCurrentActorForPage({
    demoActor: "teacher",
    requiredRole: "TEACHER",
  });
  return (
    <DemoShell actor={actor}>
      <Suspense fallback={<ClassroomStudentsSkeleton classroomId={classroomId} />}>
        <ClassroomStudentsContent teacherId={actor.id} classroomId={classroomId} view={view} />
      </Suspense>
    </DemoShell>
  );
}
