import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIClassSummaryProviderRateLimitError } from "@/server/ai/class-summary-provider";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  resolveCurrentActor: vi.fn(),
  generateTeacherAIClassSummary: vi.fn(),
}));

vi.mock("@/server/actors/current-actor", () => ({
  resolveCurrentActor: mocks.resolveCurrentActor,
  requireActorRole: (
    actor: { id: string; role: string },
    expectedRole: string,
  ) => {
    if (actor.role !== expectedRole) throw new Error("Role denied");
    return actor;
  },
}));

vi.mock("@/server/ai/class-summary-service", () => ({
  generateTeacherAIClassSummary: mocks.generateTeacherAIClassSummary,
}));

import { generateAIClassSummaryAction } from "@/features/classes/ai-class-summary-actions";

const result = {
  summary: {
    schemaVersion: 1 as const,
    classPerformanceSummary: "Summary",
    commonMistakesOrLikelyMisconceptions: ["Mistake"],
    topicsToReteach: ["Topic"],
    suggestedVivaFocusAreas: ["Focus"],
    reviewPriorityGuidance: ["Guidance"],
    topVerifiedPerformerCriteriaExplanation: "Criteria",
    needsAttentionCriteriaExplanation: "Criteria",
    professorTeachingPlan: "Plan",
    provenance: {
      provider: "fake",
      model: "deterministic-class-summary-v1",
      promptVersion: "ai-class-summary-v1" as const,
      generatedAt: "2026-08-14T10:00:00.000Z",
      generationId: "generation-1",
      persisted: false as const,
    },
  },
  deterministicGroups: {
    topVerifiedPerformers: [],
    needsAttention: [],
  },
};

describe("AI class summary server action", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes the server-resolved teacher to the owner-scoped service", async () => {
    mocks.resolveCurrentActor.mockResolvedValue({
      id: "teacher-1",
      role: "TEACHER",
    });
    mocks.generateTeacherAIClassSummary.mockResolvedValue(result);

    const state = await generateAIClassSummaryAction(
      "classroom-1",
      "task-1",
      {},
      new FormData(),
    );

    expect(mocks.generateTeacherAIClassSummary).toHaveBeenCalledWith({
      teacherId: "teacher-1",
      classroomId: "classroom-1",
      taskId: "task-1",
    });
    expect(state).toMatchObject({ ok: true, result });
  });

  it("does not generate or expose a result to a student", async () => {
    mocks.resolveCurrentActor.mockResolvedValue({
      id: "student-1",
      role: "STUDENT",
    });

    const state = await generateAIClassSummaryAction(
      "classroom-1",
      "task-1",
      {},
      new FormData(),
    );

    expect(mocks.generateTeacherAIClassSummary).not.toHaveBeenCalled();
    expect(state.ok).toBe(false);
    expect("result" in state).toBe(false);
  });

  it("returns safe provider and rate-limit errors", async () => {
    mocks.resolveCurrentActor.mockResolvedValue({
      id: "teacher-1",
      role: "TEACHER",
    });
    mocks.generateTeacherAIClassSummary.mockRejectedValueOnce(
      new AIClassSummaryProviderRateLimitError(),
    );
    await expect(
      generateAIClassSummaryAction(
        "classroom-1",
        "task-1",
        {},
        new FormData(),
      ),
    ).resolves.toEqual({
      ok: false,
      message: "AI provider rate limit reached. Please try again later.",
    });

    mocks.generateTeacherAIClassSummary.mockRejectedValueOnce(
      new Error("raw provider secret"),
    );
    const state = await generateAIClassSummaryAction(
      "classroom-1",
      "task-1",
      {},
      new FormData(),
    );
    expect(state.message).not.toContain("raw provider secret");
    expect("result" in state).toBe(false);
  });
});
