import { z } from "zod";
import type { IntegrityReviewSignalV1 } from "@/domain/evidence/integrity-review-signals";
import type {
  EvidenceFact,
  SubmissionEvidenceFactsV1,
} from "@/domain/evidence/submission-evidence";

const boundedText = z.string().trim().min(1).max(4_000);

export const aiReviewBriefContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    approachSummary: boundedText,
    likelyBugsOrEdgeCases: z.array(boundedText).min(1).max(6),
    evidenceExplanation: z.array(boundedText).min(1).max(8),
    vivaQuestions: z
      .array(
        z
          .object({
            question: boundedText,
            expectedAnswerBullets: z.array(boundedText).min(1).max(6),
          })
          .strict(),
      )
      .length(3),
    modificationTask: boundedText,
    feedbackDraft: boundedText,
  })
  .strict();

export type AIReviewBriefContentV1 = z.infer<
  typeof aiReviewBriefContentSchema
>;

export type AIReviewBriefInputV1 = {
  schemaVersion: 1;
  practical: {
    title: string;
    instructions: string;
  };
  language: "JAVA" | "CPP";
  submittedSource: string;
  resultSummary: {
    state:
      | "completed"
      | "compilation_error"
      | "runtime_error"
      | "time_limit_exceeded"
      | "internal_error";
    overall: EvidenceFact<{ passed: number; total: number }>;
    visible: EvidenceFact<{ passed: number; total: number }>;
    hidden: EvidenceFact<{ passed: number; total: number }>;
  };
  evidenceFacts: SubmissionEvidenceFactsV1;
  integritySignal: IntegrityReviewSignalV1;
  timingStatus: "ON_TIME" | "LATE" | null;
  practicalVersion: number | null;
};

export type AIReviewBriefV1 = AIReviewBriefContentV1 & {
  provenance: {
    provider: string;
    model: string;
    promptVersion: "ai-review-brief-v1";
    generatedAt: string;
    generationId: string;
    persisted: false;
  };
};

export interface AIReviewBriefProvider {
  readonly descriptor: {
    provider: string;
    model: string;
  };
  generateBrief(input: AIReviewBriefInputV1): Promise<unknown>;
}

export class AIReviewBriefProviderError extends Error {
  constructor(message = "The AI review brief provider returned invalid output.") {
    super(message);
    this.name = "AIReviewBriefProviderError";
  }
}

export class AIReviewBriefProviderRateLimitError extends AIReviewBriefProviderError {
  constructor() {
    super("AI provider rate limit reached. Please try again later.");
    this.name = "AIReviewBriefProviderRateLimitError";
  }
}
