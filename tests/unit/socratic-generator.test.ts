import { describe, expect, it } from "vitest";
import { generateSocraticHint } from "@/server/hints/socratic-generator";
import type { HintContext } from "@/server/hints/context-builder";

function mockContext(requestedLevel: number, overrides: Partial<HintContext> = {}): HintContext {
  return {
    task: {
      id: "task-1",
      title: "Balanced Parentheses",
      instructions: "Check if a string of brackets is valid and balanced.",
      constraints: "O(N) time and O(N) space",
    },
    language: "CPP",
    currentSourceCode: `
      #include <iostream>
      using namespace std;
      bool isValid(string s) {
        int count = 0;
        for(char c : s) count++;
        return count == 0;
      }
    `,
    latestRun: {
      state: "COMPLETED",
      passedTests: 1,
      totalTests: 4,
    },
    failedVisibleTests: [
      {
        position: 2,
        input: "(]",
        expectedOutput: "false",
        actualOutput: "true",
      },
    ],
    runSummary: {
      totalRuns: 2,
    },
    requestedLevel,
    contextHash: "hash-12345",
    ...overrides,
  };
}

describe("Socratic Hint Generator", () => {
  it("generates Level 1 conceptual nudge without code blocks", async () => {
    const ctx = mockContext(1);
    const hint = await generateSocraticHint(ctx);

    expect(hint.level).toBe(1);
    expect(hint.hintText.length).toBeGreaterThan(20);
    expect(hint.nextQuestion).toBeDefined();
    expect(hint.hintText).not.toContain("```");
    expect(hint.hintText).not.toContain("return");
  });

  it("generates Level 2 diagnostic / boundary hint tailored to failed tests", async () => {
    const ctx = mockContext(2);
    const hint = await generateSocraticHint(ctx);

    expect(hint.level).toBe(2);
    expect(hint.category).toBe("boundary-condition");
    expect(hint.hintText).toContain("Test Case #2");
    expect(hint.nextQuestion).toBeDefined();
  });

  it("generates Level 3 structural scaffold with numbered invariants", async () => {
    const ctx = mockContext(3);
    const hint = await generateSocraticHint(ctx);

    expect(hint.level).toBe(3);
    expect(hint.category).toBe("structural");
    expect(hint.hintText).toContain("1.");
    expect(hint.hintText).toContain("2.");
    expect(hint.hintText).toContain("stack");
  });
});
