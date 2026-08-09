import { z } from "zod";

export const allowedLanguages = ["CPP", "JAVA"] as const;
const testCaseSchema = z.object({
  clientId: z.string().min(1),
  input: z.string(),
  expectedOutput: z.string(),
});
export const createPracticalBaseSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  constraints: z.string().optional(),
  allowedLanguages: z.array(z.enum(allowedLanguages)),
  deadlineLocal: z.string().optional(),
  testCases: z.array(testCaseSchema),
});
export type CreatePracticalFormValues = z.infer<
  typeof createPracticalBaseSchema
>;

function validFutureDeadline(value: string | undefined) {
  if (!value) return true;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date > new Date();
}
export const createPracticalDraftSchema = createPracticalBaseSchema;
export const createPracticalPublishSchema =
  createPracticalBaseSchema.superRefine((value, context) => {
    if (!value.title.trim())
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["title"],
        message: "Enter a practical title.",
      });
    if (!value.instructions.trim())
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["instructions"],
        message: "Enter the practical instructions.",
      });
    if (value.allowedLanguages.length === 0)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedLanguages"],
        message: "Select at least one language.",
      });
    if (value.testCases.length === 0)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["testCases"],
        message: "Add at least one visible test case.",
      });
    value.testCases.forEach((testCase, index) => {
      if (!testCase.expectedOutput.trim())
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["testCases", index, "expectedOutput"],
          message: "Expected output is required.",
        });
    });
    if (!validFutureDeadline(value.deadlineLocal))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadlineLocal"],
        message: "Choose a future date and time.",
      });
  });
