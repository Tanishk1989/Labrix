import type { PlatformRole, Prisma, PrismaClient } from "@prisma/client";
import { submissionReviewInputSchema } from "@/features/submission-review/schema";

type ReviewDatabase = Pick<PrismaClient, "$transaction">;

export class SubmissionReviewAccessError extends Error {
  constructor() { super("You do not have permission to review this submission."); this.name = "SubmissionReviewAccessError"; }
}

export class SubmissionReviewValidationError extends Error {
  constructor(message: string) { super(message); this.name = "SubmissionReviewValidationError"; }
}

export async function saveSubmissionReview(
  db: ReviewDatabase,
  input: {
    actor: { id: string; role: PlatformRole };
    submissionAttemptId: string;
    feedback: unknown;
    marksAwarded: unknown;
    criterionScores?: unknown;
    intent: unknown;
  },
) {
  if (input.actor.role !== "TEACHER") throw new SubmissionReviewAccessError();
  const parsed = submissionReviewInputSchema.safeParse({
    feedback: input.feedback,
    marksAwarded: input.marksAwarded,
    criterionScores: input.criterionScores ?? [],
    intent: input.intent,
  });
  if (!parsed.success) throw new SubmissionReviewValidationError(parsed.error.issues[0]?.message ?? "Enter valid marks and feedback.");

  return db.$transaction(async (tx) => {
    const submission = await tx.submissionAttempt.findFirst({
      where: { id: input.submissionAttemptId, task: { classroom: { ownerTeacherId: input.actor.id } } },
      select: {
        id: true,
        task: { select: { maximumMarks: true, rubricCriteria: { orderBy: { position: "asc" } } } },
      },
    });
    if (!submission) throw new SubmissionReviewAccessError();

    const maximumMarks = submission.task.maximumMarks;
    if (parsed.data.marksAwarded > maximumMarks) throw new SubmissionReviewValidationError(`Marks cannot exceed ${maximumMarks}.`);
    const criteria = submission.task.rubricCriteria;
    const scoreByCriterion = new Map(parsed.data.criterionScores.map((score) => [score.criterionId, score.marksAwarded]));
    if (criteria.length > 0) {
      if (scoreByCriterion.size !== criteria.length) throw new SubmissionReviewValidationError("Enter marks for every rubric criterion.");
      for (const criterion of criteria) {
        const score = scoreByCriterion.get(criterion.id);
        if (score === undefined || score > criterion.maximumMarks) throw new SubmissionReviewValidationError(`${criterion.title} cannot exceed ${criterion.maximumMarks}.`);
      }
      const rubricTotal = criteria.reduce((total, criterion) => total + (scoreByCriterion.get(criterion.id) ?? 0), 0);
      if (rubricTotal !== parsed.data.marksAwarded) throw new SubmissionReviewValidationError("Overall marks must equal the rubric total.");
    } else if (parsed.data.criterionScores.length > 0) {
      throw new SubmissionReviewValidationError("This practical does not use a rubric.");
    }

    const status = parsed.data.intent;
    const publishedAt = status === "PUBLISHED" ? new Date() : null;
    const review = await tx.submissionReview.upsert({
      where: { submissionAttemptId: submission.id },
      create: { submissionAttemptId: submission.id, reviewerTeacherId: input.actor.id, feedback: parsed.data.feedback, marksAwarded: parsed.data.marksAwarded, marksOutOf: maximumMarks, status, publishedAt },
      update: { reviewerTeacherId: input.actor.id, feedback: parsed.data.feedback, marksAwarded: parsed.data.marksAwarded, marksOutOf: maximumMarks, status, publishedAt },
    });
    await tx.submissionReviewCriterionScore.deleteMany({ where: { reviewId: review.id } });
    if (criteria.length > 0) {
      await tx.submissionReviewCriterionScore.createMany({ data: criteria.map((criterion) => ({ reviewId: review.id, criterionId: criterion.id, marksAwarded: scoreByCriterion.get(criterion.id) ?? 0 })) });
    }
    const latest = await tx.submissionReviewRevision.aggregate({ where: { reviewId: review.id }, _max: { version: true } });
    await tx.submissionReviewRevision.create({
      data: {
        reviewId: review.id,
        reviewerTeacherId: input.actor.id,
        version: (latest._max.version ?? 0) + 1,
        feedback: parsed.data.feedback,
        marksAwarded: parsed.data.marksAwarded,
        marksOutOf: maximumMarks,
        status,
        publishedAt,
        rubricScores: criteria.map((criterion) => ({ criterionId: criterion.id, title: criterion.title, marksAwarded: scoreByCriterion.get(criterion.id) ?? 0, maximumMarks: criterion.maximumMarks })) as Prisma.InputJsonValue,
      },
    });
    return review;
  });
}
