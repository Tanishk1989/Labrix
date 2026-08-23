import { describe, expect, it } from "vitest";
import { draftInputSchema } from "@/features/workspace/input-schema";

describe("workspace identity input boundary", () => {
  it.each([
    "cm12345678901234567890123",
    "demo-session-aarav-brackets-active",
  ])("accepts persisted session identifier %s", (sessionId) => {
    expect(draftInputSchema.safeParse({
      sessionId,
      language: "CPP",
      sourceCode: "int main() { return 0; }",
    }).success).toBe(true);
  });

  it.each(["", " ", "x".repeat(192)])("rejects invalid persisted session identifier", (sessionId) => {
    expect(draftInputSchema.safeParse({
      sessionId,
      language: "CPP",
      sourceCode: "int main() { return 0; }",
    }).success).toBe(false);
  });

  it.each([
    ["studentId", "demo-teacher"],
    ["role", "TEACHER"],
  ])("strips forged browser field %s", (field, value) => {
    const parsed = draftInputSchema.parse({
      sessionId: "cm12345678901234567890123",
      language: "CPP",
      sourceCode: "int main() { return 0; }",
      [field]: value,
    });
    expect(parsed).not.toHaveProperty(field);
  });
});
