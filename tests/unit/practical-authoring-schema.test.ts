import { describe, expect, it } from "vitest";
import { createPracticalPublishSchema } from "@/features/task-authoring/schema";

const validPractical = {
  title: "Array fundamentals",
  instructions: "Read an integer and print it.",
  constraints: "1 <= n <= 100",
  allowedLanguages: ["JAVA"] as const,
  deadlineLocal: "",
  testCases: [
    { clientId: "visible-1", input: "1", expectedOutput: "1" },
  ],
};

describe("practical publish validation", () => {
  it("accepts the minimum valid single-problem practical", () => {
    expect(createPracticalPublishSchema.safeParse(validPractical).success).toBe(
      true,
    );
  });

  it.each([
    ["title", { title: "   " }],
    ["instructions", { instructions: "   " }],
    ["allowed language", { allowedLanguages: [] }],
    ["visible test", { testCases: [] }],
    [
      "expected output",
      {
        testCases: [
          { clientId: "visible-1", input: "1", expectedOutput: "   " },
        ],
      },
    ],
  ])("rejects publish without %s", (_label, override) => {
    expect(
      createPracticalPublishSchema.safeParse({
        ...validPractical,
        ...override,
      }).success,
    ).toBe(false);
  });
});
