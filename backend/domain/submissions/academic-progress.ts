export type SubmissionResultState =
  | "COMPLETED"
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

export type SubmissionOutcome = {
  kind:
    | "PASSED_ALL_PROVIDED_TESTS"
    | "PROVIDED_TESTS_INCOMPLETE"
    | "NO_PROVIDED_TESTS"
    | "COMPILATION_ERROR"
    | "RUNTIME_ERROR"
    | "TIMEOUT"
    | "EXECUTION_UNAVAILABLE";
  label: string;
  passedAllProvidedTests: boolean;
};

export function describeSubmissionOutcome(input: {
  state: SubmissionResultState;
  passedTests: number;
  totalTests: number;
}): SubmissionOutcome {
  if (input.state === "COMPILATION_ERROR") {
    return { kind: "COMPILATION_ERROR", label: "Compilation error", passedAllProvidedTests: false };
  }
  if (input.state === "RUNTIME_ERROR") {
    return { kind: "RUNTIME_ERROR", label: "Runtime error", passedAllProvidedTests: false };
  }
  if (input.state === "TIME_LIMIT_EXCEEDED") {
    return { kind: "TIMEOUT", label: "Timed out", passedAllProvidedTests: false };
  }
  if (input.state === "INTERNAL_ERROR") {
    return { kind: "EXECUTION_UNAVAILABLE", label: "Execution unavailable", passedAllProvidedTests: false };
  }
  if (input.totalTests <= 0) {
    return { kind: "NO_PROVIDED_TESTS", label: "No provided tests", passedAllProvidedTests: false };
  }
  if (input.passedTests === input.totalTests) {
    return {
      kind: "PASSED_ALL_PROVIDED_TESTS",
      label: "Passed all provided tests",
      passedAllProvidedTests: true,
    };
  }
  return {
    kind: "PROVIDED_TESTS_INCOMPLETE",
    label: `${input.passedTests}/${input.totalTests} provided tests passed`,
    passedAllProvidedTests: false,
  };
}
