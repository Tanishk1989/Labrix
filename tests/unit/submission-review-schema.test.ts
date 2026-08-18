import { describe, expect, it } from "vitest";
import { submissionReviewInputSchema } from "@/features/submission-review/schema";

describe("submission review validation", () => {
  it("accepts whole-number marks for server-side practical-scale validation", () => {
    expect(
      submissionReviewInputSchema.parse({
        feedback: "Clear solution.",
        marksAwarded: "8",
        intent: "PUBLISHED",
      }),
    ).toEqual({
      feedback: "Clear solution.",
      marksAwarded: 8,
      criterionScores: [],
      intent: "PUBLISHED",
    });
  });

  it.each([-1, 4.5])("rejects negative or fractional marks: %s", (marksAwarded) => {
    expect(
      submissionReviewInputSchema.safeParse({
        feedback: "Review",
        marksAwarded,
        intent: "DRAFT",
      }).success,
    ).toBe(false);
  });

  it("requires feedback only when publishing", () => {
    expect(submissionReviewInputSchema.safeParse({ feedback: "", marksAwarded: 8, intent: "DRAFT" }).success).toBe(true);
    expect(submissionReviewInputSchema.safeParse({ feedback: "", marksAwarded: 8, intent: "PUBLISHED" }).success).toBe(false);
  });
});
