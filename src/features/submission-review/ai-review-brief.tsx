"use client";

import { useActionState, useState } from "react";
import { Info, Sparkles, Trash2 } from "lucide-react";
import {
  generateAIReviewBriefAction,
  type AIReviewBriefActionState,
} from "./ai-review-brief-actions";

const initialState: AIReviewBriefActionState = {};

function EditableText({
  label,
  value,
  rows = 4,
}: {
  label: string;
  value: string;
  rows?: number;
}) {
  return (
    <label className="block text-xs font-medium text-[var(--text-secondary)]">
      {label}
      <textarea
        className="input mt-1 resize-y leading-5"
        defaultValue={value}
        maxLength={4_000}
        rows={rows}
      />
    </label>
  );
}

export function AIReviewBriefPanel({
  submissionAttemptId,
}: {
  submissionAttemptId: string;
}) {
  const action = generateAIReviewBriefAction.bind(null, submissionAttemptId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [discardedGenerationId, setDiscardedGenerationId] = useState<
    string | null
  >(null);
  const brief =
    state.brief?.provenance.generationId === discardedGenerationId
      ? null
      : state.brief;

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              aria-hidden="true"
              className="text-violet-300"
              size={15}
            />
            <h2 className="section-heading">AI review brief draft</h2>
          </div>
          <p className="section-description">
            Teacher-only, transient, and editable. Nothing is published or
            saved automatically.
          </p>
        </div>
        <span className="status-badge status-neutral">Fake provider v1</span>
      </div>

      <form action={formAction} className="mt-4">
        <button className="button" disabled={pending} type="submit">
          {pending ? "Generating brief..." : brief ? "Generate again" : "Generate brief"}
        </button>
      </form>

      <div aria-live="polite" className="mt-3 min-h-5">
        {pending ? (
          <p className="text-xs text-violet-200">
            Building a structured draft from the immutable submission...
          </p>
        ) : state.message ? (
          <p
            className={`text-xs ${state.ok ? "text-emerald-400" : "text-rose-400"}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>

      {brief ? (
        <div
          className="mt-4 space-y-5 border-t border-[var(--border)] pt-4"
          key={brief.provenance.generationId}
        >
          <EditableText label="1. Approach summary" value={brief.approachSummary} />
          <EditableText
            label="2. Likely bugs or edge cases"
            rows={5}
            value={brief.likelyBugsOrEdgeCases
              .map((item) => `- ${item}`)
              .join("\n")}
          />
          <EditableText
            label="3. Evidence explanation"
            rows={6}
            value={brief.evidenceExplanation
              .map((item) => `- ${item}`)
              .join("\n")}
          />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white">
              4-5. Viva questions and expected answers
            </h3>
            {brief.vivaQuestions.map((item, index) => (
              <div
                className="rounded-md border border-[var(--border)] bg-black/10 p-3"
                key={`${brief.provenance.generationId}-${index}`}
              >
                <EditableText
                  label={`Question ${index + 1}`}
                  rows={2}
                  value={item.question}
                />
                <div className="mt-3">
                  <EditableText
                    label="Expected answer bullets"
                    rows={3}
                    value={item.expectedAnswerBullets
                      .map((bullet) => `- ${bullet}`)
                      .join("\n")}
                  />
                </div>
              </div>
            ))}
          </div>

          <EditableText
            label="6. Small modification task"
            value={brief.modificationTask}
          />
          <EditableText
            label="7. Constructive feedback draft"
            rows={6}
            value={brief.feedbackDraft}
          />

          <div className="rounded-md border border-violet-500/20 bg-violet-500/5 p-3 text-[11px] leading-5 text-[var(--text-secondary)]">
            <p>
              Provenance: {brief.provenance.provider} / {brief.provenance.model}
              {" / "}
              {brief.provenance.promptVersion}
              {" / generated "}
              {new Date(brief.provenance.generatedAt).toLocaleString("en-IN")}
            </p>
            <p>Persisted: no. This draft is not marks or published feedback.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex max-w-2xl gap-2 text-[11px] leading-5 text-[var(--text-muted)]">
              <Info aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
              <p>
                Verify every statement against the source and deterministic
                evidence. Student code and comments are treated as untrusted
                text, never instructions.
              </p>
            </div>
            <button
              className="button-secondary"
              onClick={() =>
                setDiscardedGenerationId(brief.provenance.generationId)
              }
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
              Discard draft
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
