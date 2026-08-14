import type { SubmissionEvidenceFactsV1 } from "./submission-evidence";

export const integrityReviewThresholds = {
  veryShortSessionMs: 5 * 60 * 1_000,
  highSuggestedScore: 8,
  highPriorityReasonCount: 2,
} as const;

export type IntegrityReviewCategory =
  | "LOW_ATTENTION"
  | "REVIEW_RECOMMENDED"
  | "HIGH_REVIEW_PRIORITY";

export type IntegrityReviewReasonCode =
  | "NO_RUN_BEFORE_SUBMISSION"
  | "VERY_SHORT_SESSION"
  | "SUBMISSION_DIFFERS_FROM_SUCCESSFUL_RUN"
  | "DRAFT_SAVED_AFTER_SUCCESSFUL_RUN"
  | "HIGH_SCORE_WITH_HIDDEN_FAILURES";

export type IntegrityReviewReason = {
  code: IntegrityReviewReasonCode;
  text: string;
};

export type IntegrityReviewSignalV1 = {
  schemaVersion: 1;
  category: IntegrityReviewCategory;
  reasons: IntegrityReviewReason[];
  thresholds: typeof integrityReviewThresholds;
};

const reasonText: Record<IntegrityReviewReasonCode, string> = {
  NO_RUN_BEFORE_SUBMISSION:
    "No run was recorded before the submission evaluation.",
  VERY_SHORT_SESSION:
    "The submission was created less than 5 minutes after the coding session started.",
  SUBMISSION_DIFFERS_FROM_SUCCESSFUL_RUN:
    "The submitted source differs from the latest pre-submission run that passed every test it evaluated.",
  DRAFT_SAVED_AFTER_SUCCESSFUL_RUN:
    "A draft save was recorded after the latest successful pre-submission run.",
  HIGH_SCORE_WITH_HIDDEN_FAILURES:
    "The stored suggested score is at least 8.0/10, while one or more hidden tests did not pass.",
};

function reason(code: IntegrityReviewReasonCode): IntegrityReviewReason {
  return { code, text: reasonText[code] };
}

/**
 * Maps explainable evidence facts to a review-priority aid. This is not a
 * misconduct verdict, probability, academic decision, or sanction.
 */
export function buildIntegrityReviewSignal(
  facts: SubmissionEvidenceFactsV1,
): IntegrityReviewSignalV1 {
  const reasons: IntegrityReviewReason[] = [];

  if (facts.runCount.availability === "AVAILABLE" && facts.runCount.value === 1) {
    reasons.push(reason("NO_RUN_BEFORE_SUBMISSION"));
  }

  if (
    facts.sessionToSubmissionMs.availability === "AVAILABLE" &&
    facts.sessionToSubmissionMs.value <
      integrityReviewThresholds.veryShortSessionMs
  ) {
    reasons.push(reason("VERY_SHORT_SESSION"));
  }

  if (
    facts.submissionMatchesLatestSuccessfulRun.availability === "AVAILABLE" &&
    !facts.submissionMatchesLatestSuccessfulRun.value
  ) {
    reasons.push(reason("SUBMISSION_DIFFERS_FROM_SUCCESSFUL_RUN"));
  }

  if (
    facts.draftSavedAfterLatestSuccessfulRun.availability === "AVAILABLE" &&
    facts.draftSavedAfterLatestSuccessfulRun.value
  ) {
    reasons.push(reason("DRAFT_SAVED_AFTER_SUCCESSFUL_RUN"));
  }

  if (
    facts.suggestedScore.availability === "AVAILABLE" &&
    facts.suggestedScore.value >=
      integrityReviewThresholds.highSuggestedScore &&
    facts.tests.hidden.availability === "AVAILABLE" &&
    facts.tests.hidden.value.total > 0 &&
    facts.tests.hidden.value.passed < facts.tests.hidden.value.total
  ) {
    reasons.push(reason("HIGH_SCORE_WITH_HIDDEN_FAILURES"));
  }

  const category: IntegrityReviewCategory =
    reasons.length >= integrityReviewThresholds.highPriorityReasonCount
      ? "HIGH_REVIEW_PRIORITY"
      : reasons.length === 1
        ? "REVIEW_RECOMMENDED"
        : "LOW_ATTENTION";

  return {
    schemaVersion: 1,
    category,
    reasons,
    thresholds: integrityReviewThresholds,
  };
}
