import type { AllowedLanguage } from "@prisma/client";

export type ServerExecutionState =
  | "completed"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "internal_error";

export type TestVisibility = "VISIBLE" | "HIDDEN";

export interface ServerExecutionRequest {
  language: AllowedLanguage;
  sourceCode: string;
  tests: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    visibility: TestVisibility;
  }>;
}

export interface ServerExecutionTestResult {
  testId: string;
  passed: boolean;
  actualOutput: string;
  visibility: TestVisibility;
}

export interface ServerExecutionResult {
  state: ServerExecutionState;
  passedTests: number;
  totalTests: number;
  errorText?: string;
  testResults: ServerExecutionTestResult[];
}

/** Implementations run only behind a server-owned application boundary. */
export interface ServerExecutionProvider {
  execute(request: ServerExecutionRequest): Promise<ServerExecutionResult>;
}
