import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIReviewBriefV1 } from "@/server/ai/review-brief-provider";

const mocks = vi.hoisted(() => ({
  resolveCurrentActor: vi.fn(),
  generateTeacherAIReviewBrief: vi.fn(),
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

vi.mock("@/server/ai/review-brief-service", () => ({
  generateTeacherAIReviewBrief: mocks.generateTeacherAIReviewBrief,
}));

import { generateAIReviewBriefAction } from "@/features/submission-review/ai-review-brief-actions";

const brief: AIReviewBriefV1 = {
  schemaVersion: 1,
  approachSummary: "Uses a lookup map.",
  likelyBugsOrEdgeCases: ["Check duplicate values."],
  evidenceExplanation: ["One deterministic reason is available."],
  vivaQuestions: [1, 2, 3].map((number) => ({
    question: `Question ${number}`,
    expectedAnswerBullets: ["Expected point"],
  })),
  modificationTask: "Add a no-solution path.",
  feedbackDraft: "Explain the lookup invariant.",
  provenance: {
    provider: "fake",
    model: "deterministic-review-brief-v1",
    promptVersion: "ai-review-brief-v1",
    generatedAt: "2026-08-14T10:00:00.000Z",
    generationId: "generation-1",
    persisted: false,
  },
};

describe("AI review brief server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the server-resolved teacher identity to the owner-scoped service", async () => {
    mocks.resolveCurrentActor.mockResolvedValue({
      id: "teacher-1",
      role: "TEACHER",
    });
    mocks.generateTeacherAIReviewBrief.mockResolvedValue(brief);

    const result = await generateAIReviewBriefAction(
      "submission-1",
      {},
      new FormData(),
    );

    expect(mocks.generateTeacherAIReviewBrief).toHaveBeenCalledWith({
      teacherId: "teacher-1",
      submissionId: "submission-1",
    });
    expect(result).toMatchObject({ ok: true, brief });
  });

  it("does not generate or return a brief for a student caller", async () => {
    mocks.resolveCurrentActor.mockResolvedValue({
      id: "student-1",
      role: "STUDENT",
    });

    const result = await generateAIReviewBriefAction(
      "submission-1",
      {},
      new FormData(),
    );

    expect(mocks.generateTeacherAIReviewBrief).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      message:
        "The review brief could not be generated. Confirm access and try again.",
    });
    expect("brief" in result).toBe(false);
  });

  it("returns a bounded error state when the provider fails", async () => {
    mocks.resolveCurrentActor.mockResolvedValue({
      id: "teacher-1",
      role: "TEACHER",
    });
    mocks.generateTeacherAIReviewBrief.mockRejectedValue(
      new Error("provider secret failure"),
    );

    const result = await generateAIReviewBriefAction(
      "submission-1",
      {},
      new FormData(),
    );

    expect(result.ok).toBe(false);
    expect(result.message).not.toContain("provider secret failure");
    expect("brief" in result).toBe(false);
  });
});
