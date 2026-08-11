import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { EmptyState, MetricCard, StatusBadge } from "@/components/design-system";
import { SubmissionTimingBadge } from "@/components/submission-timing-badge";
import {
  filterTeacherReviewQueue,
  normalizeTeacherReviewQueueFilter,
  teacherReviewStatusMeta,
  type TeacherReviewQueueFilter,
} from "@/features/submission-review/review-queue";
import { StudentSubmissions } from "@/features/student/student-pages";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getStudentOverview } from "@/server/student/overview";
import { getTeacherOverview } from "@/server/teacher/overview";

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

function resultMeta(state: string, passed: number, total: number) {
  if (state === "COMPILATION_ERROR") return { label: "Compilation error", tone: "compilation-error" as const };
  if (state === "RUNTIME_ERROR") return { label: "Runtime error", tone: "danger" as const };
  if (state === "TIME_LIMIT_EXCEEDED") return { label: "Time limit", tone: "warning" as const };
  if (state === "INTERNAL_ERROR") return { label: "Provider error", tone: "danger" as const };
  if (passed === total) return { label: "Passed all provided tests", tone: "passed" as const };
  return { label: "Tests incomplete", tone: "warning" as const };
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

export default async function SubmissionsQueuePage({
  searchParams,
}: {
  searchParams: Promise<SubmissionSearchParams>;
}) {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  if (actor.role === "STUDENT") {
    const overview = await getStudentOverview(actor.id);
    return <DemoShell actor={actor}><StudentSubmissions overview={overview} /></DemoShell>;
  }

  const [overview, params] = await Promise.all([
    getTeacherOverview(actor.id),
    searchParams,
  ]);
  const query = firstValue(params.q)?.trim().toLowerCase() ?? "";
  const classroom = firstValue(params.classroom);
  const practical = firstValue(params.practical);
  const result = firstValue(params.result);
  const reviewFilter = normalizeTeacherReviewQueueFilter(params.review);
  const matchingSubmissions = overview.submissions.filter((submission) => {
    const passed = submission.state === "COMPLETED" && submission.passedTests === submission.totalTests;
    const error = submission.state !== "COMPLETED";
    return (!query || `${submission.studentName} ${submission.taskTitle} ${submission.classroomName}`.toLowerCase().includes(query))
      && (!classroom || submission.classroomId === classroom)
      && (!practical || submission.taskId === practical)
      && (!result || result === "ALL" || (result === "PASSED" && passed) || (result === "ERROR" && error) || (result === "INCOMPLETE" && !passed && !error));
  });
  const submissions = filterTeacherReviewQueue(matchingSubmissions, reviewFilter);
  const draftCount = overview.submissions.filter((item) => item.reviewStatus === "DRAFT_SAVED").length;
  const publishedCount = overview.submissions.filter((item) => item.reviewStatus === "PUBLISHED_FEEDBACK").length;
  const nextReview = submissions.find((item) => item.reviewStatus !== "PUBLISHED_FEEDBACK") ?? submissions[0];

  return <DemoShell actor={actor}><div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow">Teacher workspace</p><h1 className="page-heading">Review queue</h1><p className="page-subtitle">Grade immutable attempts using persisted results and teacher-authored feedback.</p></div>
      {nextReview ? <Link href={`/submissions/${nextReview.id}`} className="button">Review next <ArrowRight size={14} /></Link> : null}
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="All attempts" value={overview.submissions.length} detail="Owner-scoped classrooms" />
      <MetricCard label="Needs review" value={overview.summary.needsReviewCount} detail="Includes private drafts" />
      <MetricCard label="Draft saved" value={draftCount} detail="Not published" />
      <MetricCard label="Published feedback" value={publishedCount} />
    </section>

    <nav aria-label="Review status filters" className="flex flex-wrap gap-2">
      {([
        ["ALL", "All", overview.submissions.length],
        ["NEEDS_REVIEW", "Needs review", overview.summary.needsReviewCount],
        ["REVIEWED", "Reviewed", publishedCount],
      ] as const).map(([value, label, count]) => <Link
        key={value}
        href={reviewFilterHref(params, value)}
        aria-current={reviewFilter === value ? "page" : undefined}
        className={reviewFilter === value ? "button" : "button-secondary"}
      >{label} <span className="count-chip">{count}</span></Link>)}
    </nav>

    <form action="/submissions" className="panel flex flex-wrap items-center gap-3 p-3">
      <input type="hidden" name="review" value={reviewFilter === "ALL" ? "" : reviewFilter} />
      <label className="relative min-w-64 flex-1"><span className="sr-only">Search submissions</span><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input className="input pl-8" name="q" defaultValue={firstValue(params.q)} placeholder="Search student, practical or class" /></label>
      <select name="classroom" defaultValue={classroom ?? ""} className="input w-auto min-w-44"><option value="">All classes</option>{overview.classrooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
      <select name="result" defaultValue={result ?? "ALL"} className="input w-auto min-w-44"><option value="ALL">All results</option><option value="PASSED">Passed all tests</option><option value="INCOMPLETE">Tests incomplete</option><option value="ERROR">Execution errors</option></select>
      <button className="button-secondary">Apply filters</button>
    </form>

    {submissions.length ? <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Student</th><th>Class and practical</th><th>Attempt</th><th>Language</th><th>Timing</th><th>Submitted</th><th>Stored result</th><th>Suggested score</th><th>Teacher marks</th><th>Review status</th><th><span className="sr-only">Open review</span></th></tr></thead><tbody>{submissions.map((submission) => {
      const result = resultMeta(submission.state, submission.passedTests, submission.totalTests);
      const review = teacherReviewStatusMeta(submission.reviewStatus);
      return <tr key={submission.id}>
        <td className="font-semibold text-white">{submission.studentName}</td>
        <td className="min-w-52"><p className="text-xs text-white">{submission.taskTitle}</p><p className="text-[11px] text-[var(--text-muted)]">{submission.classroomName} · {submission.classroomSubject}</p></td>
        <td>#{submission.attemptNumber}</td>
        <td>{submission.language === "CPP" ? "C++" : "Java"}</td>
        <td><SubmissionTimingBadge status={submission.timingStatus} /></td>
        <td className="min-w-44 text-xs text-[var(--text-secondary)]">{new Date(submission.submittedAt).toLocaleString("en-IN")}</td>
        <td><StatusBadge tone={result.tone}>{result.label}</StatusBadge><p className="mt-1 text-[10px] text-[var(--text-muted)]">{submission.passedTests}/{submission.totalTests} tests</p></td>
        <td><span className="font-semibold text-white">{submission.suggestedScore.toFixed(1)}/10</span><p className="text-[10px] text-[var(--text-muted)]">Automatic</p></td>
        <td>{submission.teacherMarks ? <><span className="font-semibold text-white">{submission.teacherMarks.awarded}/{submission.teacherMarks.outOf}</span><p className="text-[10px] text-[var(--text-muted)]">Teacher-awarded</p></> : <span className="text-[var(--text-muted)]">—</span>}</td>
        <td><StatusBadge tone={review.tone}>{review.label}</StatusBadge></td>
        <td><Link href={`/submissions/${submission.id}`} aria-label={`Review attempt ${submission.attemptNumber} by ${submission.studentName}`} className="button-secondary min-h-8 px-2.5 py-1">Review <ArrowRight size={12} /></Link></td>
      </tr>;
    })}</tbody></table></div></div> : <EmptyState title="No submissions found" description="No owner-scoped immutable attempts match the selected filters." />}
  </div></DemoShell>;
}
