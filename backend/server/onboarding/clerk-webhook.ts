import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const clerkWebhookEnvelopeSchema = z.object({
  type: z.string().min(1).max(100),
  data: z.unknown(),
});

export const clerkUserDataSchema = z.object({
  id: z.string().min(1).max(191),
  first_name: z.string().max(191).nullable().optional(),
  last_name: z.string().max(191).nullable().optional(),
  email_addresses: z.array(z.object({
    id: z.string().min(1).max(191),
    email_address: z.string().email().max(320),
  })).max(50).optional(),
  primary_email_address_id: z.string().max(191).nullable().optional(),
  public_metadata: z.object({
    role: z.enum(["TEACHER", "STUDENT"]).optional(),
  }).optional(),
  unsafe_metadata: z.object({
    role: z.enum(["TEACHER", "STUDENT"]).optional(),
  }).optional(),
});

export type ClerkUserData = z.infer<typeof clerkUserDataSchema>;
export type ClerkUserEventType = "user.created" | "user.updated" | "user.deleted";

export function getClerkAssignedRole(data: ClerkUserData): "TEACHER" | "STUDENT" {
  return data.public_metadata?.role === "TEACHER" ? "TEACHER" : "STUDENT";
}

export function isClerkUserEventType(type: string): type is ClerkUserEventType {
  return type === "user.created" || type === "user.updated" || type === "user.deleted";
}

export function verifyClerkWebhookSignature(
  payload: string,
  headers: Headers,
  secret: string,
  now = Date.now(),
): boolean {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (
    !svixId ||
    !svixTimestamp ||
    !/^\d+$/.test(svixTimestamp) ||
    !svixSignature ||
    !secret
  ) {
    return false;
  }

  const timestampMs = Number(svixTimestamp) * 1000;
  if (!Number.isSafeInteger(timestampMs) || Math.abs(now - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  try {
    const toSign = `${svixId}.${svixTimestamp}.${payload}`;
    const secretKey = secret.startsWith("whsec_")
      ? Buffer.from(secret.slice(6), "base64")
      : Buffer.from(secret);
    const expectedSignature = createHmac("sha256", secretKey)
      .update(toSign)
      .digest("base64");

    return svixSignature.split(" ").some((part) => {
      if (!part.startsWith("v1,")) return false;
      const suppliedSignature = part.slice(3);
      const suppliedBuffer = Buffer.from(suppliedSignature);
      const expectedBuffer = Buffer.from(expectedSignature);
      return suppliedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(suppliedBuffer, expectedBuffer);
    });
  } catch {
    return false;
  }
}
