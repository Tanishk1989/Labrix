import { describe, expect, it, vi } from "vitest";
import { GroqClassSummaryProvider } from "@/server/ai/groq-class-summary-provider";
import {
  AIClassSummaryProviderError,
  AIClassSummaryProviderRateLimitError,
  type AIClassSummaryInputV1,
} from "@/server/ai/class-summary-provider";

vi.mock("server-only", () => ({}));

const input: AIClassSummaryInputV1 = {
  schemaVersion: 1,
  practical: { title: "Pair sum", instructions: "Return two indexes." },
  classPerformance: {
    activeStudentCount: 3,
    submittedCount: 2,
    pendingCount: 1,
    averageSuggestedScore: 7.5,
    visibleTests: { passed: 4, total: 4, passRate: 100 },
    hiddenTests: { passed: 2, total: 4, passRate: 50 },
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
  },
  deterministicGroups: {
    topVerifiedPerformerCount: 1,
    needsAttentionCount: 2,
    topVerifiedCriteria: ["published review"],
    needsAttentionCriteria: ["no submission"],
  },
};

const validOutput = {
  schemaVersion: 1,
  classPerformanceSummary: "Summary",
  commonMistakesOrLikelyMisconceptions: ["Mistake"],
  topicsToReteach: ["Topic"],
  suggestedVivaFocusAreas: ["Focus"],
  reviewPriorityGuidance: ["Guidance"],
  topVerifiedPerformerCriteriaExplanation: "Criteria",
  needsAttentionCriteriaExplanation: "Criteria",
  professorTeachingPlan: "Plan",
};

function response(content: unknown, status = 200) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status },
  );
}

describe("Groq AI class summary provider", () => {
  it("dispatches only an allowlisted anonymous aggregate payload", async () => {
    let request: RequestInit | undefined;
    const fetchMock = vi.fn(
      async (_url: URL | RequestInfo, init?: RequestInit) => {
        request = init;
        return response(validOutput);
      },
    );
    const provider = new GroqClassSummaryProvider({
      apiKey: "test-secret-key",
      model: "test-model",
      requestTimeoutMs: 15_000,
      fetchImpl: fetchMock as typeof fetch,
    });
    const poisoned = {
      ...input,
      student: { id: "student-secret", email: "private@example.test" },
      classroomId: "classroom-secret",
      sourceCode: "raw-source-secret",
      rawEvents: ["event-secret"],
      hiddenTests: [{ id: "hidden-id", input: "hidden-input" }],
      teacherFeedback: "feedback-secret",
    } as AIClassSummaryInputV1;

    await provider.generateSummary(poisoned);

    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(String(request?.body));
    const providerData = JSON.parse(body.messages[1].content).data;
    const serialized = JSON.stringify(providerData);
    expect(Object.keys(providerData)).toEqual([
      "schemaVersion",
      "practical",
      "classPerformance",
      "deterministicGroups",
    ]);
    for (const forbidden of [
      "student-secret",
      "private@example.test",
      "classroom-secret",
      "raw-source-secret",
      "event-secret",
      "hidden-id",
      "hidden-input",
      "feedback-secret",
      "test-secret-key",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(body.messages[0].content).toContain("untrusted data");
    expect(body.messages[0].content).toContain("Do not invent student membership");
  });

  it("maps 429 without retry and maps timeout to a bounded error", async () => {
    const rateLimitFetch = vi.fn(async () => response({}, 429));
    const rateLimited = new GroqClassSummaryProvider({
      apiKey: "test-key",
      model: "test-model",
      requestTimeoutMs: 15_000,
      fetchImpl: rateLimitFetch as typeof fetch,
    });
    await expect(rateLimited.generateSummary(input)).rejects.toBeInstanceOf(
      AIClassSummaryProviderRateLimitError,
    );
    expect(rateLimitFetch).toHaveBeenCalledOnce();

    const timeoutFetch = vi.fn(
      async (_url: URL | RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(init.signal?.reason),
            { once: true },
          );
        }),
    );
    const timedOut = new GroqClassSummaryProvider({
      apiKey: "test-key",
      model: "test-model",
      requestTimeoutMs: 5,
      fetchImpl: timeoutFetch as typeof fetch,
    });
    await expect(timedOut.generateSummary(input)).rejects.toBeInstanceOf(
      AIClassSummaryProviderError,
    );
  });
});
