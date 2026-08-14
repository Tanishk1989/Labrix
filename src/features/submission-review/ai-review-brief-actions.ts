"use server";

import { z } from "zod";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import { generateTeacherAIReviewBrief } from "@/server/ai/review-brief-service";
import {
  AIReviewBriefProviderRateLimitError,
  type AIReviewBriefV1,
} from "@/server/ai/review-brief-provider";
import { AIReviewBriefUsageLimitError } from "@/server/ai/review-brief-usage-guard";

const submissionIdSchema = z.string().trim().min(1).max(191);

export type AIReviewBriefActionState = {
  ok?: boolean;
  message?: string;
  brief?: AIReviewBriefV1;
};

export async function generateAIReviewBriefAction(
  submissionAttemptId: string,
  previousState: AIReviewBriefActionState,
  formData: FormData,
): Promise<AIReviewBriefActionState> {
  void previousState;
  void formData;
  const parsedSubmissionId = submissionIdSchema.safeParse(
    submissionAttemptId,
  );
  if (!parsedSubmissionId.success) {
    return { ok: false, message: "The submission reference is invalid." };
  }

  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    const brief = await generateTeacherAIReviewBrief({
      teacherId: actor.id,
      submissionId: parsedSubmissionId.data,
    });
    return {
      ok: true,
      message: "Transient review brief generated. Edit or discard it freely.",
      brief,
    };
  } catch (error) {
    if (error instanceof AIReviewBriefProviderRateLimitError) {
      return {
        ok: false,
        message: "AI provider rate limit reached. Please try again later.",
      };
    }
    if (error instanceof AIReviewBriefUsageLimitError) {
      return {
        ok: false,
        message:
          "An AI review brief is already being generated. Please wait and try again.",
      };
    }
    return {
      ok: false,
      message:
        "The review brief could not be generated. Confirm access and try again.",
    };
  }
}
