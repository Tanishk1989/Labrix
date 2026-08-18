import { describe, expect, it } from "vitest";
import {
  createPracticalDraftSchema,
  createPracticalPublishSchema,
} from "@/features/task-authoring/schema";

const valid = {
  title: "Array pairs",
  instructions: "Find a pair.",
  constraints: "",
  allowedLanguages: ["CPP"] as const,
  starterCodes: {
    CPP: "int main() { return 0; }",
    JAVA: "public class Main {}",
  },
  deadlineLocal: "2099-01-01T10:00",
  testCases: [{ clientId: "one", input: "", expectedOutput: "0", visible: true }],
};
describe("create practical validation", () => {
  it("requires title, instructions, language, and expected output for publishing", () => {
    const result = createPracticalPublishSchema.safeParse({
      ...valid,
      title: " ",
      instructions: " ",
      allowedLanguages: [],
      testCases: [{ clientId: "one", input: "", expectedOutput: "", visible: true }],
    });
    expect(result.success).toBe(false);
  });
  it("allows empty stdin", () =>
    expect(createPracticalPublishSchema.safeParse(valid).success).toBe(true));
  it("allows publishing without test cases", () =>
    expect(createPracticalPublishSchema.safeParse({ ...valid, testCases: [] }).success).toBe(true));
  it("rejects a past publish deadline", () =>
    expect(
      createPracticalPublishSchema.safeParse({
        ...valid,
        deadlineLocal: "2020-01-01T10:00",
      }).success,
    ).toBe(false));
  it("allows incomplete safe drafts", () =>
    expect(
      createPracticalDraftSchema.safeParse({
        ...valid,
        title: "",
        instructions: "",
        allowedLanguages: [],
        testCases: [{ clientId: "one", input: "", expectedOutput: "", visible: true }],
      }).success,
    ).toBe(true));
  it("keeps test case order", () => {
    const result = createPracticalPublishSchema.parse({
      ...valid,
      testCases: [
        { clientId: "one", input: "a", expectedOutput: "a", visible: true },
        { clientId: "two", input: "b", expectedOutput: "b", visible: false },
      ],
    });
    expect(result.testCases.map((test) => test.clientId)).toEqual([
      "one",
      "two",
    ]);
  });
});
