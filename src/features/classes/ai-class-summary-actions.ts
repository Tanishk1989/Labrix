"use server";

import { z } from "zod";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  AIClassSummaryProviderRateLimitError,
} from "@/server/ai/class-summary-provider";
import {
  generateTeacherAIClassSummary,
  type AIClassSummaryResultV1,
} from "@/server/ai/class-summary-service";
import { AIReviewBriefUsageLimitError } from "@/server/ai/review-brief-usage-guard";

const idSchema = z.string().trim().min(1).max(191);

export type AIClassSummaryActionState = {
  ok?: boolean;
  message?: string;
  result?: AIClassSummaryResultV1;
};

export async function generateAIClassSummaryAction(
  classroomId: string,
  taskId: string,
  previousState: AIClassSummaryActionState,
  formData: FormData,
): Promise<AIClassSummaryActionState> {
  void previousState;
  void formData;
  const classroom = idSchema.safeParse(classroomId);
  const task = idSchema.safeParse(taskId);
  if (!classroom.success || !task.success) {
    return { ok: false, message: "The practical reference is invalid." };
  }

  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    const result = await generateTeacherAIClassSummary({
      teacherId: actor.id,
      classroomId: classroom.data,
      taskId: task.data,
    });
    return {
      ok: true,
      message: "Transient class summary generated. Edit or discard it freely.",
      result,
    };
  } catch (error) {
    if (error instanceof AIClassSummaryProviderRateLimitError) {
      return {
        ok: false,
        message: "AI provider rate limit reached. Please try again later.",
      };
    }
    if (error instanceof AIReviewBriefUsageLimitError) {
      return {
        ok: false,
        message: "Another AI draft is being generated. Please wait and try again.",
      };
    }
    return {
      ok: false,
      message:
        "The class summary could not be generated. Confirm access and try again.",
    };
  }
}
