export const LIVE_PULSE_RECENT_ACTIVITY_MS = 5 * 60 * 1000;
export const LIVE_PULSE_RECENT_SUBMISSION_MS = 10 * 60 * 1000;
export const LIVE_PULSE_ATTENTION_WINDOW_MS = 30 * 60 * 1000;

export type LiveLabPulseStatus =
  | "RUNNING_TESTS"
  | "CODING_NOW"
  | "RECENTLY_SUBMITTED"
  | "NEEDS_ATTENTION"
  | "INACTIVE";

export type LiveLabPulseSignal = {
  hasActiveSession: boolean;
  hasActiveExecution: boolean;
  lastActivityAt: Date | null;
  latestSubmissionAt: Date | null;
  consecutiveFailedRuns: number;
};

function occurredWithin(value: Date | null, now: Date, windowMs: number) {
  if (!value) return false;
  const age = now.getTime() - value.getTime();
  return age >= 0 && age <= windowMs;
}

export function classifyLiveLabPulseStudent(
  signal: LiveLabPulseSignal,
  now = new Date(),
): { status: LiveLabPulseStatus; reason: string } {
  if (signal.hasActiveExecution) {
    return { status: "RUNNING_TESTS", reason: "A test run is queued or executing." };
  }
  if (occurredWithin(signal.latestSubmissionAt, now, LIVE_PULSE_RECENT_SUBMISSION_MS)) {
    return { status: "RECENTLY_SUBMITTED", reason: "Submitted within the last 10 minutes." };
  }
  if (
    signal.consecutiveFailedRuns >= 2 &&
    occurredWithin(signal.lastActivityAt, now, LIVE_PULSE_ATTENTION_WINDOW_MS)
  ) {
    return {
      status: "NEEDS_ATTENTION",
      reason: `${signal.consecutiveFailedRuns} consecutive test runs need correction.`,
    };
  }
  if (
    signal.hasActiveSession &&
    occurredWithin(signal.lastActivityAt, now, LIVE_PULSE_RECENT_ACTIVITY_MS)
  ) {
    return { status: "CODING_NOW", reason: "Code was saved or updated within the last 5 minutes." };
  }
  return {
    status: "INACTIVE",
    reason: signal.lastActivityAt
      ? "No coding activity in the last 5 minutes."
      : "No practical activity recorded yet.",
  };
}

export function consecutiveFailedRunCount(
  runs: Array<{
    state: string | null;
    visiblePassedTests: number | null;
    visibleTotalTests: number | null;
  }>,
) {
  let count = 0;
  for (const run of runs) {
    if (run.state === null) continue;
    const passed = run.state === "COMPLETED" && (
      (run.visibleTotalTests ?? 0) === 0 ||
      run.visiblePassedTests === run.visibleTotalTests
    );
    if (passed) break;
    count += 1;
  }
  return count;
}

export const liveLabPulseStatusOrder: LiveLabPulseStatus[] = [
  "RUNNING_TESTS",
  "CODING_NOW",
  "RECENTLY_SUBMITTED",
  "NEEDS_ATTENTION",
  "INACTIVE",
];
