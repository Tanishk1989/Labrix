import { describe, expect, it } from "vitest";
import type { StudentOverview } from "@/server/student/overview";
import { createStudentSubmissionHistoryViewModel } from "@/features/student/student-submissions-view-model";

function overview(submissions: StudentOverview["submissions"]): StudentOverview {
  return {
    classes: [],
    practicals: [],
    submissions,
    summary: { classCount: 0, practicalCount: 0, submittedPracticalCount: 0, completionPercentage: 0 },
  };
}

function attempt(overrides: Partial<StudentOverview["submissions"][number]> = {}): StudentOverview["submissions"][number] {
  return {
    id: "attempt-1",
    attemptNumber: 1,
    language: "CPP",
    submittedAt: "2026-08-10T10:00:00.000Z",
    state: "COMPLETED",
    passedTests: 2,
    totalTests: 3,
    visiblePassedTests: 1,
    visibleTotalTests: 2,
    feedbackAvailable: false,
    publishedMarks: null,
    practical: { id: "task-1", title: "Array sum" },
    classroom: { id: "class-1", name: "DSA Lab", subject: "DSA", section: "A" },
    ...overrides,
  };
}

describe("student submission history view model", () => {
  it("supports an empty history", () => {
    expect(createStudentSubmissionHistoryViewModel(overview([]))).toEqual([]);
  });

  it("keeps every immutable attempt and orders newest first deterministically", () => {
    const result = createStudentSubmissionHistoryViewModel(overview([
      attempt({ id: "older", attemptNumber: 1 }),
      attempt({ id: "newer", attemptNumber: 2, submittedAt: "2026-08-11T10:00:00.000Z" }),
      attempt({ id: "same-time", attemptNumber: 3, submittedAt: "2026-08-11T10:00:00.000Z" }),
    ]));
    expect(result.map((item) => item.id)).toEqual(["same-time", "newer", "older"]);
  });

  it("uses visible counters and only exposes published marks supplied by the DTO", () => {
    const [result] = createStudentSubmissionHistoryViewModel(overview([
      attempt({
        feedbackAvailable: true,
        publishedMarks: { awarded: 8, outOf: 10 },
      }),
    ]));
    expect(result.resultLabel).toBe("1 / 2 visible tests passed");
    expect(result.reviewLabel).toBe("Feedback available");
    expect(result.publishedMarks).toEqual({ awarded: 8, outOf: 10 });
    expect(result.detailHref).toBe("/submissions/attempt-1");
    expect(result.practicalHref).toBe("/practicals/task-1");
    expect(JSON.stringify(result)).not.toContain("suggestedScore");
  });

  it.each([
    ["COMPILATION_ERROR", "Compilation failed"],
    ["RUNTIME_ERROR", "Runtime error"],
    ["TIME_LIMIT_EXCEEDED", "Execution timed out"],
    ["INTERNAL_ERROR", "Result unavailable"],
  ] as const)("maps %s to student-facing copy", (state, expected) => {
    const [result] = createStudentSubmissionHistoryViewModel(overview([attempt({ state })]));
    expect(result.resultLabel).toBe(expected);
  });
});
