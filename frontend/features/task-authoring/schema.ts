import { z } from "zod";

export const allowedLanguages = ["CPP", "JAVA"] as const;
const testCaseSchema = z.object({
  clientId: z.string().min(1),
  input: z.string(),
  expectedOutput: z.string(),
  visible: z.boolean(),
});
const rubricCriterionSchema = z.object({
  clientId: z.string().min(1),
  title: z.string(),
  maximumMarks: z.coerce.number().int().min(1).max(1000),
});
export const createPracticalBaseSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  constraints: z.string().optional(),
  allowedLanguages: z.array(z.enum(allowedLanguages)),
  starterCodes: z.object({
    CPP: z.string().max(200_000),
    JAVA: z.string().max(200_000),
  }),
  deadlineLocal: z.string().optional(),
  testCases: z.array(testCaseSchema),
  maximumMarks: z.coerce.number().int().min(1).max(1000).default(10),
  rubricCriteria: z.array(rubricCriterionSchema).max(5).default([]),
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
    value.testCases.forEach((testCase, index) => {
      if (!testCase.expectedOutput.trim())
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["testCases", index, "expectedOutput"],
          message: `Add the expected output for test case ${index + 1}.`,
        });
    });
    if (value.rubricCriteria.length === 1)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rubricCriteria"],
        message: "Use at least two rubric criteria or remove the rubric.",
      });
    value.rubricCriteria.forEach((criterion, index) => {
      if (!criterion.title.trim())
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rubricCriteria", index, "title"],
          message: "Enter a rubric criterion name.",
        });
    });
    const rubricTotal = value.rubricCriteria.reduce(
      (total, criterion) => total + criterion.maximumMarks,
      0,
    );
    if (value.rubricCriteria.length > 0 && rubricTotal !== value.maximumMarks)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rubricCriteria"],
        message: "Criterion marks must add up to the total marks available.",
      });
    if (!validFutureDeadline(value.deadlineLocal))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadlineLocal"],
        message: "Choose a future student deadline, or leave it blank.",
      });
  });
