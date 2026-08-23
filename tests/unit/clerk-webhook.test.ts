import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  clerkUserDataSchema,
  clerkWebhookEnvelopeSchema,
  isClerkUserEventType,
  verifyClerkWebhookSignature,
} from "@/server/onboarding/clerk-webhook";

const secret = "whsec_" + Buffer.from("test-clerk-webhook-secret").toString("base64");
const now = Date.parse("2026-08-23T10:00:00.000Z");
const timestamp = String(Math.floor(now / 1000));
const payload = JSON.stringify({ type: "user.created", data: { id: "user_1" } });

function signedHeaders(at = timestamp) {
  const id = "msg_test";
  const key = Buffer.from(secret.slice(6), "base64");
  const signature = createHmac("sha256", key)
    .update(`${id}.${at}.${payload}`)
    .digest("base64");
  return new Headers({
    "svix-id": id,
    "svix-timestamp": at,
    "svix-signature": `v1,${signature}`,
  });
}

describe("Clerk webhook boundary", () => {
  it("accepts a current correctly signed payload", () => {
    expect(verifyClerkWebhookSignature(payload, signedHeaders(), secret, now)).toBe(true);
  });

  it("rejects tampering, malformed timestamps, and replayed payloads", () => {
    expect(verifyClerkWebhookSignature(`${payload}x`, signedHeaders(), secret, now)).toBe(false);
    expect(verifyClerkWebhookSignature(payload, signedHeaders("123bad"), secret, now)).toBe(false);
    const oldTimestamp = String(Math.floor((now - 6 * 60 * 1000) / 1000));
    expect(verifyClerkWebhookSignature(payload, signedHeaders(oldTimestamp), secret, now)).toBe(false);
  });

  it("validates user event structure and preserves harmless ignored events", () => {
    expect(clerkWebhookEnvelopeSchema.safeParse(JSON.parse(payload)).success).toBe(true);
    expect(clerkUserDataSchema.safeParse({ id: "user_1" }).success).toBe(true);
    expect(clerkUserDataSchema.safeParse({ id: "", email_addresses: [{ id: "e", email_address: "bad" }] }).success).toBe(false);
    expect(isClerkUserEventType("user.updated")).toBe(true);
    expect(isClerkUserEventType("session.created")).toBe(false);
  });
});
