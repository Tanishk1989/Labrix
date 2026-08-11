import { describe, expect, it } from "vitest";
import { createPracticalPublishSchema } from "@/features/task-authoring/schema";

const validPractical = {
  title: "Array fundamentals",
  instructions: "Read an integer and print it.",
  constraints: "1 <= n <= 100",
  allowedLanguages: ["JAVA"] as const,
  starterCodes: {
    CPP: "int main() { return 0; }",
    JAVA: "public class Main {}",
  },
  deadlineLocal: "",
  testCases: [
    { clientId: "visible-1", input: "1", expectedOutput: "1", visible: true },
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
    [
      "visible test",
      {
        testCases: [
          { clientId: "hidden-1", input: "2", expectedOutput: "2", visible: false },
        ],
      },
    ],
    [
      "expected output",
      {
        testCases: [
          { clientId: "visible-1", input: "1", expectedOutput: "   ", visible: true },
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

  it("accepts visible and hidden tests when every expected output is present", () => {
    expect(
      createPracticalPublishSchema.safeParse({
        ...validPractical,
        testCases: [
          ...validPractical.testCases,
          { clientId: "hidden-1", input: "2", expectedOutput: "2", visible: false },
        ],
      }).success,
    ).toBe(true);
  });
});
