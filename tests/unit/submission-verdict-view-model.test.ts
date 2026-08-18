import { describe, expect, it } from "vitest";
import type { PersistedSubmission, StudentWorkspace } from "@/server/attempts/service";
import { createStudentSubmissionVerdictViewModel } from "@/features/workspace/submission-verdict-view-model";

const visibleTests: StudentWorkspace["task"]["tests"] = [
  { id: "visible-1", position: 1, input: "2 3", expectedOutput: "5" },
];

function submission(
  resultOverrides: Partial<PersistedSubmission["result"]> = {},
): PersistedSubmission {
  return {
    id: "submission-1",
    attemptNumber: 2,
    submittedAt: "2026-08-12T10:00:00.000Z",
    result: {
      executionMode: "simulated",
      id: "run-1",
      resultSnapshotId: "snapshot-1",
      state: "completed",
      passedTests: 2,
      totalTests: 2,
      testResults: [{ testId: "visible-1", passed: true, actualOutput: "5" }],
      visiblePassedTests: 1,
      visibleTotalTests: 1,
      hiddenPassedTests: 1,
      hiddenTotalTests: 1,
      suggestedScore: 10,
      completedAt: "2026-08-12T10:00:00.000Z",
      ...resultOverrides,
    },
  };
}

describe("student submission verdict view model", () => {
  it("keeps visible, private, automated, and review concepts separate", () => {
    const verdict = createStudentSubmissionVerdictViewModel(submission(), visibleTests);
    expect(verdict).toMatchObject({
      visibleSummary: "1 / 1 passed",
      privateSummary: "1 / 1 passed",
      automatedScore: "10.0 / 10",
      reviewStatus: "Teacher review pending",
    });
    expect(verdict.result.title).toBe("All visible tests passed");
    expect(verdict.result.tests).toHaveLength(1);
  });

  it("does not create private-test detail from aggregate counters", () => {
    const verdict = createStudentSubmissionVerdictViewModel(
      submission({ hiddenPassedTests: 0, hiddenTotalTests: 2, suggestedScore: 3.3 }),
      visibleTests,
    );
    expect(verdict.privateSummary).toBe("0 / 2 passed");
    expect(verdict.automatedScore).toBe("3.3 / 10");
    expect(JSON.stringify(verdict.result.tests)).not.toContain("hidden");
  });

  it("does not invent a pass or automated score when no tests are configured", () => {
    const verdict = createStudentSubmissionVerdictViewModel(
      submission({
        passedTests: 0,
        totalTests: 0,
        visiblePassedTests: 0,
        visibleTotalTests: 0,
        hiddenPassedTests: 0,
        hiddenTotalTests: 0,
        suggestedScore: 0,
        testResults: [],
      }),
      [],
    );
    expect(verdict.visibleSummary).toBe("Not configured");
    expect(verdict.automatedScore).toBeUndefined();
    expect(verdict.result.title).toBe("Run completed");
  });

  it.each([
    ["compilation_error", "Compilation failed"],
    ["runtime_error", "Runtime error"],
    ["time_limit_exceeded", "Execution timed out"],
  ] as const)("preserves the %s execution verdict", (state, title) => {
    const verdict = createStudentSubmissionVerdictViewModel(
      submission({ state, passedTests: 0, visiblePassedTests: 0, hiddenPassedTests: 0, testResults: [] }),
      visibleTests,
    );
    expect(verdict.result.title).toBe(title);
  });

  it("distinguishes an unavailable result from an unrecorded submission", () => {
    const verdict = createStudentSubmissionVerdictViewModel(
      submission({ state: "internal_error", passedTests: 0, visiblePassedTests: 0, hiddenPassedTests: 0, testResults: [] }),
      visibleTests,
    );
    expect(verdict.result.title).toBe("Result unavailable");
    expect(verdict.result.detail).toContain("submission was recorded");
  });
});
