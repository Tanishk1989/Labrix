import { describe, expect, it } from "vitest";
import { draftInputSchema } from "@/features/workspace/input-schema";

describe("workspace identity input boundary", () => {
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
