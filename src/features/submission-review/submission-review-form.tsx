"use client";

import { useActionState } from "react";
import { MARKS_OUT_OF } from "./schema";
import {
  saveSubmissionReviewAction,
  type SubmissionReviewFormState,
} from "./actions";

interface ReviewValue {
  feedback: string;
  marksAwarded: number;
  marksOutOf: number;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
}

const initialState: SubmissionReviewFormState = {};

export function SubmissionReviewForm({
  submissionAttemptId,
  review,
}: {
  submissionAttemptId: string;
  review: ReviewValue | null;
}) {
  const action = saveSubmissionReviewAction.bind(null, submissionAttemptId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-heading">Marks and feedback</h2>
          <p className="section-description">Save privately or publish to this student.</p>
        </div>
        <span className={`status-badge ${review?.status === "PUBLISHED" ? "status-success" : "status-neutral"}`}>
          {review?.status === "PUBLISHED" ? "Published" : "Draft"}
        </span>
      </div>
      <form action={formAction} className="mt-4 space-y-3">
        <label className="block text-xs font-medium text-[var(--text-secondary)]">
          Marks awarded
          <span className="mt-1 flex items-center gap-2">
            <input
              className="input w-20"
              type="number"
              name="marksAwarded"
              min={0}
              max={MARKS_OUT_OF}
              step={1}
              required
              defaultValue={review?.marksAwarded ?? 0}
            />
            <span className="text-xs text-[var(--text-muted)]">out of {MARKS_OUT_OF}</span>
          </span>
        </label>
        <label className="block text-xs font-medium text-[var(--text-secondary)]">
          Feedback
          <textarea
            className="input mt-1 min-h-28 resize-y"
            name="feedback"
            maxLength={4_000}
            defaultValue={review?.feedback ?? ""}
            placeholder="Write clear, constructive feedback for this attempt."
          />
        </label>
        {state.message ? (
          <p
            className={`text-xs ${state.ok ? "text-emerald-400" : "text-rose-400"}`}
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button className="button-secondary" name="intent" value="DRAFT" disabled={pending}>
            {pending ? "Saving…" : "Save draft"}
          </button>
          <button className="button" name="intent" value="PUBLISHED" disabled={pending}>
            {pending ? "Publishing…" : "Publish feedback"}
          </button>
        </div>
        {review?.publishedAt ? (
          <p className="text-[10px] text-[var(--text-muted)]">
            Last published {new Date(review.publishedAt).toLocaleString("en-IN")}
          </p>
        ) : null}
      </form>
    </section>
  );
}
