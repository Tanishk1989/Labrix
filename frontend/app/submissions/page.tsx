import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { Button, Input, PageHeader, Select } from "@/components/design-system";
import {
  filterTeacherReviewQueue,
  normalizeTeacherReviewQueueFilter,
  teacherReviewEmptyState,
  type TeacherReviewQueueFilter,
} from "@/features/submission-review/review-queue";
import { TeacherReviewQueue } from "@/features/submission-review/teacher-review-queue";
import { RoleContentBridge } from "@/features/student/role-content-bridge";
import { StudentSubmissionsPage } from "@/features/student/student-submissions-page";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getStudentOverview } from "@/server/student/overview";
import { getTeacherOverview, type TeacherOverview } from "@/server/teacher/overview";

type SubmissionSearchParams = {
  q?: string | string[];
  classroom?: string | string[];
  practical?: string | string[];
  result?: string | string[];
  review?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function reviewFilterHref(
  params: SubmissionSearchParams,
  review: TeacherReviewQueueFilter,
) {
  const query = new URLSearchParams();
  for (const key of ["q", "classroom", "practical", "result"] as const) {
    const value = firstValue(params[key]);
    if (value) query.set(key, value);
  }
  if (review !== "ALL") query.set("review", review);
  const serialized = query.toString();
  return serialized ? `/submissions?${serialized}` : "/submissions";
}

function ReviewTabs({
  overview,
  params,
  reviewFilter,
}: {
  overview: TeacherOverview;
  params: SubmissionSearchParams;
  reviewFilter: TeacherReviewQueueFilter;
}) {
  const publishedCount = overview.submissions.filter(
    (submission) => submission.reviewStatus === "PUBLISHED_FEEDBACK",
  ).length;
  const newCount = overview.submissions.filter(
    (submission) => submission.reviewStatus === "NEEDS_REVIEW",
  ).length;
  const draftCount = overview.submissions.filter(
    (submission) => submission.reviewStatus === "DRAFT_SAVED",
  ).length;
  const tabs: Array<{
    value: TeacherReviewQueueFilter;
    label: string;
    count: number;
  }> = [
    { value: "NEW", label: "New", count: newCount },
    { value: "DRAFT", label: "Draft saved", count: draftCount },
    { value: "PUBLISHED", label: "Published", count: publishedCount },
    { value: "ALL", label: "All", count: overview.submissions.length },
  ];

  return (
    <nav aria-label="Review status filters" className="flex overflow-x-auto border-b border-[var(--border)]">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={reviewFilterHref(params, tab.value)}
          aria-current={reviewFilter === tab.value ? "page" : undefined}
          className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
            reviewFilter === tab.value
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

function ReviewFilters({
  overview,
  params,
  reviewFilter,
}: {
  overview: TeacherOverview;
  params: SubmissionSearchParams;
  reviewFilter: TeacherReviewQueueFilter;
}) {
  return (
    <form
      action="/submissions"
      className="grid gap-3 border-y border-[var(--border)] py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center"
    >
      <input type="hidden" name="review" value={reviewFilter === "ALL" ? "" : reviewFilter} />
      <label className="relative min-w-0 sm:col-span-2 lg:col-span-1">
        <span className="sr-only">Search submissions</span>
        <Search
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <Input
          name="q"
          defaultValue={firstValue(params.q)}
          className="w-full pl-9"
          placeholder="Search student, practical or class"
          aria-label="Search submissions"
        />
      </label>
      <Select
        name="classroom"
        defaultValue={firstValue(params.classroom) ?? ""}
        className="w-full lg:w-48"
        aria-label="Filter by class"
      >
        <option value="">All classes</option>
        {overview.classrooms.map((classroom) => (
          <option value={classroom.id} key={classroom.id}>{classroom.name}</option>
        ))}
      </Select>
      <Select
        name="result"
        defaultValue={firstValue(params.result) ?? "ALL"}
        className="w-full lg:w-48"
        aria-label="Filter by result"
      >
        <option value="ALL">All results</option>
        <option value="PASSED">Passed all tests</option>
        <option value="INCOMPLETE">Tests incomplete</option>
        <option value="ERROR">Execution errors</option>
      </Select>
      <Button type="submit" variant="secondary" className="min-h-11 w-full sm:w-auto">
        Apply filters
      </Button>
    </form>
  );
}

function ReviewEmptyState({
  title,
  description,
  showClear,
}: {
  title: string;
  description: string;
  showClear: boolean;
}) {
  return (
    <section aria-labelledby="review-empty-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
      <h2 id="review-empty-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        {title}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {showClear ? (
        <Link href="/submissions" className="button-secondary mt-6 min-h-11">
          Clear filters
        </Link>
      ) : null}
    </section>
  );
}

function TeacherSubmissionsContent({
  overview,
  params,
}: {
  overview: TeacherOverview;
  params: SubmissionSearchParams;
}) {
  const query = firstValue(params.q)?.trim().toLowerCase() ?? "";
  const classroom = firstValue(params.classroom);
  const practical = firstValue(params.practical);
  const result = firstValue(params.result);
  const reviewFilter = normalizeTeacherReviewQueueFilter(params.review);
  const matchingSubmissions = overview.submissions.filter((submission) => {
    const passed = submission.state === "COMPLETED"
      && submission.totalTests > 0
      && submission.passedTests === submission.totalTests;
    const error = submission.state !== "COMPLETED";
    return (!query || `${submission.studentName} ${submission.taskTitle} ${submission.classroomName}`.toLowerCase().includes(query))
      && (!classroom || submission.classroomId === classroom)
      && (!practical || submission.taskId === practical)
      && (!result || result === "ALL" || (result === "PASSED" && passed) || (result === "ERROR" && error) || (result === "INCOMPLETE" && !passed && !error));
  });
  const submissions = filterTeacherReviewQueue(matchingSubmissions, reviewFilter);
  const nextReview = submissions.find(
    (submission) => submission.reviewStatus === "NEEDS_REVIEW",
  ) ?? submissions.find((submission) => submission.reviewStatus === "DRAFT_SAVED") ?? submissions[0];
  const hasContentFilters = Boolean(
    query || classroom || practical || (result && result !== "ALL"),
  );
  const emptyState = teacherReviewEmptyState({
    totalSubmissions: overview.submissions.length,
    filter: reviewFilter,
    hasContentFilters,
  });

  return (
    <div className="space-y-8">
        <PageHeader
          title="Review"
          description="Review student submissions and publish feedback."
          actions={nextReview ? (
            <Link href={`/submissions/${nextReview.id}`} className="button min-h-11">
              Review next <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : undefined}
        />

        <ReviewTabs overview={overview} params={params} reviewFilter={reviewFilter} />
        <ReviewFilters overview={overview} params={params} reviewFilter={reviewFilter} />

        {submissions.length ? (
          <section aria-labelledby="submission-queue-heading">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 id="submission-queue-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                Submission queue
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {submissions.length} {submissions.length === 1 ? "attempt" : "attempts"}
              </p>
            </div>
            <TeacherReviewQueue submissions={submissions} />
          </section>
        ) : (
          <ReviewEmptyState {...emptyState} />
        )}
    </div>
  );
}

export default async function SubmissionsQueuePage({
  searchParams,
}: {
  searchParams: Promise<SubmissionSearchParams>;
}) {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  const params = await searchParams;
  const classroomId = firstValue(params.classroom);

  if (actor.source === "seeded-demo-session") {
    const [teacherOverview, studentOverview] = await Promise.all([
      getTeacherOverview(actor.id),
      getStudentOverview("demo-student-1"),
    ]);
    return (
      <DemoShell actor={actor}>
        <RoleContentBridge
          teacher={<TeacherSubmissionsContent overview={teacherOverview} params={params} />}
          student={<StudentSubmissionsPage overview={studentOverview} classroomId={classroomId} />}
        />
      </DemoShell>
    );
  }

  if (actor.role === "STUDENT") {
    const overview = await getStudentOverview(actor.id);
    return <DemoShell actor={actor}><StudentSubmissionsPage overview={overview} classroomId={classroomId} /></DemoShell>;
  }

  const overview = await getTeacherOverview(actor.id);
  return <DemoShell actor={actor}><TeacherSubmissionsContent overview={overview} params={params} /></DemoShell>;
}
