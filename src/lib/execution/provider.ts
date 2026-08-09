import type { ExecutionState, Language } from "@/domain/tasks/models";

export interface ExecutionRequest {
  language: Language;
  sourceCode: string;
  tests: Array<{ id: string; input: string; expectedOutput: string }>;
}
export interface ExecutionTestResult {
  testId: string;
  passed: boolean;
  actualOutput: string;
}
export interface ExecutionResult {
  state: ExecutionState;
  passedTests: number;
  totalTests: number;
  errorText?: string;
  testResults: ExecutionTestResult[];
}
export interface ExecutionProvider {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
