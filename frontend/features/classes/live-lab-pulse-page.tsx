import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Code2,
  FlaskConical,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { MetricCard, PageHeader, StatusBadge, type BadgeTone } from "@/components/design-system";
import { liveLabPulseStatusOrder, type LiveLabPulseStatus } from "@/domain/classrooms/live-lab-pulse";
import type { TeacherLiveLabPulse } from "@/server/teacher/live-lab-pulse";
import { LiveLabRefresh } from "./live-lab-refresh";

type PulseStudent = TeacherLiveLabPulse["students"][number];

const statusMeta: Record<LiveLabPulseStatus, {
  label: string;
  description: string;
  tone: BadgeTone;
  icon: LucideIcon;
}> = {
  RUNNING_TESTS: { label: "Running tests", description: "Execution is queued or running", tone: "info", icon: FlaskConical },
  CODING_NOW: { label: "Coding now", description: "Saved activity in the last 5 minutes", tone: "active", icon: Code2 },
  RECENTLY_SUBMITTED: { label: "Recently submitted", description: "Submitted in the last 10 minutes", tone: "success", icon: CheckCircle2 },
  NEEDS_ATTENTION: { label: "Needs attention", description: "Repeated test failures in an active session", tone: "warning", icon: AlertTriangle },
  INACTIVE: { label: "Inactive", description: "No recent practical activity", tone: "neutral", icon: Clock3 },
};

function timeLabel(value: string | null) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function languageLabel(value: PulseStudent["language"]) {
  if (!value) return null;
  return value === "CPP" ? "C++" : "Java";
}

function StudentPulseCard({
  classroomId,
  student,
  selected,
}: {
  classroomId: string;
  student: PulseStudent;
  selected: boolean;
}) {
  const meta = statusMeta[student.status];
  const Icon = meta.icon;
  return (
    <li>
      <Link
        href={`/classes/${classroomId}/pulse?student=${encodeURIComponent(student.id)}`}
        aria-current={selected ? "true" : undefined}
        className={`block min-h-11 rounded-[var(--radius-md)] border p-4 transition-colors ${selected ? "border-[var(--brand)] bg-[var(--brand-subtle)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]"}`}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
            <Icon size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{student.name}</h3>
                <p className="truncate text-xs text-[var(--text-muted)]">{student.currentPractical?.title ?? "No practical opened"}</p>
              </div>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
              <span>{timeLabel(student.lastActivityAt)}</span>
              {student.attemptNumber ? <span>Attempt {student.attemptNumber}</span> : null}
              {languageLabel(student.language) ? <span>{languageLabel(student.language)}</span> : null}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function StudentDetail({ classroomId, student }: { classroomId: string; student: PulseStudent }) {
  const meta = statusMeta[student.status];
  return (
    <aside className="panel self-start overflow-hidden xl:sticky xl:top-20" aria-labelledby="pulse-student-detail-heading">
      <div className="border-b border-[var(--border)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Student signal</p>
            <h2 id="pulse-student-detail-heading" className="mt-2 truncate text-xl font-semibold text-[var(--text-primary)]">{student.name}</h2>
            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{student.email}</p>
          </div>
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        </div>
        <p className="mt-4 border-l-2 border-[var(--brand)] pl-3 text-sm leading-6 text-[var(--text-secondary)]">{student.statusReason}</p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-[var(--border)]" aria-label={`${student.name} activity summary`}>
        <div className="bg-[var(--surface)] p-4"><p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Current work</p><p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{student.currentPractical?.title ?? "None"}</p></div>
        <div className="bg-[var(--surface)] p-4"><p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Last activity</p><p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{timeLabel(student.lastActivityAt)}</p></div>
        <div className="bg-[var(--surface)] p-4"><p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Failed runs</p><p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{student.consecutiveFailedRuns}</p></div>
        <div className="bg-[var(--surface)] p-4"><p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Hints used</p><p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{student.hintCount}</p></div>
      </div>

      <div className="space-y-5 p-5">
        <section aria-labelledby="pulse-access-heading">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 id="pulse-access-heading" className="text-sm font-semibold text-[var(--text-primary)]">Hint access</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{student.hintAccessEnabled ? "Progressive hints are enabled." : "Progressive hints are currently disabled."}</p>
            </div>
            <StatusBadge tone={student.hintAccessEnabled ? "success" : "neutral"}>{student.hintAccessEnabled ? "Enabled" : "Off"}</StatusBadge>
          </div>
          <Link href={`/classes/${classroomId}/students?view=active`} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]">
            Manage hint access <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </section>

        {student.latestSubmission ? (
          <section className="border-t border-[var(--border)] pt-5" aria-labelledby="pulse-submission-heading">
            <h3 id="pulse-submission-heading" className="text-sm font-semibold text-[var(--text-primary)]">Latest submission</h3>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{student.latestSubmission.taskTitle} · attempt {student.latestSubmission.attemptNumber}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{student.latestSubmission.visiblePassedTests}/{student.latestSubmission.visibleTotalTests} visible tests passed</p>
            <Link href={`/submissions/${student.latestSubmission.id}`} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]">
              Review submission <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </section>
        ) : null}

        <section className="border-t border-[var(--border)] pt-5" aria-labelledby="pulse-activity-heading">
          <h3 id="pulse-activity-heading" className="text-sm font-semibold text-[var(--text-primary)]">Recent activity</h3>
          {student.activity.length ? (
            <ol className="mt-4 space-y-4">
              {student.activity.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full border border-[var(--border)] text-[var(--brand-accent)]"><CircleDot size={9} aria-hidden="true" /></span>
                  <div><p className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</p><time dateTime={item.occurredAt} className="mt-0.5 block text-[11px] text-[var(--text-muted)]">{timeLabel(item.occurredAt)}</time></div>
                </li>
              ))}
            </ol>
          ) : <p className="mt-3 text-xs text-[var(--text-muted)]">No practical activity has been recorded.</p>}
        </section>
      </div>
    </aside>
  );
}

export function LiveLabPulsePage({ pulse, selectedStudentId }: { pulse: TeacherLiveLabPulse; selectedStudentId?: string }) {
  const selectedStudent = pulse.students.find((student) => student.id === selectedStudentId)
    ?? pulse.students.find((student) => student.status === "NEEDS_ATTENTION")
    ?? pulse.students[0]
    ?? null;
  const activeCount = pulse.students.length - pulse.counts.INACTIVE;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: "Classes", href: "/classes" }, { label: pulse.classroom.name, href: `/classes/${pulse.classroom.id}` }, { label: "Live Lab Pulse" }]}
        eyebrow="Live classroom intelligence"
        title="Live Lab Pulse"
        description={`See recent learning activity for ${pulse.classroom.name} without watching student screens or exposing source code.`}
        actions={<LiveLabRefresh />}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Live lab summary" aria-live="polite">
        <MetricCard label="Active now" value={activeCount} detail={`${pulse.students.length} enrolled students`} tone="brand" />
        <MetricCard label="Running tests" value={pulse.counts.RUNNING_TESTS} tone="indigo" />
        <MetricCard label="Coding now" value={pulse.counts.CODING_NOW} tone="success" />
        <MetricCard label="Recent submissions" value={pulse.counts.RECENTLY_SUBMITTED} tone="emerald" />
        <MetricCard label="Needs attention" value={pulse.counts.NEEDS_ATTENTION} tone="warning" />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--border)] py-3 text-xs text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-2"><Activity size={14} aria-hidden="true" className="text-[var(--brand-accent)]" /> Evidence comes from saves, runs, submissions, and hint activity.</span>
        <time dateTime={pulse.capturedAt}>Snapshot {timeLabel(pulse.capturedAt)}</time>
      </div>

      {pulse.students.length ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
          <div className="space-y-6">
            {liveLabPulseStatusOrder.map((status) => {
              const students = pulse.students.filter((student) => student.status === status);
              const meta = statusMeta[status];
              const Icon = meta.icon;
              return (
                <section key={status} className="panel overflow-hidden" aria-labelledby={`pulse-${status.toLowerCase()}-heading`}>
                  <div className="panel-header">
                    <div className="flex items-start gap-3"><span className="mt-0.5 text-[var(--brand-accent)]"><Icon size={16} aria-hidden="true" /></span><div><h2 id={`pulse-${status.toLowerCase()}-heading`} className="section-heading">{meta.label}</h2><p className="section-description">{meta.description}</p></div></div>
                    <span className="count-chip">{students.length}</span>
                  </div>
                  {students.length ? (
                    <ul className="grid gap-3 p-3 sm:grid-cols-2">
                      {students.map((student) => <StudentPulseCard key={student.id} classroomId={pulse.classroom.id} student={student} selected={student.id === selectedStudent?.id} />)}
                    </ul>
                  ) : <p className="px-4 py-5 text-sm text-[var(--text-muted)]">No students in this state.</p>}
                </section>
              );
            })}
          </div>
          {selectedStudent ? <StudentDetail classroomId={pulse.classroom.id} student={selectedStudent} /> : null}
        </div>
      ) : (
        <section className="panel p-8 text-center"><Lightbulb size={22} className="mx-auto text-[var(--brand-accent)]" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">No active students</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Students will appear here after joining this classroom.</p></section>
      )}
    </div>
  );
}

