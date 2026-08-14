import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FakeAIReviewBriefProvider } from "@/server/ai/fake-review-brief-provider";
import { FakeAIClassSummaryProvider } from "@/server/ai/fake-class-summary-provider";
import { GroqClassSummaryProvider } from "@/server/ai/groq-class-summary-provider";
import { GroqReviewBriefProvider } from "@/server/ai/groq-review-brief-provider";
import {
  AIReviewBriefConfigurationError,
  getAIClassSummaryProvider,
  getAIReviewBriefProvider,
} from "@/server/ai/review-brief-provider-config";

describe("AI review brief provider configuration", () => {
  it("keeps the fake provider as the default", () => {
    expect(getAIReviewBriefProvider({})).toBeInstanceOf(
      FakeAIReviewBriefProvider,
    );
    expect(
      getAIReviewBriefProvider({ LABRIX_AI_REVIEW_PROVIDER: "fake" }),
    ).toBeInstanceOf(FakeAIReviewBriefProvider);
    expect(getAIClassSummaryProvider({})).toBeInstanceOf(
      FakeAIClassSummaryProvider,
    );
  });

  it("uses the same explicit Groq configuration for class summaries", () => {
    const provider = getAIClassSummaryProvider({
      LABRIX_AI_REVIEW_PROVIDER: "groq",
      GROQ_API_KEY: "test-key",
      GROQ_AI_REVIEW_MODEL: "test-model",
      LABRIX_AI_REVIEW_TIMEOUT_MS: "12000",
    });

    expect(provider).toBeInstanceOf(GroqClassSummaryProvider);
    expect(provider.descriptor).toEqual({
      provider: "groq",
      model: "test-model",
    });
  });

  it("uses an explicit Groq model override without code changes", () => {
    const provider = getAIReviewBriefProvider({
      LABRIX_AI_REVIEW_PROVIDER: "groq",
      GROQ_API_KEY: "test-key",
      GROQ_AI_REVIEW_MODEL: "test-model",
      LABRIX_AI_REVIEW_TIMEOUT_MS: "12000",
    });

    expect(provider).toBeInstanceOf(GroqReviewBriefProvider);
    expect(provider.descriptor).toEqual({
      provider: "groq",
      model: "test-model",
    });
  });

  it.each([
    [{ LABRIX_AI_REVIEW_PROVIDER: "groq" }, /GROQ_API_KEY/],
    [
      {
        LABRIX_AI_REVIEW_PROVIDER: "groq",
        GROQ_API_KEY: "test-key",
      },
      /GROQ_AI_REVIEW_MODEL/,
    ],
    [
      {
        LABRIX_AI_REVIEW_PROVIDER: "groq",
        GROQ_API_KEY: "test-key",
        GROQ_AI_REVIEW_MODEL: "test-model",
        LABRIX_AI_REVIEW_TIMEOUT_MS: "fast",
      },
      /whole number/,
    ],
    [
      {
        LABRIX_AI_REVIEW_PROVIDER: "groq",
        GROQ_API_KEY: "test-key",
        GROQ_AI_REVIEW_MODEL: "test-model",
        LABRIX_AI_REVIEW_TIMEOUT_MS: "999",
      },
      /between 1000 and 60000/,
    ],
    [{ LABRIX_AI_REVIEW_PROVIDER: "openai" }, /fake or groq/],
  ] as const)("fails closed for incomplete or unsupported config", (env, message) => {
    expect(() => getAIReviewBriefProvider(env)).toThrow(
      AIReviewBriefConfigurationError,
    );
    expect(() => getAIReviewBriefProvider(env)).toThrow(message);
  });
});
