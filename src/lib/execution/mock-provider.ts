import type {
  ExecutionProvider,
  ExecutionRequest,
  ExecutionResult,
} from "./provider";

export class MockExecutionProvider implements ExecutionProvider {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const code = request.sourceCode.toLowerCase();
    if (code.includes("compile_error"))
      return {
        state: "compilation_error",
        passedTests: 0,
        totalTests: request.tests.length,
        errorText: "Mock compiler: syntax error near line 1.",
        testResults: [],
      };
    if (code.includes("runtime_error"))
      return {
        state: "runtime_error",
        passedTests: 0,
        totalTests: request.tests.length,
        errorText: "Mock runner: program exited unexpectedly.",
        testResults: [],
      };
    const fail = code.includes("fail_test");
    const testResults = request.tests.map((test, index) => ({
      testId: test.id,
      passed: !fail || index === 0,
      actualOutput: !fail || index === 0 ? test.expectedOutput : "0",
    }));
    return {
      state: "completed",
      passedTests: testResults.filter((test) => test.passed).length,
      totalTests: request.tests.length,
      testResults,
    };
  }
}
