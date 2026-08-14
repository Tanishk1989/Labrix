import { z } from "zod";

const boundedText = z.string().trim().min(1).max(4_000);
const boundedList = z.array(boundedText).min(1).max(8);

export const aiClassSummaryContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    classPerformanceSummary: boundedText,
    commonMistakesOrLikelyMisconceptions: boundedList,
    topicsToReteach: boundedList,
    suggestedVivaFocusAreas: boundedList,
    reviewPriorityGuidance: boundedList,
    topVerifiedPerformerCriteriaExplanation: boundedText,
    needsAttentionCriteriaExplanation: boundedText,
    professorTeachingPlan: boundedText,
  })
  .strict();

export type AIClassSummaryContentV1 = z.infer<
  typeof aiClassSummaryContentSchema
>;

export type AIClassSummaryInputV1 = {
  schemaVersion: 1;
  practical: { title: string; instructions: string };
  classPerformance: {
    activeStudentCount: number;
    submittedCount: number;
    pendingCount: number;
    averageSuggestedScore: number | null;
    visibleTests: { passed: number; total: number; passRate: number | null };
    hiddenTests: { passed: number; total: number; passRate: number | null };
    reviewStatusCounts: {
      published: number;
      draft: number;
      unreviewed: number;
    };
    integritySignalCounts: {
      LOW_ATTENTION: number;
      REVIEW_RECOMMENDED: number;
      HIGH_REVIEW_PRIORITY: number;
    };
    anonymizedAttemptStatistics: {
      latestAttemptNumberAverage: number | null;
      resubmittedStudentCount: number;
    };
  };
  deterministicGroups: {
    topVerifiedPerformerCount: number;
    needsAttentionCount: number;
    topVerifiedCriteria: readonly string[];
    needsAttentionCriteria: readonly string[];
  };
};

export type AIClassSummaryV1 = AIClassSummaryContentV1 & {
  provenance: {
    provider: string;
    model: string;
    promptVersion: "ai-class-summary-v1";
    generatedAt: string;
    generationId: string;
    persisted: false;
  };
};

export interface AIClassSummaryProvider {
  readonly descriptor: { provider: string; model: string };
  generateSummary(input: AIClassSummaryInputV1): Promise<unknown>;
}

export class AIClassSummaryProviderError extends Error {
  constructor(message = "The AI class summary provider returned invalid output.") {
    super(message);
    this.name = "AIClassSummaryProviderError";
  }
}

export class AIClassSummaryProviderRateLimitError extends AIClassSummaryProviderError {
  constructor() {
    super("AI provider rate limit reached. Please try again later.");
    this.name = "AIClassSummaryProviderRateLimitError";
  }
}
