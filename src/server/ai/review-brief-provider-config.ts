import "server-only";

import { FakeAIReviewBriefProvider } from "./fake-review-brief-provider";
import { FakeAIClassSummaryProvider } from "./fake-class-summary-provider";
import { GroqClassSummaryProvider } from "./groq-class-summary-provider";
import { GroqReviewBriefProvider } from "./groq-review-brief-provider";
import type { AIClassSummaryProvider } from "./class-summary-provider";
import type { AIReviewBriefProvider } from "./review-brief-provider";

const DEFAULT_TIMEOUT_MS = 15_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 60_000;
const fakeProvider: AIReviewBriefProvider = new FakeAIReviewBriefProvider();
const fakeClassSummaryProvider: AIClassSummaryProvider =
  new FakeAIClassSummaryProvider();

export interface AIReviewBriefProviderEnvironment {
  LABRIX_AI_REVIEW_PROVIDER?: string;
  GROQ_API_KEY?: string;
  GROQ_AI_REVIEW_MODEL?: string;
  LABRIX_AI_REVIEW_TIMEOUT_MS?: string;
}

export class AIReviewBriefConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIReviewBriefConfigurationError";
  }
}

function requireValue(value: string | undefined, variableName: string) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new AIReviewBriefConfigurationError(
      `${variableName} is required when LABRIX_AI_REVIEW_PROVIDER=groq.`,
    );
  }
  return normalized;
}

function resolveTimeout(value: string | undefined) {
  if (value === undefined || value === "") return DEFAULT_TIMEOUT_MS;
  if (!/^\d+$/.test(value)) {
    throw new AIReviewBriefConfigurationError(
      "LABRIX_AI_REVIEW_TIMEOUT_MS must be a whole number of milliseconds between 1000 and 60000.",
    );
  }
  const timeout = Number(value);
  if (timeout < MIN_TIMEOUT_MS || timeout > MAX_TIMEOUT_MS) {
    throw new AIReviewBriefConfigurationError(
      "LABRIX_AI_REVIEW_TIMEOUT_MS must be between 1000 and 60000 milliseconds.",
    );
  }
  return timeout;
}

export function getAIReviewBriefProvider(
  environment: AIReviewBriefProviderEnvironment = {
    LABRIX_AI_REVIEW_PROVIDER: process.env.LABRIX_AI_REVIEW_PROVIDER,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_AI_REVIEW_MODEL: process.env.GROQ_AI_REVIEW_MODEL,
    LABRIX_AI_REVIEW_TIMEOUT_MS: process.env.LABRIX_AI_REVIEW_TIMEOUT_MS,
  },
): AIReviewBriefProvider {
  const mode = environment.LABRIX_AI_REVIEW_PROVIDER ?? "fake";
  if (mode === "fake") return fakeProvider;
  if (mode === "groq") {
    return new GroqReviewBriefProvider({
      apiKey: requireValue(environment.GROQ_API_KEY, "GROQ_API_KEY"),
      model: requireValue(
        environment.GROQ_AI_REVIEW_MODEL,
        "GROQ_AI_REVIEW_MODEL",
      ),
      requestTimeoutMs: resolveTimeout(
        environment.LABRIX_AI_REVIEW_TIMEOUT_MS,
      ),
    });
  }
  throw new AIReviewBriefConfigurationError(
    "LABRIX_AI_REVIEW_PROVIDER must be fake or groq.",
  );
}

export function getAIClassSummaryProvider(
  environment: AIReviewBriefProviderEnvironment = {
    LABRIX_AI_REVIEW_PROVIDER: process.env.LABRIX_AI_REVIEW_PROVIDER,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_AI_REVIEW_MODEL: process.env.GROQ_AI_REVIEW_MODEL,
    LABRIX_AI_REVIEW_TIMEOUT_MS: process.env.LABRIX_AI_REVIEW_TIMEOUT_MS,
  },
): AIClassSummaryProvider {
  const mode = environment.LABRIX_AI_REVIEW_PROVIDER ?? "fake";
  if (mode === "fake") return fakeClassSummaryProvider;
  if (mode === "groq") {
    return new GroqClassSummaryProvider({
      apiKey: requireValue(environment.GROQ_API_KEY, "GROQ_API_KEY"),
      model: requireValue(
        environment.GROQ_AI_REVIEW_MODEL,
        "GROQ_AI_REVIEW_MODEL",
      ),
      requestTimeoutMs: resolveTimeout(
        environment.LABRIX_AI_REVIEW_TIMEOUT_MS,
      ),
    });
  }
  throw new AIReviewBriefConfigurationError(
    "LABRIX_AI_REVIEW_PROVIDER must be fake or groq.",
  );
}
