import Link from "next/link";
import { ArrowRight, Plus, Search } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import {
  Button,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  StatusBadge,
} from "@/components/design-system";
import { RoleContentBridge } from "@/features/student/role-content-bridge";
import { StudentPracticalsPage } from "@/features/student/student-practicals-page";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { resolveDemoStudentActor } from "@/server/actors/demo-session";
import { getStudentOverview } from "@/server/student/overview";
import {
  getTeacherOverview,
  type TeacherOverview,
  type TeacherPracticalSummary,
} from "@/server/teacher/overview";

type PracticalStatusFilter = "ALL" | "PUBLISHED" | "DRAFT";
type PracticalSearchParams = {
  q?: string;
  status?: string;
  classroom?: string;
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function practicalEditHref(practical: TeacherPracticalSummary) {
  return `/classes/${practical.classroomId}/tasks/${practical.id}/edit`;
}

function practicalPreviewHref(practical: TeacherPracticalSummary) {
  return `${practicalEditHref(practical)}?preview=student`;
}

function PracticalFilters({
  overview,
  params,
  status,
}: {
  overview: TeacherOverview;
  params: PracticalSearchParams;
  status: PracticalStatusFilter;
}) {
  return (
    <form
      action="/practicals"
      className="grid gap-3 border-y border-[var(--border)] py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center"
    >
      <label className="relative min-w-0 sm:col-span-2 lg:col-span-1">
        <span className="sr-only">Search practicals</span>
        <Search
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <Input
          name="q"
          defaultValue={params.q}
          className="w-full pl-9"
          placeholder="Search practicals or classes"
          aria-label="Search practicals"
        />
      </label>
      <Select
        name="classroom"
        defaultValue={params.classroom ?? ""}
        className="w-full lg:w-48"
        aria-label="Filter by class"
      >
        <option value="">All classes</option>
        {overview.classrooms.map((classroom) => (
          <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
        ))}
      </Select>
      <Select
        name="status"
        defaultValue={status}
        className="w-full lg:w-40"
        aria-label="Filter by status"
      >
        <option value="ALL">All statuses</option>
        <option value="PUBLISHED">Published</option>
        <option value="DRAFT">Draft</option>
      </Select>
      <Button type="submit" variant="secondary" className="min-h-11 w-full sm:w-auto">
        Apply filters
      </Button>
    </form>
  );
}

function PracticalStatusTabs({
  overview,
  status,
}: {
  overview: TeacherOverview;
  status: PracticalStatusFilter;
}) {
  const tabs: Array<{ value: PracticalStatusFilter; label: string; count: number }> = [
    { value: "ALL", label: "All", count: overview.practicals.length },
    {
      value: "PUBLISHED",
      label: "Published",
      count: overview.practicals.filter((practical) => practical.status === "PUBLISHED").length,
    },
    {
      value: "DRAFT",
      label: "Drafts",
      count: overview.practicals.filter((practical) => practical.status === "DRAFT").length,
    },
  ];

  return (
    <nav aria-label="Practical status" className="flex overflow-x-auto border-b border-[var(--border)]">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={`/practicals?status=${tab.value}`}
          aria-current={status === tab.value ? "page" : undefined}
          className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
            status === tab.value
              ? "border-[var(--brand)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {tab.label}
          <span className="text-[var(--text-muted)]">{tab.count}</span>
        </Link>
      ))}
    </nav>
  );
}

function DesktopPracticalTable({ practicals }: { practicals: TeacherPracticalSummary[] }) {
  return (
    <div className="hidden lg:block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-1 overflow-hidden shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] bg-[var(--surface-elevated)]">
            <th scope="col" className="w-[28%] px-4 py-3">Practical</th>
            <th scope="col" className="w-[18%] px-4 py-3">Class</th>
            <th scope="col" className="w-[12%] px-4 py-3">Submissions</th>
            <th scope="col" className="w-[17%] px-4 py-3">Completion</th>
            <th scope="col" className="w-[12%] px-4 py-3">Deadline</th>
            <th scope="col" className="w-[9%] px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {practicals.map((practical) => {
            const published = practical.status === "PUBLISHED";
            const hasStudents = practical.studentCount > 0;
            return (
              <tr key={practical.id} className="transition-colors hover:bg-[var(--surface-hover)]">
                <th scope="row" className="px-4 py-4 text-left font-normal">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{practical.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {practical.testCount} {practical.testCount === 1 ? "configured test" : "configured tests"}
                  </p>
                </th>
                <td className="px-4 py-4">
                  <p className="text-xs font-medium text-[var(--text-primary)]">{practical.classroomName}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{practical.classroomSubject}</p>
                </td>
                <td className="px-4 py-4 text-xs font-mono tabular-nums text-[var(--text-secondary)]">
                  {published
                    ? hasStudents
                      ? `${practical.submittedCount}/${practical.studentCount}`
                      : "No students"
                    : "—"}
                </td>
                <td className="px-4 py-4">
                  {published ? (
                    hasStudents ? (
                      <ProgressBar
                        value={practical.completionPercentage}
                        label={`${practical.completionPercentage}%`}
                        showPercentage={false}
                        height="h-1.5"
                      />
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">No enrolled students</span>
                    )
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Draft</span>
                  )}
                </td>
                <td className="px-4 py-4 text-xs text-[var(--text-secondary)]">
                  {practical.deadline ? dateLabel(practical.deadline) : "No deadline"}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={published ? "published" : "draft"}>
                    {published ? "Published" : "Draft"}
                  </StatusBadge>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <Link
                      href={practicalEditHref(practical)}
                      aria-label={`${published ? "View and manage" : "Continue editing"} ${practical.title}`}
                      className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]"
                    >
                      {published ? "View & manage" : "Continue editing"} <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                    {published ? <Link href={practicalPreviewHref(practical)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Preview student view</Link> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobilePracticalList({ practicals }: { practicals: TeacherPracticalSummary[] }) {
  return (
    <ul aria-label="Practicals" className="grid gap-4 lg:hidden">
      {practicals.map((practical) => {
        const published = practical.status === "PUBLISHED";
        const hasStudents = practical.studentCount > 0;
        return (
          <li key={practical.id} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] list-none">
            <article>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">{practical.title}</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{practical.classroomName}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {practical.classroomSubject} · {practical.testCount} {practical.testCount === 1 ? "configured test" : "configured tests"}
                  </p>
                </div>
                <StatusBadge tone={published ? "published" : "draft"}>
                  {published ? "Published" : "Draft"}
                </StatusBadge>
              </div>

              <div className="mt-4 space-y-3 text-xs text-[var(--text-secondary)]">
                {published ? hasStudents ? (
                  <ProgressBar
                    value={practical.completionPercentage}
                    label={`${practical.submittedCount}/${practical.studentCount} students submitted`}
                    height="h-1"
                  />
                ) : (
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">No enrolled students</p>
                    <p className="mt-1 text-[var(--text-muted)]">Submission progress will appear after students join.</p>
                  </div>
                ) : <p className="text-[var(--text-muted)]">Submission tracking starts after this practical is published.</p>}
                <p>
                  {practical.deadline
                    ? <time dateTime={practical.deadline}>Due {dateLabel(practical.deadline)}</time>
                    : "No deadline"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link
                  href={practicalEditHref(practical)}
                  aria-label={`${published ? "View and manage" : "Continue editing"} ${practical.title}`}
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:text-[var(--text-primary)]"
                >
                  {published ? "View & manage" : "Continue editing"} <ArrowRight size={14} aria-hidden="true" />
                </Link>
                {published ? <Link href={practicalPreviewHref(practical)} className="inline-flex min-h-11 items-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Preview student view</Link> : null}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

function PracticalEmptyState({
  hasAnyPracticals,
  createHref,
}: {
  hasAnyPracticals: boolean;
  createHref: string;
}) {
  return (
    <section aria-labelledby="practical-empty-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
      <h2 id="practical-empty-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        {hasAnyPracticals ? "No practicals match these filters" : "No practicals yet"}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
        {hasAnyPracticals
          ? "Adjust or clear the current filters to see other practicals."
          : "Create your first practical and publish it to a class."}
      </p>
      <Link
        href={hasAnyPracticals ? "/practicals" : createHref}
        className={`${hasAnyPracticals ? "button-secondary" : "button"} mt-6 min-h-11`}
      >
        {hasAnyPracticals ? "Clear filters" : "Create practical"}
      </Link>
    </section>
  );
}

function TeacherPracticalsContent({
  overview,
  params,
}: {
  overview: TeacherOverview;
  params: PracticalSearchParams;
}) {
  const query = params.q?.trim().toLowerCase() ?? "";
  const status: PracticalStatusFilter = params.status === "DRAFT" || params.status === "PUBLISHED"
    ? params.status
    : "ALL";
  const practicals = overview.practicals.filter((practical) =>
    (!query || `${practical.title} ${practical.classroomName} ${practical.classroomSubject}`.toLowerCase().includes(query)) &&
    (status === "ALL" || practical.status === status) &&
    (!params.classroom || practical.classroomId === params.classroom),
  );
  const createHref = overview.classrooms[0]
    ? `/classes/${overview.classrooms[0].id}/tasks/new`
    : "/classes";

  return (
    <div className="space-y-8">
        <PageHeader
          title="Practicals"
          description="Create, publish and manage practicals."
          actions={(
            <Link href={createHref} className="button min-h-11">
              <Plus size={15} aria-hidden="true" /> Create practical
            </Link>
          )}
        />

        <PracticalFilters overview={overview} params={params} status={status} />
        <PracticalStatusTabs overview={overview} status={status} />

        {practicals.length ? (
          <section aria-label="Practical management list">
            <DesktopPracticalTable practicals={practicals} />
            <MobilePracticalList practicals={practicals} />
          </section>
        ) : (
          <PracticalEmptyState
            hasAnyPracticals={overview.practicals.length > 0}
            createHref={createHref}
          />
        )}
    </div>
  );
}

export default async function PracticalsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<PracticalSearchParams>;
}) {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  const params = await searchParams;

  if (actor.source === "external-identity") {
    if (actor.role === "TEACHER") {
      const teacherOverview = await getTeacherOverview(actor.id);
      return (
        <DemoShell actor={actor}>
          <TeacherPracticalsContent overview={teacherOverview} params={params} />
        </DemoShell>
      );
    }

    const studentOverview = await getStudentOverview(actor.id);
    return (
      <DemoShell actor={actor}>
        <StudentPracticalsPage overview={studentOverview} allowJoin classroomId={params.classroom} status={params.status} />
      </DemoShell>
    );
  }

  const studentTargetId = actor.source === "seeded-demo-session"
    ? (await resolveDemoStudentActor()).id
    : actor.id;

  const [teacherOverview, studentOverview] = await Promise.all([
    getTeacherOverview(actor.id),
    getStudentOverview(studentTargetId),
  ]);

  return (
    <DemoShell actor={actor}>
      <RoleContentBridge
        teacher={<TeacherPracticalsContent overview={teacherOverview} params={params} />}
        student={<StudentPracticalsPage overview={studentOverview} allowJoin classroomId={params.classroom} status={params.status} />}
      />
    </DemoShell>
  );
}
