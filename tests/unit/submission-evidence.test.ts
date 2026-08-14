import { describe, expect, it } from "vitest";
import { buildSubmissionEvidenceFacts } from "@/domain/evidence/submission-evidence";

describe("submission evidence facts", () => {
  it("calculates reproducible facts from immutable submission records", () => {
    const facts = buildSubmissionEvidenceFacts({
      submission: {
        sourceCodeSnapshot: "final source",
        submittedAt: new Date("2026-08-14T10:05:00.000Z"),
        timingStatus: "ON_TIME",
        practicalVersion: 3,
        resultRunAttemptId: "submit-run",
      },
      result: {
        executionMode: "JAVA_DOCKER_LOCAL",
        passedTests: 3,
        totalTests: 4,
        visiblePassedTests: 2,
        visibleTotalTests: 2,
        hiddenPassedTests: 1,
        hiddenTotalTests: 2,
        suggestedScore: 7.5,
      },
      session: {
        startedAt: new Date("2026-08-14T10:00:00.000Z"),
        runs: [
          {
            id: "successful-run",
            sequence: 1,
            sourceCodeSnapshot: "earlier source",
            requestedAt: new Date("2026-08-14T10:01:00.000Z"),
            completedAt: new Date("2026-08-14T10:02:00.000Z"),
            resultSnapshot: {
              state: "COMPLETED",
              passedTests: 2,
              totalTests: 2,
            },
          },
          {
            id: "submit-run",
            sequence: 2,
            sourceCodeSnapshot: "final source",
            requestedAt: new Date("2026-08-14T10:04:00.000Z"),
            completedAt: new Date("2026-08-14T10:04:30.000Z"),
            resultSnapshot: {
              state: "COMPLETED",
              passedTests: 3,
              totalTests: 4,
            },
          },
        ],
        events: [
          {
            sequence: 1,
            type: "SESSION_STARTED",
            occurredAt: new Date("2026-08-14T10:00:00.000Z"),
          },
          {
            sequence: 2,
            type: "RUN_REQUESTED",
            occurredAt: new Date("2026-08-14T10:01:00.000Z"),
          },
          {
            sequence: 3,
            type: "RUN_COMPLETED",
            occurredAt: new Date("2026-08-14T10:02:00.000Z"),
          },
          {
            sequence: 4,
            type: "DRAFT_SAVED",
            occurredAt: new Date("2026-08-14T10:03:00.000Z"),
          },
          {
            sequence: 5,
            type: "RUN_REQUESTED",
            occurredAt: new Date("2026-08-14T10:04:00.000Z"),
          },
          {
            sequence: 6,
            type: "RUN_COMPLETED",
            occurredAt: new Date("2026-08-14T10:04:30.000Z"),
          },
          {
            sequence: 7,
            type: "SUBMISSION_CREATED",
            occurredAt: new Date("2026-08-14T10:05:00.000Z"),
          },
        ],
      },
    });

    expect(facts).toMatchObject({
      schemaVersion: 1,
      runCount: { availability: "AVAILABLE", value: 2 },
      tests: {
        overall: {
          availability: "AVAILABLE",
          value: { passed: 3, total: 4 },
        },
        visible: {
          availability: "AVAILABLE",
          value: { passed: 2, total: 2 },
        },
        hidden: {
          availability: "AVAILABLE",
          value: { passed: 1, total: 2 },
        },
      },
      suggestedScore: { availability: "AVAILABLE", value: 7.5 },
      timingStatus: { availability: "AVAILABLE", value: "ON_TIME" },
      practicalVersion: { availability: "AVAILABLE", value: 3 },
      executionMode: {
        availability: "AVAILABLE",
        value: "JAVA_DOCKER_LOCAL",
      },
      sessionToSubmissionMs: {
        availability: "AVAILABLE",
        value: 300_000,
      },
      timeToFirstRunMs: { availability: "AVAILABLE", value: 60_000 },
      submissionMatchesLatestSuccessfulRun: {
        availability: "AVAILABLE",
        value: false,
      },
      draftSavedAfterLatestSuccessfulRun: {
        availability: "AVAILABLE",
        value: true,
      },
      largeSourceSizeJumps: {
        availability: "UNAVAILABLE",
        value: null,
      },
      eventCounts: {
        SESSION_STARTED: 1,
        DRAFT_SAVED: 1,
        RUN_REQUESTED: 2,
        RUN_COMPLETED: 2,
        SUBMISSION_CREATED: 1,
      },
    });
  });

  it("uses explicit unavailable facts for legacy and missing records", () => {
    const facts = buildSubmissionEvidenceFacts({
      submission: {
        sourceCodeSnapshot: "legacy source",
        submittedAt: new Date("2026-08-14T11:05:00.000Z"),
        timingStatus: null,
        practicalVersion: null,
        resultRunAttemptId: "legacy-submit-run",
      },
      result: {
        executionMode: null,
        passedTests: 1,
        totalTests: 2,
        visiblePassedTests: null,
        visibleTotalTests: null,
        hiddenPassedTests: null,
        hiddenTotalTests: null,
        suggestedScore: null,
      },
      session: {
        startedAt: new Date("2026-08-14T11:00:00.000Z"),
        runs: [
          {
            id: "legacy-submit-run",
            sequence: 1,
            sourceCodeSnapshot: "legacy source",
            requestedAt: new Date("2026-08-14T11:04:00.000Z"),
            completedAt: new Date("2026-08-14T11:04:30.000Z"),
            resultSnapshot: {
              state: "COMPLETED",
              passedTests: 1,
              totalTests: 2,
            },
          },
        ],
        events: [],
      },
    });

    expect(facts.tests.overall).toMatchObject({
      availability: "AVAILABLE",
      value: { passed: 1, total: 2 },
    });
    expect(facts.tests.visible.availability).toBe("UNAVAILABLE");
    expect(facts.tests.hidden.availability).toBe("UNAVAILABLE");
    expect(facts.suggestedScore.availability).toBe("UNAVAILABLE");
    expect(facts.timingStatus.availability).toBe("UNAVAILABLE");
    expect(facts.practicalVersion.availability).toBe("UNAVAILABLE");
    expect(facts.executionMode.availability).toBe("UNAVAILABLE");
    expect(facts.submissionMatchesLatestSuccessfulRun.availability).toBe(
      "UNAVAILABLE",
    );
    expect(facts.draftSavedAfterLatestSuccessfulRun.availability).toBe(
      "UNAVAILABLE",
    );
    expect(facts.eventCounts).toEqual({
      SESSION_STARTED: 0,
      DRAFT_SAVED: 0,
      RUN_REQUESTED: 0,
      RUN_COMPLETED: 0,
      SUBMISSION_CREATED: 0,
    });
  });

  it("does not convert invalid chronology into a duration", () => {
    const facts = buildSubmissionEvidenceFacts({
      submission: {
        sourceCodeSnapshot: "source",
        submittedAt: new Date("2026-08-14T12:00:00.000Z"),
        timingStatus: "LATE",
        practicalVersion: 1,
        resultRunAttemptId: "submit-run",
      },
      result: {
        executionMode: "SIMULATED",
        passedTests: 0,
        totalTests: 1,
        visiblePassedTests: 0,
        visibleTotalTests: 1,
        hiddenPassedTests: 0,
        hiddenTotalTests: 0,
        suggestedScore: 0,
      },
      session: {
        startedAt: new Date("2026-08-14T12:01:00.000Z"),
        runs: [],
        events: [],
      },
    });

    expect(facts.sessionToSubmissionMs.availability).toBe("UNAVAILABLE");
    expect(facts.timeToFirstRunMs.availability).toBe("UNAVAILABLE");
  });
});
