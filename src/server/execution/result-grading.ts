import type { RunResultState } from "@prisma/client";
import type {
  ServerExecutionResult,
  ServerExecutionTestResult,
  TestVisibility,
} from "./provider";

export interface ResultBreakdown {
  visiblePassedTests: number;
  visibleTotalTests: number;
  hiddenPassedTests: number;
  hiddenTotalTests: number;
  suggestedScore: number;
}

export interface SnapshotBreakdownSource {
  state: RunResultState;
  passedTests: number;
  totalTests: number;
  visiblePassedTests: number | null;
  visibleTotalTests: number | null;
  hiddenPassedTests: number | null;
  hiddenTotalTests: number | null;
  suggestedScore: number | null;
}

function countByVisibility(
  testResults: ServerExecutionTestResult[],
  visibility: TestVisibility,
) {
  const matching = testResults.filter(
    (test) => test.visibility === visibility,
  );
  return {
    passed: matching.filter((test) => test.passed).length,
    total: matching.length,
  };
}

export function calculateSuggestedScore(
  state: ServerExecutionResult["state"],
  passedTests: number,
  totalTests: number,
) {
  if (state !== "completed" || totalTests <= 0) return 0;
  return Math.round((passedTests / totalTests) * 100) / 10;
}

export function snapshotBreakdown(
  snapshot: SnapshotBreakdownSource,
): ResultBreakdown {
  if (
    snapshot.visiblePassedTests !== null &&
    snapshot.visibleTotalTests !== null &&
    snapshot.hiddenPassedTests !== null &&
    snapshot.hiddenTotalTests !== null &&
    snapshot.suggestedScore !== null
  ) {
    return {
      visiblePassedTests: snapshot.visiblePassedTests,
      visibleTotalTests: snapshot.visibleTotalTests,
      hiddenPassedTests: snapshot.hiddenPassedTests,
      hiddenTotalTests: snapshot.hiddenTotalTests,
      suggestedScore: snapshot.suggestedScore,
    };
  }

  return {
    visiblePassedTests: snapshot.passedTests,
    visibleTotalTests: snapshot.totalTests,
    hiddenPassedTests: 0,
    hiddenTotalTests: 0,
    suggestedScore: calculateSuggestedScore(
      snapshot.state.toLowerCase() as ServerExecutionResult["state"],
      snapshot.passedTests,
      snapshot.totalTests,
    ),
  };
}

export function buildResultBreakdown(
  result: ServerExecutionResult,
  requestedTests: Array<{ visibility: TestVisibility }>,
): ResultBreakdown {
  const visibleResult = countByVisibility(result.testResults, "VISIBLE");
  const hiddenResult = countByVisibility(result.testResults, "HIDDEN");
  const visibleTotal = requestedTests.filter(
    (test) => test.visibility === "VISIBLE",
  ).length;
  const hiddenTotal = requestedTests.length - visibleTotal;

  return {
    visiblePassedTests:
      result.state === "completed" ? visibleResult.passed : 0,
    visibleTotalTests: visibleTotal,
    hiddenPassedTests:
      result.state === "completed" ? hiddenResult.passed : 0,
    hiddenTotalTests: hiddenTotal,
    suggestedScore: calculateSuggestedScore(
      result.state,
      result.passedTests,
      result.totalTests,
    ),
  };
}
