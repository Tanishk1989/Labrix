import { z } from "zod";

const languageSchema = z.enum(["CPP", "JAVA"]);

export const draftInputSchema = z.object({
  sessionId: z.string().cuid(),
  language: languageSchema,
  sourceCode: z.string().max(200_000),
});

export const submissionInputSchema = draftInputSchema.extend({
  idempotencyKey: z.string().uuid(),
});
