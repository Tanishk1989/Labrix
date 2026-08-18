import { describe, expect, it } from "vitest";
import type { PersistedRun, StudentWorkspace } from "@/server/attempts/service";
import {
  createRunPanelState,
  createStudentRunResultViewModel,
} from "@/features/workspace/run-result-view-model";

const visibleTests: StudentWorkspace["task"]["tests"] = [
  { id: "visible-1", position: 1, input: "2 3", expectedOutput: "5" },
  { id: "visible-2", position: 2, input: "4 6", expectedOutput: "10" },
];

function run(overrides: Partial<PersistedRun> = {}): PersistedRun {
  return {
    executionMode: "simulated",
    id: "run-1",
    resultSnapshotId: "snapshot-1",
    state: "completed",
    passedTests: 2,
    totalTests: 2,
    testResults: [
      { testId: "visible-1", passed: true, actualOutput: "5" },
      { testId: "visible-2", passed: true, actualOutput: "10" },
    ],
    visiblePassedTests: 2,
    visibleTotalTests: 2,
    hiddenPassedTests: 0,
    hiddenTotalTests: 0,
    suggestedScore: 10,
    completedAt: "2026-08-12T10:00:00.000Z",
    ...overrides,
  };
}

describe("student run result view model", () => {
  it("represents idle, pending, and request failure states", () => {
    expect(createRunPanelState({ running: false, visibleTests })).toEqual({ kind: "idle" });
    expect(createRunPanelState({ running: true, visibleTests })).toEqual({ kind: "running" });
    expect(createRunPanelState({ running: false, failure: "Try again.", visibleTests })).toEqual({
      kind: "request_error",
      message: "Try again.",
    });
  });

  it("presents successful visible tests and their actual output", () => {
    const result = createStudentRunResultViewModel(run(), visibleTests);
    expect(result).toMatchObject({
      title: "All visible tests passed",
      detail: "2 / 2 passed",
      tone: "success",
    });
    expect(result.tests[0]).toEqual({
      id: "visible-1",
      label: "Test 1",
      passed: true,
      input: "2 3",
      expectedOutput: "5",
      actualOutput: "5",
    });
  });

  it("makes a visible mismatch understandable without adding hidden detail", () => {
    const result = createStudentRunResultViewModel(
      run({
        passedTests: 1,
        visiblePassedTests: 1,
        testResults: [
          { testId: "visible-1", passed: true, actualOutput: "5" },
          { testId: "visible-2", passed: false, actualOutput: "9" },
        ],
      }),
      [...visibleTests, { id: "not-returned", position: 3, input: "private", expectedOutput: "private" }],
    );
    expect(result.title).toBe("1 visible test failed");
    expect(result.tests[1]).toMatchObject({ expectedOutput: "10", actualOutput: "9" });
    expect(JSON.stringify(result)).not.toContain("private");
  });

  it.each([
    ["compilation_error", "Compilation failed", "Compiler diagnostics"],
    ["runtime_error", "Runtime error", "Runtime diagnostics"],
    ["time_limit_exceeded", "Execution timed out", "Execution details"],
    ["internal_error", "Run unavailable", "Run details"],
  ] as const)("maps %s using the typed runner state", (state, title, diagnosticLabel) => {
    const result = createStudentRunResultViewModel(
      run({
        state,
        passedTests: 0,
        visiblePassedTests: 0,
        testResults: [],
        errorText: "Runner detail",
      }),
      visibleTests,
    );
    expect(result).toMatchObject({ title, diagnosticLabel, diagnostic: "Runner detail" });
  });
});
