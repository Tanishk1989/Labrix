import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = 1;
export const TEACHER_APPROVAL_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface TeacherApprovalTokenPayload {
  version: typeof TOKEN_VERSION;
  userId: string;
  requestedAt: string;
  expiresAt: number;
}

export interface VerifiedTeacherApprovalToken {
  userId: string;
  requestedAt: Date;
  expiresAt: Date;
}

function signatureFor(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function validSecret(secret: string) {
  if (secret.length < 32) {
    throw new Error("TEACHER_APPROVAL_SECRET must contain at least 32 characters.");
  }
}

export function createTeacherApprovalToken(
  input: { userId: string; requestedAt: Date },
  secret: string,
  now = Date.now(),
) {
  validSecret(secret);
  const payload: TeacherApprovalTokenPayload = {
    version: TOKEN_VERSION,
    userId: input.userId,
    requestedAt: input.requestedAt.toISOString(),
    expiresAt: now + TEACHER_APPROVAL_TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signatureFor(encodedPayload, secret)}`;
}

export function verifyTeacherApprovalToken(
  token: string,
  secret: string,
  now = Date.now(),
): VerifiedTeacherApprovalToken | null {
  validSecret(secret);
  if (token.length > 2_048) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [encodedPayload, suppliedSignature] = parts;
  const expectedSignature = signatureFor(encodedPayload, secret);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<TeacherApprovalTokenPayload>;
    if (
      payload.version !== TOKEN_VERSION ||
      typeof payload.userId !== "string" ||
      payload.userId.length < 1 ||
      payload.userId.length > 191 ||
      typeof payload.requestedAt !== "string" ||
      typeof payload.expiresAt !== "number" ||
      !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt < now
    ) {
      return null;
    }
    const requestedAt = new Date(payload.requestedAt);
    if (Number.isNaN(requestedAt.getTime())) return null;
    return {
      userId: payload.userId,
      requestedAt,
      expiresAt: new Date(payload.expiresAt),
    };
  } catch {
    return null;
  }
}
