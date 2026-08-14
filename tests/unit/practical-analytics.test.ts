import { describe, expect, it, vi } from "vitest";
import {
  buildPracticalAnalytics,
  LOW_SUGGESTED_SCORE_THRESHOLD,
  type PracticalAnalyticsAttempt,
} from "@/server/teacher/practical-analytics";

vi.mock("server-only", () => ({}));

const students = [
  { id: "student-a", name: "Asha", email: "asha@example.test" },
  { id: "student-b", name: "Bharat", email: "bharat@example.test" },
  { id: "student-c", name: "Chitra", email: "chitra@example.test" },
];

function attempt(
  input: Partial<PracticalAnalyticsAttempt> &
    Pick<PracticalAnalyticsAttempt, "id" | "studentId">,
): PracticalAnalyticsAttempt {
  return {
    attemptNumber: 1,
    submittedAt: new Date("2026-08-11T10:00:00.000Z"),
    reviewStatus: null,
    integrityCategory: "LOW_ATTENTION",
    result: {
      state: "COMPLETED",
      passedTests: 3,
      totalTests: 4,
      visiblePassedTests: 2,
      visibleTotalTests: 2,
      hiddenPassedTests: 1,
      hiddenTotalTests: 2,
      suggestedScore: 7.5,
    },
    ...input,
  };
}

describe("practical analytics", () => {
  it("counts distinct latest submissions and calculates deterministic aggregates", () => {
    const analytics = buildPracticalAnalytics(students, [
      attempt({
        id: "old-a",
        studentId: "student-a",
        attemptNumber: 1,
        result: {
          state: "COMPLETED",
          passedTests: 0,
          totalTests: 4,
          visiblePassedTests: 0,
          visibleTotalTests: 2,
          hiddenPassedTests: 0,
          hiddenTotalTests: 2,
          suggestedScore: 0,
        },
      }),
      attempt({
        id: "latest-a",
        studentId: "student-a",
        attemptNumber: 2,
        reviewStatus: "PUBLISHED",
      }),
      attempt({
        id: "latest-b",
        studentId: "student-b",
        result: {
          state: "COMPLETED",
          passedTests: 1,
          totalTests: 2,
          visiblePassedTests: null,
          visibleTotalTests: null,
          hiddenPassedTests: null,
          hiddenTotalTests: null,
          suggestedScore: null,
        },
      }),
    ]);

    expect(analytics).toMatchObject({
      activeStudentCount: 3,
      submittedStudentCount: 2,
      pendingStudentCount: 1,
      averageSuggestedScore: 6.3,
      visibleTests: { passed: 3, total: 4, passRate: 75 },
      hiddenTests: { passed: 1, total: 2, passRate: 50 },
      reviewedCount: 1,
      needsReviewCount: 1,
    });
    expect(analytics.attention).toEqual([
      expect.objectContaining({
        student: expect.objectContaining({ id: "student-a" }),
        reasons: ["FAILED_HIDDEN_TESTS"],
      }),
      expect.objectContaining({
        student: expect.objectContaining({ id: "student-b" }),
        reasons: ["NEEDS_REVIEW"],
      }),
      expect.objectContaining({
        student: expect.objectContaining({ id: "student-c" }),
        reasons: ["NO_SUBMISSION"],
      }),
    ]);
  });

  it("selects deterministic groups and excludes high-priority integrity signals from top verified performers", () => {
    const analytics = buildPracticalAnalytics(students, [
      attempt({
        id: "verified-a",
        studentId: "student-a",
        reviewStatus: "PUBLISHED",
        result: {
          state: "COMPLETED",
          passedTests: 4,
          totalTests: 4,
          visiblePassedTests: 2,
          visibleTotalTests: 2,
          hiddenPassedTests: 2,
          hiddenTotalTests: 2,
          suggestedScore: 8,
        },
      }),
      attempt({
        id: "priority-b",
        studentId: "student-b",
        reviewStatus: "PUBLISHED",
        integrityCategory: "HIGH_REVIEW_PRIORITY",
        result: {
          state: "COMPLETED",
          passedTests: 4,
          totalTests: 4,
          visiblePassedTests: 2,
          visibleTotalTests: 2,
          hiddenPassedTests: 2,
          hiddenTotalTests: 2,
          suggestedScore: 10,
        },
      }),
    ]);

    expect(analytics.topVerifiedPerformers.map((item) => item.student.id)).toEqual([
      "student-a",
    ]);
    expect(analytics.attention).toEqual([
      expect.objectContaining({
        student: expect.objectContaining({ id: "student-b" }),
        reasons: ["HIGH_REVIEW_PRIORITY"],
      }),
      expect.objectContaining({
        student: expect.objectContaining({ id: "student-c" }),
        reasons: ["NO_SUBMISSION"],
      }),
    ]);
    expect(analytics.integritySignalCounts.HIGH_REVIEW_PRIORITY).toBe(1);
  });

  it("flags low scores below the fixed threshold and handles empty rates", () => {
    const analytics = buildPracticalAnalytics(
      students.slice(0, 1),
      [attempt({
        id: "failed",
        studentId: "student-a",
        result: {
          state: "COMPILATION_ERROR",
          passedTests: 0,
          totalTests: 0,
          visiblePassedTests: 0,
          visibleTotalTests: 0,
          hiddenPassedTests: 0,
          hiddenTotalTests: 0,
          suggestedScore: 0,
        },
      })],
    );

    expect(LOW_SUGGESTED_SCORE_THRESHOLD).toBe(5);
    expect(analytics.visibleTests.passRate).toBeNull();
    expect(analytics.hiddenTests.passRate).toBeNull();
    expect(analytics.attention[0]?.reasons).toEqual([
      "LOW_SUGGESTED_SCORE",
      "NEEDS_REVIEW",
    ]);
  });
});
