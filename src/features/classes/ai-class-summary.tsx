"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Info, Sparkles, Trash2 } from "lucide-react";
import {
  generateAIClassSummaryAction,
  type AIClassSummaryActionState,
} from "./ai-class-summary-actions";

const initialState: AIClassSummaryActionState = {};

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

function listText(values: string[]) {
  return values.map((value) => `- ${value}`).join("\n");
}

export function AIClassSummaryPanel({
  classroomId,
  taskId,
}: {
  classroomId: string;
  taskId: string;
}) {
  const action = generateAIClassSummaryAction.bind(null, classroomId, taskId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [discardedGenerationId, setDiscardedGenerationId] = useState<
    string | null
  >(null);
  const result =
    state.result?.summary.provenance.generationId === discardedGenerationId
      ? null
      : state.result;
  const summary = result?.summary;

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="text-violet-300" size={15} />
            <h3 className="section-heading">AI class summary draft</h3>
          </div>
          <p className="section-description">
            Teacher-triggered, anonymous at the provider boundary, transient,
            and editable. Nothing is saved or published automatically.
          </p>
        </div>
        <span className="status-badge status-neutral">
          {summary
            ? `${summary.provenance.provider} provider`
            : "Provider selected server-side"}
        </span>
      </div>

      <form action={formAction} className="mt-4">
        <button className="button" disabled={pending} type="submit">
          {pending
            ? "Generating class summary..."
            : summary
              ? "Generate again"
              : "Generate class summary"}
        </button>
      </form>

      <div aria-live="polite" className="mt-3 min-h-5">
        {pending ? (
          <p className="text-xs text-violet-200">
            Summarizing deterministic class aggregates...
          </p>
        ) : state.message ? (
          <p className={`text-xs ${state.ok ? "text-emerald-400" : "text-rose-400"}`}>
            {state.message}
          </p>
        ) : null}
      </div>

      {summary && result ? (
        <div
          className="mt-4 space-y-5 border-t border-[var(--border)] pt-4"
          key={summary.provenance.generationId}
        >
          <EditableText label="1. Class performance summary" value={summary.classPerformanceSummary} />
          <EditableText label="2. Common mistakes / likely misconceptions" rows={5} value={listText(summary.commonMistakesOrLikelyMisconceptions)} />
          <EditableText label="3. Topics to reteach" value={listText(summary.topicsToReteach)} />
          <EditableText label="4. Suggested viva focus areas" value={listText(summary.suggestedVivaFocusAreas)} />
          <EditableText label="5. Review priority guidance" value={listText(summary.reviewPriorityGuidance)} />
          <EditableText label="6. Top verified performer criteria" value={summary.topVerifiedPerformerCriteriaExplanation} />
          <EditableText label="7. Needs-attention criteria" value={summary.needsAttentionCriteriaExplanation} />
          <EditableText label="8. Professor-facing teaching plan" rows={5} value={summary.professorTeachingPlan} />

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border border-[var(--border)] bg-black/10 p-3">
              <h4 className="text-xs font-semibold text-white">Top verified performers</h4>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Membership is deterministic and was not sent to AI.</p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                {result.deterministicGroups.topVerifiedPerformers.length ? result.deterministicGroups.topVerifiedPerformers.map((item) => (
                  <li key={item.submissionId}><Link className="text-link" href={`/submissions/${item.submissionId}`}>{item.name} · {item.suggestedScore.toFixed(1)}/10</Link></li>
                )) : <li>No students currently meet every criterion.</li>}
              </ul>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-black/10 p-3">
              <h4 className="text-xs font-semibold text-white">Needs attention</h4>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Neutral review guidance, not an academic-integrity verdict.</p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                {result.deterministicGroups.needsAttention.length ? result.deterministicGroups.needsAttention.map((item) => (
                  <li key={`${item.name}-${item.submissionId ?? "pending"}`}>{item.submissionId ? <Link className="text-link" href={`/submissions/${item.submissionId}`}>{item.name}</Link> : item.name}<span className="text-[var(--text-muted)]"> · {item.reasons.join(", ")}</span></li>
                )) : <li>No students currently meet a needs-attention criterion.</li>}
              </ul>
            </div>
          </div>

          <div className="rounded-md border border-violet-500/20 bg-violet-500/5 p-3 text-[11px] leading-5 text-[var(--text-secondary)]">
            <p>Provenance: {summary.provenance.provider} / {summary.provenance.model} / {summary.provenance.promptVersion} / generated {new Date(summary.provenance.generatedAt).toLocaleString("en-IN")}</p>
            <p>Persisted: no. This draft is not marks, published feedback, or a verdict.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex max-w-2xl gap-2 text-[11px] leading-5 text-[var(--text-muted)]">
              <Info aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
              <p>Verify AI wording against the deterministic aggregates. AI does not select students or create integrity signals.</p>
            </div>
            <button className="button-secondary" onClick={() => setDiscardedGenerationId(summary.provenance.generationId)} type="button">
              <Trash2 aria-hidden="true" size={14} /> Discard draft
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
