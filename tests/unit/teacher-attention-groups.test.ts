import { describe, expect, it, vi } from "vitest";
import {
  buildPracticalAnalytics,
  TEACHER_ATTENTION_GROUP_LIMIT,
  type PracticalAnalyticsAttempt,
  type PracticalAnalyticsStudent,
} from "@/server/teacher/practical-analytics";

vi.mock("server-only", () => ({}));

function student(index: number): PracticalAnalyticsStudent {
  return {
    id: `student-${index}`,
    name: `Student ${String(index).padStart(2, "0")}`,
    email: `student-${index}@example.test`,
  };
}

function attempt(
  studentId: string,
  overrides: Partial<PracticalAnalyticsAttempt> = {},
): PracticalAnalyticsAttempt {
  return {
    id: `submission-${studentId}`,
    studentId,
    attemptNumber: 1,
    submittedAt: new Date("2026-08-14T10:00:00.000Z"),
    reviewStatus: "PUBLISHED",
    integrityCategory: "LOW_ATTENTION",
    result: {
      state: "COMPLETED",
      passedTests: 4,
      totalTests: 4,
      visiblePassedTests: 2,
      visibleTotalTests: 2,
      hiddenPassedTests: 2,
      hiddenTotalTests: 2,
      suggestedScore: 9,
    },
    ...overrides,
  };
}

describe("deterministic teacher attention groups", () => {
  it("excludes high review priority from top verified performers", () => {
    const learner = student(1);
    const analytics = buildPracticalAnalytics(
      [learner],
      [attempt(learner.id, { integrityCategory: "HIGH_REVIEW_PRIORITY" })],
    );

    expect(analytics.groups.topVerifiedPerformers.items).toHaveLength(0);
    expect(analytics.groups.needsAttention.items[0]).toMatchObject({
      student: { id: learner.id },
      reasons: ["HIGH_REVIEW_PRIORITY"],
    });
  });

  it("excludes a known hidden aggregate failure from top verified performers", () => {
    const learner = student(1);
    const analytics = buildPracticalAnalytics(
      [learner],
      [
        attempt(learner.id, {
          result: {
            state: "COMPLETED",
            passedTests: 3,
            totalTests: 4,
            visiblePassedTests: 2,
            visibleTotalTests: 2,
            hiddenPassedTests: 1,
            hiddenTotalTests: 2,
            suggestedScore: 9,
          },
        }),
      ],
    );

    expect(analytics.groups.topVerifiedPerformers.items).toHaveLength(0);
    expect(analytics.groups.needsAttention.items[0]).toMatchObject({
      hiddenAggregate: { availability: "AVAILABLE", passed: 1, total: 2 },
      reasons: ["FAILED_HIDDEN_TESTS"],
    });
  });

  it("places a student without a submission in needs attention with unavailable aggregates", () => {
    const learner = student(1);
    const analytics = buildPracticalAnalytics([learner], []);

    expect(analytics.groups.needsAttention.items[0]).toMatchObject({
      student: { id: learner.id },
      submissionId: null,
      attemptNumber: null,
      suggestedScore: null,
      hiddenAggregate: { availability: "UNAVAILABLE" },
      reviewStatus: "NOT_APPLICABLE",
      reasons: ["NO_SUBMISSION"],
    });
  });

  it("places a low suggested score in needs attention", () => {
    const learner = student(1);
    const analytics = buildPracticalAnalytics(
      [learner],
      [
        attempt(learner.id, {
          result: {
            state: "COMPLETED",
            passedTests: 1,
            totalTests: 4,
            visiblePassedTests: 1,
            visibleTotalTests: 2,
            hiddenPassedTests: 0,
            hiddenTotalTests: 2,
            suggestedScore: 4.9,
          },
        }),
      ],
    );

    expect(analytics.groups.needsAttention.items[0]?.reasons).toContain(
      "LOW_SUGGESTED_SCORE",
    );
  });

  it("limits each displayed group to five while retaining total counts", () => {
    const topStudents = Array.from({ length: 7 }, (_, index) => student(index));
    const topAnalytics = buildPracticalAnalytics(
      topStudents,
      topStudents.map((learner, index) =>
        attempt(learner.id, {
          attemptNumber: index + 1,
          result: {
            ...attempt(learner.id).result,
            suggestedScore: 8 + index / 10,
          },
        }),
      ),
    );
    const pendingStudents = Array.from({ length: 7 }, (_, index) =>
      student(index + 10),
    );
    const pendingAnalytics = buildPracticalAnalytics(pendingStudents, []);

    expect(TEACHER_ATTENTION_GROUP_LIMIT).toBe(5);
    expect(topAnalytics.groups.topVerifiedPerformers).toMatchObject({
      totalCount: 7,
    });
    expect(topAnalytics.groups.topVerifiedPerformers.items).toHaveLength(5);
    expect(topAnalytics.groups.topVerifiedPerformers.items[0]?.suggestedScore).toBe(
      8.6,
    );
    expect(pendingAnalytics.groups.needsAttention).toMatchObject({
      totalCount: 7,
    });
    expect(pendingAnalytics.groups.needsAttention.items).toHaveLength(5);
  });
});
