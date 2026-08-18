import type { PersistedRun, StudentWorkspace } from "@/server/attempts/service";

export type RunOutcomeTone = "success" | "danger" | "neutral";

export interface VisibleRunTestResult {
  id: string;
  label: string;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput: string;
}

export interface StudentRunResultViewModel {
  title: string;
  detail: string;
  tone: RunOutcomeTone;
  diagnosticLabel?: string;
  diagnostic?: string;
  tests: VisibleRunTestResult[];
}

export type RunPanelState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "request_error"; message: string }
  | { kind: "result"; result: StudentRunResultViewModel };

type VisibleWorkspaceTest = StudentWorkspace["task"]["tests"][number];

function completedOutcome(run: PersistedRun) {
  const failedTests = run.visibleTotalTests - run.visiblePassedTests;
  if (run.visibleTotalTests === 0) {
    return {
      title: "Run completed",
      detail: "No visible tests were configured for this run.",
      tone: "neutral" as const,
    };
  }
  if (failedTests === 0) {
    return {
      title: "All visible tests passed",
      detail: `${run.visiblePassedTests} / ${run.visibleTotalTests} passed`,
      tone: "success" as const,
    };
  }
  return {
    title: `${failedTests} visible ${failedTests === 1 ? "test" : "tests"} failed`,
    detail: `${run.visiblePassedTests} of ${run.visibleTotalTests} visible tests passed`,
    tone: "danger" as const,
  };
}

function executionOutcome(run: PersistedRun) {
  if (run.state === "completed") return completedOutcome(run);
  if (run.state === "compilation_error") {
    return {
      title: "Compilation failed",
      detail: "Your code did not compile.",
      tone: "danger" as const,
      diagnosticLabel: "Compiler diagnostics",
    };
  }
  if (run.state === "runtime_error") {
    return {
      title: "Runtime error",
      detail: "Your program compiled but stopped during execution.",
      tone: "danger" as const,
      diagnosticLabel: "Runtime diagnostics",
    };
  }
  if (run.state === "time_limit_exceeded") {
    return {
      title: "Execution timed out",
      detail: "Your program exceeded the execution time limit.",
      tone: "danger" as const,
      diagnosticLabel: "Execution details",
    };
  }
  return {
    title: "Run unavailable",
    detail: "TRACE could not complete this run.",
    tone: "neutral" as const,
    diagnosticLabel: "Run details",
  };
}

export function createStudentRunResultViewModel(
  run: PersistedRun,
  visibleTests: VisibleWorkspaceTest[],
): StudentRunResultViewModel {
  const testById = new Map(visibleTests.map((test) => [test.id, test]));
  const outcome = executionOutcome(run);
  return {
    ...outcome,
    diagnostic: run.errorText,
    tests: run.testResults.map((testResult, index) => {
      const test = testById.get(testResult.testId);
      return {
        id: testResult.testId,
        label: `Test ${test?.position ?? index + 1}`,
        passed: testResult.passed,
        input: test?.input,
        expectedOutput: test?.expectedOutput,
        actualOutput: testResult.actualOutput,
      };
    }),
  };
}

export function createRunPanelState(input: {
  running: boolean;
  failure?: string;
  run?: PersistedRun;
  visibleTests: VisibleWorkspaceTest[];
}): RunPanelState {
  if (input.running) return { kind: "running" };
  if (input.failure) return { kind: "request_error", message: input.failure };
  if (!input.run) return { kind: "idle" };
  return {
    kind: "result",
    result: createStudentRunResultViewModel(input.run, input.visibleTests),
  };
}
