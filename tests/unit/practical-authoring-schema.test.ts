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
  maximumMarks: 10,
  rubricCriteria: [],
};

describe("practical publish validation", () => {
  it("accepts the minimum valid single-problem practical", () => {
    expect(createPracticalPublishSchema.safeParse(validPractical).success).toBe(
      true,
    );
  });

  it("accepts a practical without test cases", () => {
    expect(
      createPracticalPublishSchema.safeParse({
        ...validPractical,
        testCases: [],
      }).success,
    ).toBe(true);
  });

  it.each([
    ["title", { title: "   " }],
    ["instructions", { instructions: "   " }],
    ["allowed language", { allowedLanguages: [] }],
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

  it("accepts a bounded rubric whose criteria total the practical maximum", () => {
    expect(createPracticalPublishSchema.safeParse({ ...validPractical, maximumMarks: 20, rubricCriteria: [
      { clientId: "correctness", title: "Correctness", maximumMarks: 12 },
      { clientId: "quality", title: "Code quality", maximumMarks: 8 },
    ] }).success).toBe(true);
  });

  it("rejects a one-item rubric or a mismatched criterion total", () => {
    expect(createPracticalPublishSchema.safeParse({ ...validPractical, rubricCriteria: [{ clientId: "only", title: "Correctness", maximumMarks: 10 }] }).success).toBe(false);
    expect(createPracticalPublishSchema.safeParse({ ...validPractical, rubricCriteria: [
      { clientId: "one", title: "Correctness", maximumMarks: 5 },
      { clientId: "two", title: "Quality", maximumMarks: 4 },
    ] }).success).toBe(false);
  });
});
