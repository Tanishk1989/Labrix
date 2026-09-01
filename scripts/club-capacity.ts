export type LoadSummary = {
  requests: number;
  failures: number;
  failureRate: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
};

export const CLUB_CAPACITY_GATES = {
  webFailureRate: 0.01,
  webP95Ms: 2_000,
  runnerFailures: 0,
  runnerP95Ms: 60_000,
  minimumExecutionCapacity: 8,
} as const;

export function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`Expected an integer between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

export function summarizeLoad(latencies: number[], failures: number): LoadSummary {
  const sorted = [...latencies].sort((left, right) => left - right);
  const percentile = (value: number) => {
    if (!sorted.length) return 0;
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))] ?? 0;
  };
  return {
    requests: sorted.length,
    failures,
    failureRate: sorted.length ? failures / sorted.length : 1,
    p50Ms: Math.round(percentile(0.5)),
    p95Ms: Math.round(percentile(0.95)),
    p99Ms: Math.round(percentile(0.99)),
  };
}

export function evaluateClubCapacity(input: {
  web: LoadSummary;
  runners: LoadSummary | null;
  executionCapacity: number | null;
  minimumExecutionCapacity?: number;
}) {
  const minimumExecutionCapacity = input.minimumExecutionCapacity
    ?? CLUB_CAPACITY_GATES.minimumExecutionCapacity;
  const failures: string[] = [];
  const blocked: string[] = [];

  if (input.web.failureRate > CLUB_CAPACITY_GATES.webFailureRate) {
    failures.push(`Web failure rate ${(input.web.failureRate * 100).toFixed(2)}% exceeds 1%.`);
  }
  if (input.web.p95Ms > CLUB_CAPACITY_GATES.webP95Ms) {
    failures.push(`Web p95 ${input.web.p95Ms}ms exceeds 2000ms.`);
  }
  if (!input.runners) {
    blocked.push("Runner burst was not executed; configure both runner URLs and the bearer token.");
  } else {
    if (input.runners.failures > CLUB_CAPACITY_GATES.runnerFailures) {
      failures.push(`${input.runners.failures} runner requests failed.`);
    }
    if (input.runners.p95Ms > CLUB_CAPACITY_GATES.runnerP95Ms) {
      failures.push(`Runner p95 ${input.runners.p95Ms}ms exceeds 60000ms.`);
    }
  }
  if (input.executionCapacity === null) {
    blocked.push("Execution-worker capacity was not available from authenticated diagnostics.");
  } else if (input.executionCapacity < minimumExecutionCapacity) {
    failures.push(
      `Execution-worker capacity ${input.executionCapacity} is below the club gate of ${minimumExecutionCapacity}.`,
    );
  }

  return {
    status: failures.length ? "FAILED" as const : blocked.length ? "BLOCKED" as const : "PASSED" as const,
    failures,
    blocked,
  };
}
