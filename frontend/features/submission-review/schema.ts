import { z } from "zod";

export const submissionReviewInputSchema = z.object({
  feedback: z.string().trim().max(4_000, "Feedback must be 4,000 characters or fewer."),
  marksAwarded: z.coerce
    .number()
    .int("Marks must be a whole number.")
    .min(0, "Marks cannot be negative."),
  criterionScores: z.array(z.object({
    criterionId: z.string().min(1),
    marksAwarded: z.coerce.number().int().min(0),
  })).default([]),
  intent: z.enum(["DRAFT", "PUBLISHED"]),
}).superRefine((value, context) => {
  if (value.intent === "PUBLISHED" && !value.feedback) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["feedback"],
      message: "Add constructive feedback before publishing.",
    });
  }
});

export type SubmissionReviewInput = z.infer<typeof submissionReviewInputSchema>;
