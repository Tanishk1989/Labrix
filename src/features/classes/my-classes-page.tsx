import Link from "next/link";
import { Braces, CalendarClock, ChevronRight, UsersRound } from "lucide-react";
import {
  EmptyState,
  MetricCard,
  ProgressBar,
  StatusBadge,
} from "@/components/design-system";
import {
  ArchivedClasses,
  JoinCode,
} from "@/components/interactive-design-system";
import type {
  ClassroomCardViewModel,
  MyClassesViewModel,
} from "./my-classes-view-model";
import { CreateClassroomButton } from "./classroom-setup-actions";

function formatDeadline(deadline: string | null) {
  if (!deadline) return "No upcoming deadline";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(deadline));
}

function ClassroomCard({ classroom }: { classroom: ClassroomCardViewModel }) {
  const practical = classroom.latestPractical;
  return (
    <article className="classroom-card cursor-default">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
            <Braces size={21} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">
              {classroom.subject}
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold text-slate-950">
              {classroom.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {classroom.section}
            </p>
          </div>
        </div>
        <StatusBadge tone="success">Active</StatusBadge>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <UsersRound size={14} aria-hidden="true" />
            Students
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {classroom.studentCount}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <CalendarClock size={14} aria-hidden="true" />
            Nearest deadline
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {formatDeadline(classroom.nearestDeadline)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)]">
            Active practicals
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {classroom.activePracticalCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)]">Join code</dt>
          <dd className="mt-1">
            <JoinCode code={classroom.joinCode} />
          </dd>
        </div>
      </dl>
      {practical && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-slate-800">
              {practical.title}
            </p>
            <span className="shrink-0 text-xs text-[var(--text-secondary)]">
              {practical.completionPercentage}% complete
            </span>
          </div>
          <ProgressBar
            value={practical.completionPercentage}
            label={`Completion for ${practical.title}`}
          />
          <div className="mt-3 flex items-center gap-2 text-xs">
            <StatusBadge tone="success">
              {practical.submittedCount} submitted
            </StatusBadge>
            <StatusBadge tone="warning">
              {practical.pendingCount} pending
            </StatusBadge>
          </div>
        </div>
      )}
      <Link
        href={`/classes/${classroom.id}`}
        className="mt-5 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Open class <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

export function MyClassesPage({
  viewModel,
}: {
  viewModel: MyClassesViewModel;
}) {
  const hasActiveClasses = viewModel.activeClasses.length > 0;
  return (
    <>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title font-semibold tracking-tight text-slate-950">
            My Classes
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Manage your programming classrooms and practical sessions.
          </p>
        </div>
        <CreateClassroomButton />
      </section>
      <section
        className="mt-7 grid gap-3 sm:grid-cols-3"
        aria-label="Classroom summary"
      >
        <MetricCard
          label="Active classes"
          value={viewModel.summary.activeClassCount}
          detail="This semester"
        />
        <MetricCard
          label="Total students"
          value={viewModel.summary.totalStudentCount}
          detail="Across active classes"
          tone="emerald"
        />
        <MetricCard
          label="Practicals due soon"
          value={viewModel.summary.practicalsDueSoon}
          detail="Within the next 7 days"
          tone="amber"
        />
      </section>
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Active classes
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Classes with ongoing or upcoming practicals.
          </p>
        </div>
        {hasActiveClasses ? (
          <div className="grid max-w-[660px] gap-5 md:grid-cols-2">
            {viewModel.activeClasses.map((classroom) => (
              <ClassroomCard classroom={classroom} key={classroom.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active classes"
            description="Create a class to start sharing programming practicals with students."
            actionLabel="Create class"
          />
        )}
      </section>
      <ArchivedClasses archivedCount={viewModel.archivedClasses.length} />
    </>
  );
}
