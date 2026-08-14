import "server-only";

import type {
  AIClassSummaryContentV1,
  AIClassSummaryInputV1,
  AIClassSummaryProvider,
} from "./class-summary-provider";

export class FakeAIClassSummaryProvider implements AIClassSummaryProvider {
  readonly descriptor = {
    provider: "fake",
    model: "deterministic-class-summary-v1",
  } as const;

  async generateSummary(
    input: AIClassSummaryInputV1,
  ): Promise<AIClassSummaryContentV1> {
    const performance = input.classPerformance;
    return {
      schemaVersion: 1,
      classPerformanceSummary: `${performance.submittedCount} of ${performance.activeStudentCount} active students submitted. The deterministic average suggested score is ${performance.averageSuggestedScore ?? "unavailable"}/10.`,
      commonMistakesOrLikelyMisconceptions: [
        performance.hiddenTests.total > performance.hiddenTests.passed
          ? "Some submitted attempts did not pass every hidden test; inspect solutions manually for edge-case handling."
          : "No hidden-test failure pattern is available from the aggregate counters.",
      ],
      topicsToReteach: [
        "Revisit the practical requirements and demonstrate how to test boundary cases before submission.",
      ],
      suggestedVivaFocusAreas: [
        "Ask students to explain their algorithm, complexity, and one edge case in their own words.",
      ],
      reviewPriorityGuidance: [
        `${input.deterministicGroups.needsAttentionCount} students meet the deterministic needs-attention criteria; this is review guidance, not a misconduct judgment.`,
      ],
      topVerifiedPerformerCriteriaExplanation: `${input.deterministicGroups.topVerifiedPerformerCount} students meet all deterministic top verified performer criteria: ${input.deterministicGroups.topVerifiedCriteria.join("; ")}.`,
      needsAttentionCriteriaExplanation: `${input.deterministicGroups.needsAttentionCount} students meet one or more deterministic needs-attention criteria: ${input.deterministicGroups.needsAttentionCriteria.join("; ")}.`,
      professorTeachingPlan:
        "Review aggregate failures, reteach one relevant concept with a worked example, then use short implementation-focused viva checks before finalizing feedback.",
    };
  }
}
