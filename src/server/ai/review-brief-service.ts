import "server-only";

import { randomUUID } from "node:crypto";
import { getSubmissionForTeacher } from "@/server/attempts/service";
import { getAIReviewBriefProvider } from "./review-brief-provider-config";
import {
  aiReviewBriefContentSchema,
  AIReviewBriefProviderError,
  type AIReviewBriefContentV1,
  type AIReviewBriefInputV1,
  type AIReviewBriefProvider,
  type AIReviewBriefV1,
} from "./review-brief-provider";

type TeacherReviewBriefSubmission = {
  language: "JAVA" | "CPP";
  sourceCode: string;
  task: {
    title: string;
    instructions: string;
  };
  result: {
    state:
      | "completed"
      | "compilation_error"
      | "runtime_error"
      | "time_limit_exceeded"
      | "internal_error";
  };
  evidenceFacts: Awaited<
    ReturnType<typeof getSubmissionForTeacher>
  >["evidenceFacts"];
  integritySignal: Awaited<
    ReturnType<typeof getSubmissionForTeacher>
  >["integritySignal"];
  timingStatus: "ON_TIME" | "LATE" | null;
  practicalVersion: number | null;
};

type TeacherSubmissionLoader = (
  teacherId: string,
  submissionId: string,
) => Promise<TeacherReviewBriefSubmission>;

export function buildAIReviewBriefInput(
  submission: TeacherReviewBriefSubmission,
): AIReviewBriefInputV1 {
  return {
    schemaVersion: 1,
    practical: {
      title: submission.task.title,
      instructions: submission.task.instructions,
    },
    language: submission.language,
    submittedSource: submission.sourceCode,
    resultSummary: {
      state: submission.result.state,
      overall: submission.evidenceFacts.tests.overall,
      visible: submission.evidenceFacts.tests.visible,
      hidden: submission.evidenceFacts.tests.hidden,
    },
    evidenceFacts: submission.evidenceFacts,
    integritySignal: submission.integritySignal,
    timingStatus: submission.timingStatus,
    practicalVersion: submission.practicalVersion,
  };
}

export async function generateTeacherAIReviewBrief(options: {
  teacherId: string;
  submissionId: string;
  provider?: AIReviewBriefProvider;
  loadSubmission?: TeacherSubmissionLoader;
  now?: () => Date;
  generationId?: () => string;
}): Promise<AIReviewBriefV1> {
  const submission = await (options.loadSubmission ?? getSubmissionForTeacher)(
    options.teacherId,
    options.submissionId,
  );
  const provider = options.provider ?? getAIReviewBriefProvider();

  let content: AIReviewBriefContentV1;
  try {
    content = aiReviewBriefContentSchema.parse(
      await provider.generateBrief(buildAIReviewBriefInput(submission)),
    );
  } catch (error) {
    if (error instanceof AIReviewBriefProviderError) throw error;
    throw new AIReviewBriefProviderError();
  }

  return {
    ...content,
    provenance: {
      provider: provider.descriptor.provider,
      model: provider.descriptor.model,
      promptVersion: "ai-review-brief-v1",
      generatedAt: (options.now ?? (() => new Date()))().toISOString(),
      generationId: (options.generationId ?? randomUUID)(),
      persisted: false,
    },
  };
}
