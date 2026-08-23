import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { DemoShell } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/breadcrumb";
import { PageHeader, StatusBadge } from "@/components/design-system";
import {
  buildTeacherReviewSidebarQueue,
  teacherReviewStatusMeta,
  toTeacherReviewQueueStatus,
} from "@/features/submission-review/review-queue";
import { SubmissionCodeViewer } from "@/features/submission-review/submission-code-viewer";
import { SubmissionReviewForm } from "@/features/submission-review/submission-review-form";
import { SubmissionTestResults } from "@/features/submission-review/submission-test-results";
import { TeacherReviewQueue } from "@/features/submission-review/teacher-review-queue";
import { StudentJourneyTimeline } from "@/features/submission-review/student-journey-timeline";
import { AcademicIntegrityPanel } from "@/features/submission-review/academic-integrity-panel";
import { StudentSubmissionResult } from "@/features/student/submission-result";
import { FastGraderNavigator, type FastGraderItem } from "@/features/submission-review/fast-grader-navigator";
import { DEFAULT_STARTER_CODES } from "@/domain/tasks/starter-code";
import { analyzeAttemptProcess } from "@/server/evidence/integrity-engine";
import { generateVivaDefense } from "@/server/evidence/viva-generator";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import {
  getSubmissionForStudent,
  getSubmissionForTeacher,
} from "@/server/attempts/service";
import { AccessDeniedError } from "@/server/authorization/classroom-access";
import { getTeacherOverview } from "@/server/teacher/overview";

const eventLabels = {
  SESSION_STARTED: "Coding session started",
  DRAFT_SAVED: "Draft saved",
  RUN_REQUESTED: "Run requested",
  RUN_COMPLETED: "Run completed",
  SUBMISSION_CREATED: "Submission recorded",
} as const;

async function loadReview(teacherId: string, submissionId: string) {
  try {
    return await getSubmissionForTeacher(teacherId, submissionId);
  } catch (error) {
    if (error instanceof AccessDeniedError) notFound();
    throw error;
  }
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

function languageLabel(language: "CPP" | "JAVA") {
  return language === "CPP" ? "C++" : "Java";
}

function resultLabel(state: string, passedTests: number, totalTests: number) {
  if (state === "compilation_error") return "Compilation error";
  if (state === "runtime_error") return "Runtime error";
  if (state === "time_limit_exceeded") return "Time limit exceeded";
  if (state === "internal_error") return "Provider error";
  if (totalTests === 0) return "No tests configured";
  if (passedTests === totalTests) return "Passed all provided tests";
  return "Tests incomplete";
}

export default async function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  if (actor.role === "STUDENT") {
    let studentSubmission;
    try {
      studentSubmission = await getSubmissionForStudent(actor.id, submissionId);
    } catch (error) {
      if (error instanceof AccessDeniedError) notFound();
      throw error;
    }
    return <DemoShell actor={actor}><StudentSubmissionResult submission={studentSubmission} /></DemoShell>;
  }

  const [review, overview] = await Promise.all([
    loadReview(actor.id, submissionId),
    getTeacherOverview(actor.id),
  ]);
  const queue = buildTeacherReviewSidebarQueue(overview.submissions, review.id);
  const reviewStatus = toTeacherReviewQueueStatus(review.review?.status ?? null);
  const reviewStatusMeta = teacherReviewStatusMeta(reviewStatus);
  const result = resultLabel(
    review.result.state,
    review.result.passedTests,
    review.result.totalTests,
  );

  const processAnalysis = analyzeAttemptProcess({
    events: review.events,
    sourceCode: review.sourceCode,
    runCount: review.runCount,
    passedTests: review.result.passedTests,
    totalTests: review.result.totalTests,
    submittedAt: review.submittedAt,
  });

  const vivaDefense = generateVivaDefense({
    sourceCode: review.sourceCode,
    language: review.language,
    taskTitle: review.task.title,
    processAnalysis,
    testPassRatio: {
      passed: review.result.passedTests,
      total: review.result.totalTests,
    },
    topSimilarity: review.cohortSimilarity,
  });

  const fastGraderItems: FastGraderItem[] = queue.map((item) => ({
    id: item.id,
    studentName: item.studentName,
    taskTitle: item.taskTitle,
    status: item.reviewStatus === "PUBLISHED_FEEDBACK" ? "PASSED" : item.reviewStatus === "DRAFT_SAVED" ? "REDO" : "PENDING",
    attemptNumber: item.attemptNumber,
  }));

  return (
    <DemoShell actor={actor}>
      <div className="space-y-7">
        <Breadcrumbs
          items={[
            { label: "Reviews Queue", href: "/submissions" },
            { label: `${review.student.name} (${review.task.classroom.name})` },
          ]}
        />

        {fastGraderItems.length > 1 && (
          <FastGraderNavigator submissions={fastGraderItems} currentId={review.id} />
        )}

        <PageHeader
          eyebrow="Submission review"
          title={`${review.student.name} · ${review.task.title}`}
          description={`${review.task.classroom.name} · Review the persisted attempt, then save or publish teacher feedback.`}
          compact
          actions={(
            <StatusBadge tone={reviewStatus === "PUBLISHED_FEEDBACK" ? "published" : reviewStatus === "DRAFT_SAVED" ? "draft" : "needs-review"}>
              {reviewStatusMeta.label}
            </StatusBadge>
          )}
        />

        <dl className="grid gap-5 border-y border-[var(--border)] py-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[var(--text-muted)]">Attempt</dt>
            <dd className="mt-1 font-semibold text-[var(--text-primary)]">#{review.attemptNumber}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Language</dt>
            <dd className="mt-1 font-semibold text-[var(--text-primary)]">{languageLabel(review.language)}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Submitted</dt>
            <dd className="mt-1 font-semibold text-[var(--text-primary)]">
              <time dateTime={review.submittedAt}>{dateTimeLabel(review.submittedAt)}</time>
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Submission result</dt>
            <dd className="mt-1 font-semibold text-[var(--text-primary)]">{result}</dd>
          </div>
        </dl>

        <details className="border-y border-[var(--border)] py-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Review queue · {queue.length} recent attempts</summary>
          <div className="mt-4"><TeacherReviewQueue submissions={queue} selectedId={review.id} compact /></div>
        </details>

        {/* Visual Student Journey Timeline: EDIT -> RUN -> SUBMIT -> REVIEW */}
        <StudentJourneyTimeline
          events={review.events}
          attemptNumber={review.attemptNumber}
          submittedAt={review.submittedAt}
          reviewStatus={review.review?.status ?? "NEEDS_REVIEW"}
          marksAwarded={review.review?.marksAwarded}
          marksOutOf={review.task.maximumMarks}
          runCount={review.runCount}
          passedTests={review.result.passedTests}
          totalTests={review.result.totalTests}
          studentName={review.student.name}
        />

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <section aria-label="Submission evidence" className="min-w-0 space-y-8">
            <SubmissionCodeViewer
              sourceCode={review.sourceCode}
              language={review.language}
              starterCode={DEFAULT_STARTER_CODES[review.language]}
            />
            <SubmissionTestResults result={review.result} />
            <AcademicIntegrityPanel
              processAnalysis={processAnalysis}
              vivaDefense={vivaDefense}
              studentName={review.student.name}
              practicalTitle={review.task.title}
              classroomName={review.task.classroom.name}
              attemptNumber={review.attemptNumber}
              submittedAt={review.submittedAt}
              sourceCode={review.sourceCode}
              language={review.language}
              cohortSimilarity={review.cohortSimilarity}
              peerComparisons={review.peerComparisons}
            />
            <details className="border-y border-[var(--border)] py-4">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Activity and attempt context · {review.events.length} events</summary>
              <div className="mt-5 grid gap-8 md:grid-cols-2">
                <section aria-labelledby="attempt-context-heading">
                  <h2 id="attempt-context-heading" className="text-sm font-semibold text-[var(--text-primary)]">Attempt context</h2>
                  <dl className="mt-4 space-y-4 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-[var(--text-muted)]">Student</dt><dd className="text-right font-medium text-[var(--text-primary)]">{review.student.name}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-[var(--text-muted)]">Runs recorded</dt><dd className="font-medium text-[var(--text-primary)]">{review.runCount}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-[var(--text-muted)]">Test result</dt><dd className="text-right font-medium text-[var(--text-primary)]">{review.result.passedTests}/{review.result.totalTests} passed</dd></div>
                  </dl>
                  <div className="mt-5 flex gap-2 border-l-2 border-[var(--brand-accent)] pl-3"><Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--brand-accent)]" /><p className="text-xs leading-5 text-[var(--text-secondary)]">Recorded results and activity support teacher judgment. Marks and feedback remain separate from the submitted attempt.</p></div>
                </section>
                <section aria-labelledby="attempt-timeline-heading">
                  <h2 id="attempt-timeline-heading" className="text-sm font-semibold text-[var(--text-primary)]">Process timeline</h2>
                  <ol className="mt-4 space-y-4">{review.events.map((event) => <li key={event.id} className="relative border-l border-[var(--border)] pl-4"><span aria-hidden="true" className="absolute -left-[4px] top-1 size-[7px] rounded-full bg-[var(--brand-accent)]" /><p className="text-sm font-medium text-[var(--text-primary)]">{eventLabels[event.type]}</p><p className="mt-1 text-xs text-[var(--text-muted)]">#{event.sequence} · <time dateTime={event.occurredAt}>{dateTimeLabel(event.occurredAt)}</time></p></li>)}</ol>
                </section>
              </div>
            </details>
          </section>

          <aside aria-label="Marks and feedback controls" className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
            <SubmissionReviewForm
              key={review.review?.updatedAt ?? "new"}
              submissionAttemptId={review.id}
              maximumMarks={review.task.maximumMarks}
              rubricCriteria={review.task.rubricCriteria}
              review={review.review}
            />
          </aside>
        </div>
      </div>
    </DemoShell>
  );
}
