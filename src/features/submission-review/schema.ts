import { z } from "zod";

export const MARKS_OUT_OF = 10;

export const submissionReviewInputSchema = z.object({
  feedback: z.string().trim().max(4_000, "Feedback must be 4,000 characters or fewer."),
  marksAwarded: z.coerce
    .number()
    .int("Marks must be a whole number.")
    .min(0, "Marks cannot be negative.")
    .max(MARKS_OUT_OF, `Marks cannot exceed ${MARKS_OUT_OF}.`),
  intent: z.enum(["DRAFT", "PUBLISHED"]),
});

export type SubmissionReviewInput = z.infer<typeof submissionReviewInputSchema>;
