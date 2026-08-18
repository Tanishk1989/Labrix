import crypto from "crypto";
import type { AllowedLanguage, RunResultState } from "@prisma/client";

export interface VisibleTestFailure {
  position: number;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
}

export interface HintContext {
  task: {
    id: string;
    title: string;
    instructions: string;
    constraints: string | null;
  };
  language: AllowedLanguage;
  currentSourceCode: string;
  latestRun?: {
    state: RunResultState;
    errorText?: string;
    passedTests: number;
    totalTests: number;
  };
  failedVisibleTests: VisibleTestFailure[];
  runSummary: {
    totalRuns: number;
  };
  requestedLevel: number; // 1, 2, or 3
  contextHash: string;
}

/**
 * Builds a structured, secure HintContext strictly containing visible information.
 * Never exposes hidden test case inputs or evaluation keys.
 */
export function buildHintContext(input: {
  task: {
    id: string;
    title: string;
    instructions: string;
    constraints: string | null;
  };
  language: AllowedLanguage;
  currentSourceCode: string;
  latestRun?: {
    state: RunResultState;
    errorText?: string | null;
    passedTests: number;
    totalTests: number;
    testResults?: unknown;
  };
  visibleTests: Array<{
    id: string;
    position: number;
    input: string;
    expectedOutput: string;
  }>;
  totalRuns: number;
  requestedLevel: number;
}): HintContext {
  const failedVisibleTests: VisibleTestFailure[] = [];

  // Parse visible test results if available
  if (input.latestRun && Array.isArray(input.latestRun.testResults)) {
    const rawResults = input.latestRun.testResults as Array<{
      position: number;
      passed: boolean;
      actualOutput?: string;
    }>;

    for (const vt of input.visibleTests) {
      const runOutcome = rawResults.find((r) => r.position === vt.position);
      if (runOutcome && !runOutcome.passed) {
        failedVisibleTests.push({
          position: vt.position,
          input: vt.input,
          expectedOutput: vt.expectedOutput,
          actualOutput: runOutcome.actualOutput,
        });
      }
    }
  }

  // Generate deterministic SHA-256 hash of context for audit trace
  const hashPayload = `${input.task.id}:${input.language}:${input.requestedLevel}:${input.currentSourceCode}:${input.latestRun?.state ?? "NO_RUN"}`;
  const contextHash = crypto.createHash("sha256").update(hashPayload).digest("hex").slice(0, 16);

  return {
    task: input.task,
    language: input.language,
    currentSourceCode: input.currentSourceCode,
    latestRun: input.latestRun ? {
      state: input.latestRun.state,
      errorText: input.latestRun.errorText ?? undefined,
      passedTests: input.latestRun.passedTests,
      totalTests: input.latestRun.totalTests,
    } : undefined,
    failedVisibleTests,
    runSummary: {
      totalRuns: input.totalRuns,
    },
    requestedLevel: input.requestedLevel,
    contextHash,
  };
}
