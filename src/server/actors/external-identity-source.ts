import { z } from "zod";

const externalIdentitySchema = z.object({
  provider: z.string().trim().min(1).max(80),
  providerSubject: z.string().trim().min(1).max(255),
});

export type VerifiedExternalIdentity = z.infer<typeof externalIdentitySchema>;

export interface ExternalIdentitySource {
  getExternalIdentity(): Promise<unknown>;
}

export class InvalidExternalIdentityError extends Error {
  constructor() {
    super("The external identity was invalid.");
    this.name = "InvalidExternalIdentityError";
  }
}

export function parseExternalIdentity(
  value: unknown,
): VerifiedExternalIdentity | null {
  if (value === null) return null;
  const parsed = externalIdentitySchema.safeParse(value);
  if (!parsed.success) throw new InvalidExternalIdentityError();
  return parsed.data;
}
