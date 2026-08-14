import { describe, expect, it } from "vitest";
import {
  buildIntegrityReviewSignal,
  integrityReviewThresholds,
} from "@/domain/evidence/integrity-review-signals";
import type {
  EvidenceFact,
  SubmissionEvidenceFactsV1,
} from "@/domain/evidence/submission-evidence";

function available<T>(value: T): EvidenceFact<T> {
  return { availability: "AVAILABLE", value, explanation: "Test fact." };
}

function unavailable<T>(): EvidenceFact<T> {
  return {
    availability: "UNAVAILABLE",
    value: null,
    explanation: "Legacy fact unavailable.",
  };
}

function baseFacts(): SubmissionEvidenceFactsV1 {
  return {
    schemaVersion: 1,
    runCount: available(2),
    tests: {
      overall: available({ passed: 4, total: 4 }),
      visible: available({ passed: 2, total: 2 }),
      hidden: available({ passed: 2, total: 2 }),
    },
    suggestedScore: available(10),
    timingStatus: available("ON_TIME"),
    practicalVersion: available(1),
    executionMode: available("SIMULATED"),
    sessionToSubmissionMs: available(
      integrityReviewThresholds.veryShortSessionMs,
    ),
    timeToFirstRunMs: available(60_000),
    submissionMatchesLatestSuccessfulRun: available(true),
    draftSavedAfterLatestSuccessfulRun: available(false),
    largeSourceSizeJumps: unavailable(),
    eventCounts: {
      SESSION_STARTED: 1,
      DRAFT_SAVED: 0,
      RUN_REQUESTED: 2,
      RUN_COMPLETED: 2,
      SUBMISSION_CREATED: 1,
    },
  };
}

describe("integrity review signals", () => {
  it("returns low attention when no configured reason applies", () => {
    const signal = buildIntegrityReviewSignal(baseFacts());

    expect(signal).toEqual({
      schemaVersion: 1,
      category: "LOW_ATTENTION",
      reasons: [],
      thresholds: integrityReviewThresholds,
    });
  });

  it("recommends review just below the very-short-session boundary", () => {
    const facts = baseFacts();
    facts.sessionToSubmissionMs = available(
      integrityReviewThresholds.veryShortSessionMs - 1,
    );

    const signal = buildIntegrityReviewSignal(facts);

    expect(signal.category).toBe("REVIEW_RECOMMENDED");
    expect(signal.reasons).toEqual([
      {
        code: "VERY_SHORT_SESSION",
        text: "The submission was created less than 5 minutes after the coding session started.",
      },
    ]);
  });

  it("does not flag a session exactly at the short-session boundary", () => {
    const signal = buildIntegrityReviewSignal(baseFacts());

    expect(signal.reasons).not.toContainEqual(
      expect.objectContaining({ code: "VERY_SHORT_SESSION" }),
    );
  });

  it("uses the inclusive high-score boundary only with hidden failures", () => {
    const below = baseFacts();
    below.suggestedScore = available(
      integrityReviewThresholds.highSuggestedScore - 0.1,
    );
    below.tests.hidden = available({ passed: 1, total: 2 });
    expect(buildIntegrityReviewSignal(below).category).toBe("LOW_ATTENTION");

    const atBoundary = baseFacts();
    atBoundary.suggestedScore = available(
      integrityReviewThresholds.highSuggestedScore,
    );
    atBoundary.tests.hidden = available({ passed: 1, total: 2 });
    const signal = buildIntegrityReviewSignal(atBoundary);

    expect(signal.category).toBe("REVIEW_RECOMMENDED");
    expect(signal.reasons).toEqual([
      {
        code: "HIGH_SCORE_WITH_HIDDEN_FAILURES",
        text: "The stored suggested score is at least 8.0/10, while one or more hidden tests did not pass.",
      },
    ]);
  });

  it("assigns high review priority when at least two reasons apply", () => {
    const facts = baseFacts();
    facts.submissionMatchesLatestSuccessfulRun = available(false);
    facts.draftSavedAfterLatestSuccessfulRun = available(true);

    const signal = buildIntegrityReviewSignal(facts);

    expect(signal.category).toBe("HIGH_REVIEW_PRIORITY");
    expect(signal.reasons).toEqual([
      expect.objectContaining({
        code: "SUBMISSION_DIFFERS_FROM_SUCCESSFUL_RUN",
      }),
      expect.objectContaining({
        code: "DRAFT_SAVED_AFTER_SUCCESSFUL_RUN",
      }),
    ]);
  });

  it("explains when only the submission evaluation was recorded", () => {
    const facts = baseFacts();
    facts.runCount = available(1);

    const signal = buildIntegrityReviewSignal(facts);

    expect(signal.category).toBe("REVIEW_RECOMMENDED");
    expect(signal.reasons).toEqual([
      {
        code: "NO_RUN_BEFORE_SUBMISSION",
        text: "No run was recorded before the submission evaluation.",
      },
    ]);
  });

  it("does not turn unavailable legacy or unsupported facts into reasons", () => {
    const facts = baseFacts();
    facts.suggestedScore = unavailable();
    facts.tests.hidden = unavailable();
    facts.sessionToSubmissionMs = unavailable();
    facts.submissionMatchesLatestSuccessfulRun = unavailable();
    facts.draftSavedAfterLatestSuccessfulRun = unavailable();
    facts.largeSourceSizeJumps = unavailable();

    const signal = buildIntegrityReviewSignal(facts);

    expect(signal.category).toBe("LOW_ATTENTION");
    expect(signal.reasons).toEqual([]);
  });
});
