import Link from "next/link";
import { ArrowRight, Medal, TriangleAlert } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/design-system";
import type {
  PracticalAnalyticsAttentionItem,
  PracticalAnalyticsAttentionReason,
  PracticalAnalyticsHiddenAggregate,
  PracticalAnalyticsReviewStatus,
  PracticalAnalyticsTopVerifiedItem,
  PracticalAnalyticsTopVerifiedReason,
} from "@/server/teacher/practical-analytics";

const topReasonLabels: Record<PracticalAnalyticsTopVerifiedReason, string> = {
  HIGH_SUGGESTED_SCORE: "High suggested score",
  NO_HIGH_REVIEW_PRIORITY: "No high review priority",
  HIDDEN_AGGREGATE_PASSED: "Hidden aggregate passed",
  HIDDEN_AGGREGATE_NOT_APPLICABLE: "No hidden tests",
  HIDDEN_AGGREGATE_UNAVAILABLE: "Hidden aggregate unavailable",
  REVIEW_PUBLISHED: "Review published",
};

const attentionReasonLabels: Record<PracticalAnalyticsAttentionReason, string> = {
  NO_SUBMISSION: "No submission",
  LOW_SUGGESTED_SCORE: "Suggested score below 5/10",
  FAILED_HIDDEN_TESTS: "Hidden aggregate not all passed",
  NEEDS_REVIEW: "Review not published",
  HIGH_REVIEW_PRIORITY: "High review priority",
};

function hiddenAggregateLabel(value: PracticalAnalyticsHiddenAggregate) {
  if (value.availability === "UNAVAILABLE") return "Unavailable";
  if (value.total === 0) return "No hidden tests";
  return `${value.passed}/${value.total} passed`;
}

function reviewStatusLabel(value: PracticalAnalyticsReviewStatus) {
  if (value === "PUBLISHED") return "Published";
  if (value === "DRAFT") return "Private draft";
  if (value === "NOT_REVIEWED") return "Not reviewed";
  return "Not applicable";
}

function StudentFacts({
  attemptNumber,
  suggestedScore,
  hiddenAggregate,
  reviewStatus,
}: {
  attemptNumber: number | null;
  suggestedScore: number | null;
  hiddenAggregate: PracticalAnalyticsHiddenAggregate;
  reviewStatus: PracticalAnalyticsReviewStatus;
}) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
      <div>
        <dt className="text-[var(--text-muted)]">Latest attempt / status</dt>
        <dd className="mt-0.5 font-semibold text-white">
          {attemptNumber === null ? "Not submitted" : `#${attemptNumber} · Submitted`}
        </dd>
      </div>
      <div>
        <dt className="text-[var(--text-muted)]">Suggested score</dt>
        <dd className="mt-0.5 font-semibold text-white">
          {suggestedScore === null ? "Unavailable" : `${suggestedScore.toFixed(1)}/10`}
        </dd>
      </div>
      <div>
        <dt className="text-[var(--text-muted)]">Hidden aggregate</dt>
        <dd className="mt-0.5 font-semibold text-white">
          {hiddenAggregateLabel(hiddenAggregate)}
        </dd>
      </div>
      <div>
        <dt className="text-[var(--text-muted)]">Review status</dt>
        <dd className="mt-0.5 font-semibold text-white">
          {reviewStatusLabel(reviewStatus)}
        </dd>
      </div>
    </dl>
  );
}

function TopVerifiedRow({ item }: { item: PracticalAnalyticsTopVerifiedItem }) {
  return (
    <li className="rounded-md border border-[var(--border)] bg-black/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-white">{item.student.name}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.reasons.map((reason) => (
              <StatusBadge
                key={reason}
                tone={
                  reason === "HIDDEN_AGGREGATE_UNAVAILABLE" ||
                  reason === "HIDDEN_AGGREGATE_NOT_APPLICABLE"
                    ? "neutral"
                    : "success"
                }
              >
                {topReasonLabels[reason]}
              </StatusBadge>
            ))}
          </div>
        </div>
        <Link className="button-secondary min-h-8 px-2.5 py-1" href={`/submissions/${item.submissionId}`}>
          Review <ArrowRight size={12} />
        </Link>
      </div>
      <StudentFacts
        attemptNumber={item.attemptNumber}
        hiddenAggregate={item.hiddenAggregate}
        reviewStatus={item.reviewStatus}
        suggestedScore={item.suggestedScore}
      />
    </li>
  );
}

function NeedsAttentionRow({ item }: { item: PracticalAnalyticsAttentionItem }) {
  return (
    <li className="rounded-md border border-[var(--border)] bg-black/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-white">{item.student.name}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.reasons.map((reason) => (
              <StatusBadge
                key={reason}
                tone={
                  reason === "HIGH_REVIEW_PRIORITY" ||
                  reason === "FAILED_HIDDEN_TESTS" ||
                  reason === "NO_SUBMISSION"
                    ? "warning"
                    : "neutral"
                }
              >
                {attentionReasonLabels[reason]}
              </StatusBadge>
            ))}
          </div>
        </div>
        {item.submissionId ? (
          <Link className="button-secondary min-h-8 px-2.5 py-1" href={`/submissions/${item.submissionId}`}>
            Review <ArrowRight size={12} />
          </Link>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">Await submission</span>
        )}
      </div>
      <StudentFacts
        attemptNumber={item.attemptNumber}
        hiddenAggregate={item.hiddenAggregate}
        reviewStatus={item.reviewStatus}
        suggestedScore={item.suggestedScore}
      />
    </li>
  );
}

export function TeacherAttentionGroups({
  groups,
}: {
  groups: {
    topVerifiedPerformers: {
      totalCount: number;
      items: PracticalAnalyticsTopVerifiedItem[];
    };
    needsAttention: {
      totalCount: number;
      items: PracticalAnalyticsAttentionItem[];
    };
  };
}) {
  return (
    <section aria-label="Deterministic student groups" className="grid gap-4 xl:grid-cols-2">
      <div className="panel overflow-hidden">
        <div className="panel-header">
          <div>
            <div className="flex items-center gap-2">
              <Medal aria-hidden="true" className="text-emerald-400" size={15} />
              <h3 className="section-heading">Top verified performers</h3>
            </div>
            <p className="section-description">
              Deterministic criteria from the latest immutable attempt. Not an AI ranking.
            </p>
          </div>
          <span className="count-chip">{groups.topVerifiedPerformers.totalCount}</span>
        </div>
        {groups.topVerifiedPerformers.items.length ? (
          <div className="p-3">
            <ol className="space-y-2">
              {groups.topVerifiedPerformers.items.map((item) => (
                <TopVerifiedRow item={item} key={item.student.id} />
              ))}
            </ol>
            {groups.topVerifiedPerformers.totalCount > groups.topVerifiedPerformers.items.length ? (
              <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                Showing the first {groups.topVerifiedPerformers.items.length} of {groups.topVerifiedPerformers.totalCount} by deterministic score and attempt ordering.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState title="No top verified performers yet" description="Students appear here after meeting the score, hidden aggregate, review, and review-priority criteria." />
          </div>
        )}
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-header">
          <div>
            <div className="flex items-center gap-2">
              <TriangleAlert aria-hidden="true" className="text-amber-400" size={15} />
              <h3 className="section-heading">Needs attention</h3>
            </div>
            <p className="section-description">
              Neutral review priority from deterministic submission, result, review, and integrity facts.
            </p>
          </div>
          <span className="count-chip">{groups.needsAttention.totalCount}</span>
        </div>
        {groups.needsAttention.items.length ? (
          <div className="p-3">
            <ol className="space-y-2">
              {groups.needsAttention.items.map((item) => (
                <NeedsAttentionRow item={item} key={item.student.id} />
              ))}
            </ol>
            {groups.needsAttention.totalCount > groups.needsAttention.items.length ? (
              <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                Showing the first {groups.needsAttention.items.length} of {groups.needsAttention.totalCount} by deterministic review-priority ordering.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState title="No students need attention" description="No active student currently meets a deterministic needs-attention criterion." />
          </div>
        )}
      </div>
    </section>
  );
}
