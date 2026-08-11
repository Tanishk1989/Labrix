import { describe, expect, it } from "vitest";
import {
  buildResultBreakdown,
  calculateSuggestedScore,
  snapshotBreakdown,
} from "@/server/execution/result-grading";

describe("suggested test grading", () => {
  it("uses equal test weight and rounds to one decimal out of ten", () => {
    expect(calculateSuggestedScore("completed", 5, 6)).toBe(8.3);
    expect(calculateSuggestedScore("completed", 3, 4)).toBe(7.5);
  });

  it.each([
    "compilation_error",
    "runtime_error",
    "time_limit_exceeded",
    "internal_error",
  ] as const)("scores %s as zero", (state) => {
    expect(calculateSuggestedScore(state, 3, 4)).toBe(0);
  });

  it("separates visible and hidden counters", () => {
    expect(
      buildResultBreakdown(
        {
          state: "completed",
          passedTests: 2,
          totalTests: 3,
          testResults: [
            { testId: "v1", passed: true, actualOutput: "1", visibility: "VISIBLE" },
            { testId: "h1", passed: true, actualOutput: "2", visibility: "HIDDEN" },
            { testId: "h2", passed: false, actualOutput: "0", visibility: "HIDDEN" },
          ],
        },
        [
          { visibility: "VISIBLE" },
          { visibility: "HIDDEN" },
          { visibility: "HIDDEN" },
        ],
      ),
    ).toEqual({
      visiblePassedTests: 1,
      visibleTotalTests: 1,
      hiddenPassedTests: 1,
      hiddenTotalTests: 2,
      suggestedScore: 6.7,
    });
  });

  it("reads a legacy snapshot as visible-only without requiring a backfill", () => {
    expect(
      snapshotBreakdown({
        state: "COMPLETED",
        passedTests: 1,
        totalTests: 2,
        visiblePassedTests: null,
        visibleTotalTests: null,
        hiddenPassedTests: null,
        hiddenTotalTests: null,
        suggestedScore: null,
      }),
    ).toEqual({
      visiblePassedTests: 1,
      visibleTotalTests: 2,
      hiddenPassedTests: 0,
      hiddenTotalTests: 0,
      suggestedScore: 5,
    });
  });
});
