import { describe, expect, it } from "vitest";
import {
  MARKS_OUT_OF,
  submissionReviewInputSchema,
} from "@/features/submission-review/schema";

describe("submission review validation", () => {
  it("accepts whole-number marks on the fixed ten-point scale", () => {
    expect(
      submissionReviewInputSchema.parse({
        feedback: "Clear solution.",
        marksAwarded: "8",
        intent: "PUBLISHED",
      }),
    ).toEqual({
      feedback: "Clear solution.",
      marksAwarded: 8,
      intent: "PUBLISHED",
    });
    expect(MARKS_OUT_OF).toBe(10);
  });

  it.each([-1, 11, 4.5])("rejects out-of-bounds or fractional marks: %s", (marksAwarded) => {
    expect(
      submissionReviewInputSchema.safeParse({
        feedback: "Review",
        marksAwarded,
        intent: "DRAFT",
      }).success,
    ).toBe(false);
  });
});
