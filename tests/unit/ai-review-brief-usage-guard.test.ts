import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  AIReviewBriefUsageLimitError,
  withTeacherAIReviewBriefUsageGuard,
} from "@/server/ai/review-brief-usage-guard";

describe("teacher AI review brief usage guard", () => {
  it("allows only one active generation per teacher and releases after completion", async () => {
    let release: (() => void) | undefined;
    const firstOperation = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = () => resolve("first complete");
        }),
    );
    const blockedOperation = vi.fn(async () => "should not run");

    const first = withTeacherAIReviewBriefUsageGuard(
      "teacher-1",
      firstOperation,
    );
    await expect(
      withTeacherAIReviewBriefUsageGuard("teacher-1", blockedOperation),
    ).rejects.toBeInstanceOf(AIReviewBriefUsageLimitError);
    expect(blockedOperation).not.toHaveBeenCalled();

    await expect(
      withTeacherAIReviewBriefUsageGuard("teacher-2", async () =>
        Promise.resolve("other teacher"),
      ),
    ).resolves.toBe("other teacher");

    release?.();
    await expect(first).resolves.toBe("first complete");
    await expect(
      withTeacherAIReviewBriefUsageGuard("teacher-1", async () =>
        Promise.resolve("next manual request"),
      ),
    ).resolves.toBe("next manual request");
  });

  it("releases the teacher guard after provider failure", async () => {
    await expect(
      withTeacherAIReviewBriefUsageGuard("teacher-failure", async () => {
        throw new Error("provider failed");
      }),
    ).rejects.toThrow("provider failed");

    await expect(
      withTeacherAIReviewBriefUsageGuard("teacher-failure", async () =>
        Promise.resolve("retry allowed"),
      ),
    ).resolves.toBe("retry allowed");
  });
});
