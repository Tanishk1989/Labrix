"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/design-system";
import { Dialog } from "@/components/dialog";
import { saveSubmissionReviewAction, type SubmissionReviewFormState } from "./actions";

interface ReviewValue {
  feedback: string;
  marksAwarded: number;
  marksOutOf: number;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  criterionScores: Array<{ id: string; title: string; maximumMarks: number; marksAwarded: number }>;
  revisions: Array<{ id: string; version: number; status: "DRAFT" | "PUBLISHED"; marksAwarded: number; marksOutOf: number; createdAt: string }>;
}

const initialState: SubmissionReviewFormState = {};

export function SubmissionReviewForm({ submissionAttemptId, maximumMarks, rubricCriteria, review }: { submissionAttemptId: string; maximumMarks: number; rubricCriteria: Array<{ id: string; title: string; maximumMarks: number }>; review: ReviewValue | null }) {
  const action = saveSubmissionReviewAction.bind(null, submissionAttemptId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const messageId = `review-form-message-${submissionAttemptId}`;
  const criteria = rubricCriteria.map((criterion) => ({ ...criterion, marksAwarded: review?.criterionScores.find((score) => score.id === criterion.id)?.marksAwarded ?? 0 }));

  return (
    <section aria-labelledby="marks-feedback-heading" className="review-grading-panel border-y border-[var(--border)] py-6">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="marks-feedback-heading" className="text-base font-semibold text-[var(--text-primary)]">Marks and feedback</h2><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Save privately or publish to this student.</p></div>
        <span className={`status-badge ${review?.status === "PUBLISHED" ? "status-success" : "status-neutral"}`}>{review?.status === "PUBLISHED" ? "Published" : review ? "Draft saved" : "Not reviewed"}</span>
      </div>

      <form id={`review-form-${submissionAttemptId}`} action={formAction} className="mt-6 space-y-6">
        {criteria.length ? (
          <fieldset className="space-y-4"><legend className="text-sm font-semibold text-[var(--text-primary)]">Rubric marks</legend>{criteria.map((criterion) => (
            <label key={criterion.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-secondary)]"><span className="leading-5">{criterion.title}</span><span className="flex items-center gap-2"><input className="input h-11 w-20 text-base" type="number" name={`criterion:${criterion.id}`} min={0} max={criterion.maximumMarks} step={1} required defaultValue={criterion.marksAwarded} /><span>/ {criterion.maximumMarks}</span></span></label>
          ))}<p className="text-xs leading-5 text-[var(--text-muted)]">Overall marks must equal the criterion total.</p></fieldset>
        ) : null}
        <label className="block text-sm font-semibold text-[var(--text-primary)]">Marks awarded<span className="mt-2 flex items-center gap-2"><input className="input h-12 w-24 text-xl font-semibold" type="number" name="marksAwarded" min={0} max={maximumMarks} step={1} required defaultValue={review?.marksAwarded ?? 0} aria-describedby={state.message ? messageId : undefined} /><span className="text-base text-[var(--text-secondary)]">/ {maximumMarks}</span></span></label>
        <label className="block text-sm font-semibold text-[var(--text-primary)]">Overall feedback<textarea className="input mt-2 min-h-56 resize-y text-sm leading-6" name="feedback" maxLength={4_000} defaultValue={review?.feedback ?? ""} placeholder="Required before publication. Write clear, constructive feedback." aria-describedby={state.message ? messageId : undefined} /></label>
        {state.message ? <p id={messageId} className={`text-sm ${state.ok ? "text-emerald-400" : "text-rose-400"}`} aria-live="polite">{state.message}</p> : null}
        {review?.publishedAt ? <p className="text-xs text-[var(--text-muted)]">Last published <time dateTime={review.publishedAt}>{new Date(review.publishedAt).toLocaleString("en-IN")}</time></p> : null}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row lg:flex-col-reverse xl:flex-row">
          <Button type="submit" variant="secondary" name="intent" value="DRAFT" disabled={pending} className="min-h-11 flex-1">{pending ? "Saving…" : "Save draft"}</Button>
          <Button type="button" onClick={() => setConfirmPublish(true)} disabled={pending} className="min-h-11 flex-1">Publish feedback</Button>
        </div>
      </form>

      {review?.revisions.length ? <details className="mt-6 border-t border-[var(--border)] pt-5"><summary className="cursor-pointer text-sm font-semibold text-[var(--text-secondary)]">Review history · {review.revisions.length}</summary><ol className="mt-4 space-y-3">{review.revisions.map((revision) => <li key={revision.id} className="flex flex-wrap justify-between gap-2 text-xs leading-5 text-[var(--text-muted)]"><span>Version {revision.version} · {revision.status === "PUBLISHED" ? "Published" : "Draft"} · {revision.marksAwarded}/{revision.marksOutOf}</span><time dateTime={revision.createdAt}>{new Date(revision.createdAt).toLocaleString("en-IN")}</time></li>)}</ol></details> : null}

      {confirmPublish ? <Dialog title="Publish marks and feedback?" description="The student will immediately see this version. A permanent review-history entry will be retained." onClose={() => setConfirmPublish(false)} footer={<><Button type="button" variant="secondary" onClick={() => setConfirmPublish(false)}>Cancel</Button><Button type="submit" form={`review-form-${submissionAttemptId}`} name="intent" value="PUBLISHED" onClick={() => setConfirmPublish(false)}>Publish to student</Button></>}><p className="text-sm leading-6 text-[var(--text-secondary)]">Check the overall mark, every rubric score, and the written feedback before publishing.</p></Dialog> : null}
    </section>
  );
}
