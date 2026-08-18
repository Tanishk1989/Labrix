"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  saveSubmissionReview,
  SubmissionReviewAccessError,
  SubmissionReviewValidationError,
} from "@/server/reviews/submission-review";
import { CLASSROOM_MANAGEMENT_CACHE_TAG } from "@/server/teacher/cache-tags";

export interface SubmissionReviewFormState {
  ok?: boolean;
  message?: string;
}

export async function saveSubmissionReviewAction(
  submissionAttemptId: string,
  _previousState: SubmissionReviewFormState,
  formData: FormData,
): Promise<SubmissionReviewFormState> {
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    const review = await saveSubmissionReview(prisma, {
      actor,
      submissionAttemptId,
      feedback: formData.get("feedback"),
      marksAwarded: formData.get("marksAwarded"),
      criterionScores: Array.from(formData.entries())
        .filter(([key]) => key.startsWith("criterion:"))
        .map(([key, value]) => ({ criterionId: key.slice("criterion:".length), marksAwarded: value })),
      intent: formData.get("intent"),
    });
    revalidatePath("/submissions");
    revalidatePath(`/submissions/${submissionAttemptId}`);
    updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
    return {
      ok: true,
      message:
        review.status === "PUBLISHED"
          ? "Marks and feedback published to the student."
          : "Review draft saved. Only teachers can see it.",
    };
  } catch (error) {
    if (
      error instanceof SubmissionReviewAccessError ||
      error instanceof SubmissionReviewValidationError
    ) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "The review could not be saved. Try again." };
  }
}
