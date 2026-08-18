import { describe, expect, it } from "vitest";
import {
  buildTeacherReviewSidebarQueue,
  filterTeacherReviewQueue,
  normalizeTeacherReviewQueueFilter,
  teacherReviewEmptyState,
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

  it("separates new submissions from saved drafts", () => {
    expect(filterTeacherReviewQueue(rows, "NEW").map((row) => row.id)).toEqual(["needs"]);
    expect(filterTeacherReviewQueue(rows, "DRAFT").map((row) => row.id)).toEqual(["draft"]);
  });

  it("treats only published feedback as reviewed", () => {
    expect(filterTeacherReviewQueue(rows, "PUBLISHED").map((row) => row.id)).toEqual([
      "published",
    ]);
    expect(filterTeacherReviewQueue(rows, "ALL")).toEqual(rows);
  });

  it("fails unknown or repeated URL filter values back to All", () => {
    expect(normalizeTeacherReviewQueueFilter("NEW")).toBe("NEW");
    expect(normalizeTeacherReviewQueueFilter("DRAFT")).toBe("DRAFT");
    expect(normalizeTeacherReviewQueueFilter("PUBLISHED")).toBe("PUBLISHED");
    expect(normalizeTeacherReviewQueueFilter("NEEDS_REVIEW")).toBe("NEW");
    expect(normalizeTeacherReviewQueueFilter("REVIEWED")).toBe("PUBLISHED");
    expect(normalizeTeacherReviewQueueFilter("unexpected")).toBe("ALL");
    expect(normalizeTeacherReviewQueueFilter(["unexpected", "REVIEWED"])).toBe("ALL");
  });

  it("keeps an older selected attempt visible in the compact review queue", () => {
    const attempts = Array.from({ length: 14 }, (_, index) => ({ id: `attempt-${index}` }));

    expect(buildTeacherReviewSidebarQueue(attempts, "attempt-13", 4)).toEqual([
      { id: "attempt-13" },
      { id: "attempt-0" },
      { id: "attempt-1" },
      { id: "attempt-2" },
    ]);
    expect(buildTeacherReviewSidebarQueue(attempts, "attempt-2", 4)).toEqual(
      attempts.slice(0, 4),
    );
  });

  it("distinguishes no submissions, completed review work, and filtered results", () => {
    expect(teacherReviewEmptyState({
      totalSubmissions: 0,
      filter: "ALL",
      hasContentFilters: false,
    })).toMatchObject({ title: "No submissions yet", showClear: false });

    expect(teacherReviewEmptyState({
      totalSubmissions: 3,
      filter: "NEW",
      hasContentFilters: false,
    })).toMatchObject({ title: "No new submissions", showClear: true });

    expect(teacherReviewEmptyState({
      totalSubmissions: 3,
      filter: "ALL",
      hasContentFilters: true,
    })).toMatchObject({ title: "No submissions match this view", showClear: true });
  });
});
