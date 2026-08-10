import type { PlatformRole, PrismaClient } from "@prisma/client";
import {
  MARKS_OUT_OF,
  submissionReviewInputSchema,
} from "@/features/submission-review/schema";

type ReviewDatabase = Pick<PrismaClient, "$transaction">;

export class SubmissionReviewAccessError extends Error {
  constructor() {
    super("You do not have permission to review this submission.");
    this.name = "SubmissionReviewAccessError";
  }
}

export class SubmissionReviewValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubmissionReviewValidationError";
  }
}

export async function saveSubmissionReview(
  db: ReviewDatabase,
  input: {
    actor: { id: string; role: PlatformRole };
    submissionAttemptId: string;
    feedback: unknown;
    marksAwarded: unknown;
    intent: unknown;
  },
) {
  if (input.actor.role !== "TEACHER") {
    throw new SubmissionReviewAccessError();
  }
  const parsed = submissionReviewInputSchema.safeParse({
    feedback: input.feedback,
    marksAwarded: input.marksAwarded,
    intent: input.intent,
  });
  if (!parsed.success) {
    throw new SubmissionReviewValidationError(
      parsed.error.issues[0]?.message ?? "Enter valid marks and feedback.",
    );
  }

  return db.$transaction(async (tx) => {
    const submission = await tx.submissionAttempt.findFirst({
      where: {
        id: input.submissionAttemptId,
        task: { classroom: { ownerTeacherId: input.actor.id } },
      },
      select: { id: true },
    });
    if (!submission) throw new SubmissionReviewAccessError();

    const status = parsed.data.intent;
    return tx.submissionReview.upsert({
      where: { submissionAttemptId: submission.id },
      create: {
        submissionAttemptId: submission.id,
        reviewerTeacherId: input.actor.id,
        feedback: parsed.data.feedback,
        marksAwarded: parsed.data.marksAwarded,
        marksOutOf: MARKS_OUT_OF,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      update: {
        reviewerTeacherId: input.actor.id,
        feedback: parsed.data.feedback,
        marksAwarded: parsed.data.marksAwarded,
        marksOutOf: MARKS_OUT_OF,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
  });
}
