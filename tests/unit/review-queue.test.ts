import { describe, expect, it } from "vitest";
import {
  filterTeacherReviewQueue,
  normalizeTeacherReviewQueueFilter,
  toTeacherReviewQueueStatus,
} from "@/features/submission-review/review-queue";

const rows = [
  { id: "needs", reviewStatus: "NEEDS_REVIEW" as const },
  { id: "draft", reviewStatus: "DRAFT_SAVED" as const },
  { id: "published", reviewStatus: "PUBLISHED_FEEDBACK" as const },
];

describe("teacher review queue", () => {
  it("maps persisted review state to the three teacher-facing statuses", () => {
    expect(toTeacherReviewQueueStatus(null)).toBe("NEEDS_REVIEW");
    expect(toTeacherReviewQueueStatus("DRAFT")).toBe("DRAFT_SAVED");
    expect(toTeacherReviewQueueStatus("PUBLISHED")).toBe("PUBLISHED_FEEDBACK");
  });

  it("keeps unfinished drafts in Needs review", () => {
    expect(filterTeacherReviewQueue(rows, "NEEDS_REVIEW").map((row) => row.id)).toEqual([
      "needs",
      "draft",
    ]);
  });

  it("treats only published feedback as reviewed", () => {
    expect(filterTeacherReviewQueue(rows, "REVIEWED").map((row) => row.id)).toEqual([
      "published",
    ]);
    expect(filterTeacherReviewQueue(rows, "ALL")).toEqual(rows);
  });

  it("fails unknown or repeated URL filter values back to All", () => {
    expect(normalizeTeacherReviewQueueFilter("NEEDS_REVIEW")).toBe("NEEDS_REVIEW");
    expect(normalizeTeacherReviewQueueFilter("REVIEWED")).toBe("REVIEWED");
    expect(normalizeTeacherReviewQueueFilter("unexpected")).toBe("ALL");
    expect(normalizeTeacherReviewQueueFilter(["unexpected", "REVIEWED"])).toBe("ALL");
  });
});
