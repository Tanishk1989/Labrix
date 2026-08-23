import { z } from "zod";

const languageSchema = z.enum(["CPP", "JAVA"]);
const persistedIdSchema = z.string().trim().min(1).max(191);

export const draftInputSchema = z.object({
  // Prisma creates CUIDs in normal operation, while the maintained demo seed uses
  // readable stable IDs. Both are valid persisted identifiers at this boundary.
  sessionId: persistedIdSchema,
  language: languageSchema,
  sourceCode: z.string().max(200_000),
});

export const submissionInputSchema = draftInputSchema.extend({
  idempotencyKey: z.string().uuid(),
});
