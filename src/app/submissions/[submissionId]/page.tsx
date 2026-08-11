import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleX, Info } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/design-system";
import { ExecutionModeBadge } from "@/components/execution-mode-badge";
import { SubmissionTimingBadge } from "@/components/submission-timing-badge";
import { PracticalVersionLabel } from "@/components/practical-version-label";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getSubmissionForStudent, getSubmissionForTeacher } from "@/server/attempts/service";
import { getTeacherOverview } from "@/server/teacher/overview";
import { StudentSubmissionResult } from "@/features/student/submission-result";
import { SubmissionReviewForm } from "@/features/submission-review/submission-review-form";
import { teacherReviewStatusMeta } from "@/features/submission-review/review-queue";

const eventLabels = {
  SESSION_STARTED: "Coding session started",
  DRAFT_SAVED: "Draft saved",
  RUN_REQUESTED: "Run requested",
  RUN_COMPLETED: "Run completed",
  SUBMISSION_CREATED: "Immutable submission created",
} as const;

async function loadReview(teacherId: string, submissionId: string) {
  try { return await getSubmissionForTeacher(teacherId, submissionId); } catch { notFound(); }
}

export default async function SubmissionReviewPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  if (actor.role === "STUDENT") {
    let studentSubmission;
    try { studentSubmission = await getSubmissionForStudent(actor.id, submissionId); } catch { notFound(); }
    return <DemoShell actor={actor}><StudentSubmissionResult submission={studentSubmission} /></DemoShell>;
  }
  const [review, overview] = await Promise.all([loadReview(actor.id, submissionId), getTeacherOverview(actor.id)]);
  const queue = overview.submissions.slice(0, 12);
  const passedAll = review.result.state === "completed" && review.result.passedTests === review.result.totalTests;
  const codeLines = review.sourceCode.split("\n");

  return <DemoShell actor={actor}><div className="space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><Link href="/submissions" className="icon-button" aria-label="Back to submissions"><ArrowLeft size={16} /></Link><div><p className="eyebrow">Teacher review · Immutable attempt</p><h1 className="page-heading">{review.student.name}</h1><p className="page-subtitle">{review.task.title} · {review.task.classroom.name} · Attempt #{review.attemptNumber} · {review.language}</p></div></div><div className="text-right"><div className="flex justify-end gap-2"><PracticalVersionLabel version={review.practicalVersion}/><SubmissionTimingBadge status={review.timingStatus}/><StatusBadge tone={passedAll ? "passed" : review.result.state === "compilation_error" ? "compilation-error" : "warning"}>{passedAll ? "Passed all provided tests" : review.result.state.replaceAll("_", " ")}</StatusBadge></div><p className="mt-2 text-[11px] text-[var(--text-muted)]">Submitted {new Date(review.submittedAt).toLocaleString("en-IN")}</p></div></header>

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(170px,0.7fr)_minmax(0,2.2fr)_minmax(250px,1fr)]">
      <aside className="panel hidden max-h-[calc(100vh-9rem)] overflow-y-auto xl:block"><div className="panel-header"><div><h2 className="section-heading">Review queue</h2><p className="section-description">Recent owner-scoped attempts</p></div><span className="count-chip">{queue.length}</span></div><nav className="divide-y divide-[var(--border-subtle)]">{queue.map((item) => { const status = teacherReviewStatusMeta(item.reviewStatus); return <Link key={item.id} href={`/submissions/${item.id}`} className={`block px-3 py-3 hover:bg-[var(--surface-hover)] ${item.id === review.id ? "border-l-2 border-[var(--brand-accent)] bg-[var(--surface-hover)]" : ""}`}><p className="truncate text-xs font-semibold text-white">{item.studentName}</p><p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{item.taskTitle} · #{item.attemptNumber}</p><p className="mt-1 text-[10px] font-medium text-[var(--text-secondary)]">{status.label}</p></Link>; })}</nav></aside>

      <main className="min-w-0 space-y-4">
        <section className="panel overflow-hidden bg-[#090b10]"><div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5"><div><h2 className="text-xs font-semibold text-white">Submitted source</h2><p className="text-[10px] text-[var(--text-muted)]">{review.language === "CPP" ? "solution.cpp" : "Main.java"}</p></div><span className="status-badge status-neutral">Read only</span></div><div className="max-h-[32rem] overflow-auto py-3 font-mono text-xs leading-6">{codeLines.map((line, index) => <div key={index} className="grid min-w-max grid-cols-[3.5rem_1fr] hover:bg-white/[0.025]"><span className="select-none border-r border-[var(--border-subtle)] pr-3 text-right text-[var(--text-muted)]">{index + 1}</span><code className="whitespace-pre px-4 text-slate-200">{line || " "}</code></div>)}</div></section>
        <section className="panel overflow-hidden"><div className="panel-header"><div><div className="flex flex-wrap items-center gap-2"><h2 className="section-heading">Stored result snapshot</h2><ExecutionModeBadge mode={review.result.executionMode}/></div><p className="section-description">Visible and hidden details are teacher-only here.</p></div><div className="text-right"><span className="text-xs font-semibold text-white">{review.result.passedTests}/{review.result.totalTests} passed</span><p className="mt-1 text-[10px] text-[var(--text-muted)]">Suggested {review.result.suggestedScore.toFixed(1)}/10</p></div></div>{review.result.errorText ? <pre className="m-4 overflow-x-auto rounded-md border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">{review.result.errorText}</pre> : null}<div className="grid gap-2 border-b border-[var(--border-subtle)] px-4 py-3 text-xs sm:grid-cols-2"><p><span className="text-[var(--text-muted)]">Visible:</span> <span className="font-semibold text-white">{review.result.visiblePassedTests}/{review.result.visibleTotalTests}</span></p><p><span className="text-[var(--text-muted)]">Hidden:</span> <span className="font-semibold text-white">{review.result.hiddenPassedTests}/{review.result.hiddenTotalTests}</span></p></div><div className="divide-y divide-[var(--border-subtle)]">{review.result.testResults.length ? review.result.testResults.map((result, index) => <div key={`${result.testId}-${index}`} className="grid gap-3 px-4 py-3 lg:grid-cols-[auto_1fr_1fr_1fr]"><div className="flex items-center gap-2">{result.passed ? <CheckCircle2 size={14} className="text-emerald-400" /> : <CircleX size={14} className="text-rose-400" />}<div><span className="text-xs font-semibold text-white">Test {result.position ?? index + 1}</span><p className="text-[10px] text-[var(--text-muted)]">{result.visibility === "HIDDEN" ? "Hidden" : "Visible"}</p></div></div><div><span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Input</span><pre className="mt-1 overflow-x-auto text-xs text-[var(--text-secondary)]">{result.input ?? "(legacy snapshot)"}</pre></div><div><span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Expected</span><pre className="mt-1 overflow-x-auto text-xs text-[var(--text-secondary)]">{result.expectedOutput ?? "(legacy snapshot)"}</pre></div><div><span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Actual</span><pre className="mt-1 overflow-x-auto text-xs text-[var(--text-secondary)]">{result.actualOutput || "(no output)"}</pre></div></div>) : <p className="px-4 py-5 text-xs text-[var(--text-muted)]">No per-test output was stored for this result.</p>}</div></section>
      </main>

      <aside className="space-y-4">
        <SubmissionReviewForm key={review.review?.updatedAt ?? "new"} submissionAttemptId={review.id} review={review.review} />
        <section className="panel p-4"><h2 className="section-heading">Attempt evidence</h2><dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-4"><dt className="text-[var(--text-muted)]">Student</dt><dd className="text-right font-medium text-white">{review.student.name}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--text-muted)]">Language</dt><dd className="font-medium text-white">{review.language}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--text-muted)]">Attempt</dt><dd className="font-medium text-white">#{review.attemptNumber}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--text-muted)]">Runs recorded</dt><dd className="font-medium text-white">{review.runCount}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--text-muted)]">Result</dt><dd className="text-right font-medium text-white">{review.result.passedTests}/{review.result.totalTests} tests</dd></div></dl><div className="mt-4 flex gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 p-3"><Info size={14} className="mt-0.5 shrink-0 text-blue-400" /><p className="text-[11px] leading-5 text-[var(--text-secondary)]">Labrix presents persisted evidence for teacher judgment. Marks and feedback are recorded separately from the immutable attempt.</p></div></section>
        <section className="panel p-4"><div className="flex items-center justify-between"><h2 className="section-heading">Process timeline</h2><span className="count-chip">{review.events.length}</span></div><ol className="mt-4 space-y-4">{review.events.map((event) => <li key={event.id} className="relative border-l border-[var(--border-strong)] pl-4"><span className="absolute -left-[4px] top-1 size-[7px] rounded-full bg-[var(--brand-accent)]" /><p className="text-xs font-medium text-white">{eventLabels[event.type]}</p><p className="mt-0.5 text-[10px] text-[var(--text-muted)]">#{event.sequence} · {new Date(event.occurredAt).toLocaleString("en-IN")}</p></li>)}</ol></section>
      </aside>
    </div>
  </div></DemoShell>;
}
