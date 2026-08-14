import { Info } from "lucide-react";
import { StatusBadge } from "@/components/design-system";
import type {
  IntegrityReviewCategory,
  IntegrityReviewSignalV1,
} from "@/domain/evidence/integrity-review-signals";

const categoryMeta: Record<
  IntegrityReviewCategory,
  {
    label: string;
    tone: "neutral" | "warning" | "danger";
  }
> = {
  LOW_ATTENTION: { label: "Low attention", tone: "neutral" },
  REVIEW_RECOMMENDED: {
    label: "Review recommended",
    tone: "warning",
  },
  HIGH_REVIEW_PRIORITY: {
    label: "High review priority",
    tone: "danger",
  },
};

export function IntegrityReviewBadge({
  signal,
}: {
  signal: IntegrityReviewSignalV1;
}) {
  const meta = categoryMeta[signal.category];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function IntegrityReviewSignalPanel({
  signal,
}: {
  signal: IntegrityReviewSignalV1;
}) {
  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-heading">Integrity review aid</h2>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Deterministic review priority &middot; schema v{signal.schemaVersion}
          </p>
        </div>
        <IntegrityReviewBadge signal={signal} />
      </div>

      {signal.reasons.length ? (
        <ul className="mt-4 space-y-2 text-xs text-[var(--text-secondary)]">
          {signal.reasons.map((reason) => (
            <li className="flex gap-2" key={reason.code}>
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400"
              />
              <span>{reason.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs leading-5 text-[var(--text-secondary)]">
          No configured review-priority reason was derived from the available
          facts.
        </p>
      )}

      <div className="mt-4 flex gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 p-3">
        <Info
          size={14}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-blue-400"
        />
        <p className="text-[11px] leading-5 text-[var(--text-secondary)]">
          This category helps prioritize teacher review or viva. It is not a
          cheating verdict, guilt score, plagiarism finding, or academic
          decision. Unavailable facts do not create reasons.
        </p>
      </div>
    </section>
  );
}
