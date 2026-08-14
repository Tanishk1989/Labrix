import { describe, expect, it, vi } from "vitest";
import { FakeAIClassSummaryProvider } from "@/server/ai/fake-class-summary-provider";
import {
  AIClassSummaryProviderError,
  type AIClassSummaryProvider,
} from "@/server/ai/class-summary-provider";

vi.mock("server-only", () => ({}));

import {
  buildAIClassSummaryInput,
  generateTeacherAIClassSummary,
} from "@/server/ai/class-summary-service";

function analytics() {
  return {
    classroom: { id: "private-classroom-id" },
    task: {
      id: "task-1",
      title: "Pair sum",
      instructions: "Return two indexes whose values add to the target.",
    },
    activeStudentCount: 3,
    submittedStudentCount: 2,
    pendingStudentCount: 1,
    averageSuggestedScore: 7.5,
    visibleTests: { passed: 4, total: 4, passRate: 100 },
    hiddenTests: { passed: 2, total: 4, passRate: 50 },
    reviewedCount: 1,
    needsReviewCount: 1,
    reviewStatusCounts: { published: 1, draft: 1, unreviewed: 0 },
    integritySignalCounts: {
      LOW_ATTENTION: 1,
      REVIEW_RECOMMENDED: 0,
      HIGH_REVIEW_PRIORITY: 1,
    },
    anonymizedAttemptStatistics: {
      latestAttemptNumberAverage: 1.5,
      resubmittedStudentCount: 1,
    },
    topVerifiedPerformers: [
      {
        student: {
          id: "student-secret-1",
          name: "Private Asha",
          email: "asha@example.test",
        },
        submissionId: "submission-1",
        attemptNumber: 2,
        suggestedScore: 9,
      },
    ],
    attention: [
      {
        student: {
          id: "student-secret-2",
          name: "Private Bharat",
          email: "bharat@example.test",
        },
        submissionId: "submission-2",
        attemptNumber: 1,
        suggestedScore: 6,
        reasons: ["HIGH_REVIEW_PRIORITY" as const],
      },
      {
        student: {
          id: "student-secret-3",
          name: "Private Chitra",
          email: "chitra@example.test",
        },
        submissionId: null,
        attemptNumber: null,
        suggestedScore: null,
        reasons: ["NO_SUBMISSION" as const],
      },
    ],
  } as Parameters<typeof buildAIClassSummaryInput>[0];
}

describe("AI class summary v1", () => {
  it("builds an anonymous aggregate-only provider input", () => {
    const input = buildAIClassSummaryInput(analytics());
    const serialized = JSON.stringify(input);

    expect(input.deterministicGroups).toMatchObject({
      topVerifiedPerformerCount: 1,
      needsAttentionCount: 2,
    });
    expect(serialized).not.toContain("student-secret");
    expect(serialized).not.toContain("Private Asha");
    expect(serialized).not.toContain("example.test");
    expect(serialized).not.toContain("private-classroom-id");
    expect(serialized).not.toContain("submission-1");
    expect(serialized).not.toContain("sourceCode");
    expect(serialized).not.toContain("testId");
    expect(serialized).not.toContain("teacherFeedback");
  });

  it("generates every section with the deterministic fake provider", async () => {
    const output = await new FakeAIClassSummaryProvider().generateSummary(
      buildAIClassSummaryInput(analytics()),
    );

    expect(output).toMatchObject({ schemaVersion: 1 });
    expect(output.classPerformanceSummary).toContain("2 of 3");
    expect(output.commonMistakesOrLikelyMisconceptions).toHaveLength(1);
    expect(output.topicsToReteach).toHaveLength(1);
    expect(output.suggestedVivaFocusAreas).toHaveLength(1);
    expect(output.reviewPriorityGuidance[0]).toContain("not a misconduct");
    expect(output.professorTeachingPlan).toBeTruthy();
    expect(JSON.stringify(output).toLowerCase()).not.toContain("worst student");
    expect(JSON.stringify(output).toLowerCase()).not.toContain("cheating");
  });

  it("keeps names outside provider input and returns transient provenance", async () => {
    const provider: AIClassSummaryProvider = {
      descriptor: { provider: "stub", model: "stub-v1" },
      generateSummary: vi.fn(async (input) => {
        expect(JSON.stringify(input)).not.toContain("Private Asha");
        return new FakeAIClassSummaryProvider().generateSummary(input);
      }),
    };
    const loadAnalytics = vi.fn(async () => analytics());

    const result = await generateTeacherAIClassSummary({
      teacherId: "teacher-1",
      classroomId: "classroom-1",
      taskId: "task-1",
      provider,
      loadAnalytics,
      now: () => new Date("2026-08-14T10:00:00.000Z"),
      generationId: () => "generation-1",
    });

    expect(loadAnalytics).toHaveBeenCalledWith(
      "teacher-1",
      "classroom-1",
      "task-1",
    );
    expect(result.deterministicGroups.topVerifiedPerformers[0]?.name).toBe(
      "Private Asha",
    );
    expect(result.summary.provenance).toEqual({
      provider: "stub",
      model: "stub-v1",
      promptVersion: "ai-class-summary-v1",
      generatedAt: "2026-08-14T10:00:00.000Z",
      generationId: "generation-1",
      persisted: false,
    });
  });

  it("rejects invalid provider output through the Zod contract", async () => {
    const provider: AIClassSummaryProvider = {
      descriptor: { provider: "broken", model: "broken-v1" },
      generateSummary: vi.fn(async () => ({ schemaVersion: 1 })),
    };

    await expect(
      generateTeacherAIClassSummary({
        teacherId: "teacher-1",
        classroomId: "classroom-1",
        taskId: "task-1",
        provider,
        loadAnalytics: async () => analytics(),
      }),
    ).rejects.toBeInstanceOf(AIClassSummaryProviderError);
  });

  it("does not call a provider when the owner-scoped analytics loader denies access", async () => {
    const provider: AIClassSummaryProvider = {
      descriptor: { provider: "stub", model: "stub-v1" },
      generateSummary: vi.fn(),
    };

    await expect(
      generateTeacherAIClassSummary({
        teacherId: "other-teacher",
        classroomId: "classroom-1",
        taskId: "task-1",
        provider,
        loadAnalytics: async () => {
          throw new Error("Access denied");
        },
      }),
    ).rejects.toThrow("Access denied");
    expect(provider.generateSummary).not.toHaveBeenCalled();
  });
});
