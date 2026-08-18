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
