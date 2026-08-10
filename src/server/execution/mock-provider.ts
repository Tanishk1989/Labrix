import type {
  ServerExecutionProvider,
  ServerExecutionRequest,
  ServerExecutionResult,
} from "./provider";

/** Deterministic simulation. It never compiles or executes student source. */
export class ServerMockExecutionProvider implements ServerExecutionProvider {
  constructor(private readonly delayMs = 75) {}

  async execute(
    request: ServerExecutionRequest,
  ): Promise<ServerExecutionResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const code = request.sourceCode.toLowerCase();
    if (code.includes("compile_error")) {
      return {
        state: "compilation_error",
        passedTests: 0,
        totalTests: request.tests.length,
        errorText: "Simulated compiler feedback: syntax error near line 1.",
        testResults: [],
      };
    }
    if (code.includes("runtime_error")) {
      return {
        state: "runtime_error",
        passedTests: 0,
        totalTests: request.tests.length,
        errorText: "Simulated runner feedback: program exited unexpectedly.",
        testResults: [],
      };
    }

    const shouldFail = code.includes("fail_test");
    const testResults = request.tests.map((test, index) => ({
      testId: test.id,
      passed: !shouldFail || index === 0,
      actualOutput:
        !shouldFail || index === 0 ? test.expectedOutput : "0",
      visibility: test.visibility,
    }));

    return {
      state: "completed",
      passedTests: testResults.filter((test) => test.passed).length,
      totalTests: testResults.length,
      testResults,
    };
  }
}
