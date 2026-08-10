"use server";

import { revalidatePath } from "next/cache";
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
      intent: formData.get("intent"),
    });
    revalidatePath("/submissions");
    revalidatePath(`/submissions/${submissionAttemptId}`);
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
