import { describe, expect, it } from "vitest";
import {
  classifyLiveLabPulseStudent,
  consecutiveFailedRunCount,
} from "@/domain/classrooms/live-lab-pulse";

const now = new Date("2026-08-29T10:00:00.000Z");

function signal(overrides: Partial<Parameters<typeof classifyLiveLabPulseStudent>[0]> = {}) {
  return {
    hasActiveSession: true,
    hasActiveExecution: false,
    lastActivityAt: new Date("2026-08-29T09:58:00.000Z"),
    latestSubmissionAt: null,
    consecutiveFailedRuns: 0,
    ...overrides,
  };
}

describe("Live Lab Pulse classification", () => {
  it("prioritizes an executing test run over other recent signals", () => {
    expect(classifyLiveLabPulseStudent(signal({
      hasActiveExecution: true,
      latestSubmissionAt: new Date("2026-08-29T09:59:00.000Z"),
    }), now).status).toBe("RUNNING_TESTS");
  });

  it("surfaces a recent submission before ordinary coding activity", () => {
    expect(classifyLiveLabPulseStudent(signal({
      latestSubmissionAt: new Date("2026-08-29T09:55:00.000Z"),
    }), now).status).toBe("RECENTLY_SUBMITTED");
  });

  it("requires repeated failures before raising an attention signal", () => {
    expect(classifyLiveLabPulseStudent(signal({ consecutiveFailedRuns: 2 }), now)).toMatchObject({
      status: "NEEDS_ATTENTION",
      reason: "2 consecutive test runs need correction.",
    });
    expect(classifyLiveLabPulseStudent(signal({ consecutiveFailedRuns: 1 }), now).status).toBe("CODING_NOW");
  });

  it("marks recent active sessions as coding and older activity as inactive", () => {
    expect(classifyLiveLabPulseStudent(signal(), now).status).toBe("CODING_NOW");
    expect(classifyLiveLabPulseStudent(signal({
      lastActivityAt: new Date("2026-08-29T09:40:00.000Z"),
    }), now).status).toBe("INACTIVE");
    expect(classifyLiveLabPulseStudent(signal({
      hasActiveSession: false,
      lastActivityAt: null,
    }), now).status).toBe("INACTIVE");
  });
});

describe("Live Lab Pulse failure streak", () => {
  it("counts newest consecutive failures and stops at the first passing run", () => {
    expect(consecutiveFailedRunCount([
      { state: "COMPILATION_ERROR", visiblePassedTests: 0, visibleTotalTests: 2 },
      { state: "COMPLETED", visiblePassedTests: 1, visibleTotalTests: 2 },
      { state: "COMPLETED", visiblePassedTests: 2, visibleTotalTests: 2 },
      { state: "COMPILATION_ERROR", visiblePassedTests: 0, visibleTotalTests: 2 },
    ])).toBe(2);
  });

  it("treats a completed run with no visible tests as successful", () => {
    expect(consecutiveFailedRunCount([
      { state: "COMPLETED", visiblePassedTests: 0, visibleTotalTests: 0 },
    ])).toBe(0);
  });

  it("does not mistake an unfinished execution for a failed run", () => {
    expect(consecutiveFailedRunCount([
      { state: null, visiblePassedTests: null, visibleTotalTests: null },
      { state: "COMPILATION_ERROR", visiblePassedTests: 0, visibleTotalTests: 2 },
    ])).toBe(1);
  });
});
