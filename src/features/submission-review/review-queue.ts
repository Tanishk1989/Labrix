import type { SubmissionReviewStatus } from "@prisma/client";

export type TeacherReviewQueueStatus =
  | "NEEDS_REVIEW"
  | "DRAFT_SAVED"
  | "PUBLISHED_FEEDBACK";

export type TeacherReviewQueueFilter = "ALL" | "NEEDS_REVIEW" | "REVIEWED";

export function toTeacherReviewQueueStatus(
  status: SubmissionReviewStatus | null,
): TeacherReviewQueueStatus {
  if (status === "DRAFT") return "DRAFT_SAVED";
  if (status === "PUBLISHED") return "PUBLISHED_FEEDBACK";
  return "NEEDS_REVIEW";
}

export function normalizeTeacherReviewQueueFilter(
  value: string | string[] | undefined,
): TeacherReviewQueueFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "NEEDS_REVIEW" || candidate === "REVIEWED"
    ? candidate
    : "ALL";
}

export function filterTeacherReviewQueue<
  T extends { reviewStatus: TeacherReviewQueueStatus },
>(rows: T[], filter: TeacherReviewQueueFilter): T[] {
  if (filter === "ALL") return rows;
  if (filter === "REVIEWED") {
    return rows.filter((row) => row.reviewStatus === "PUBLISHED_FEEDBACK");
  }
  return rows.filter((row) => row.reviewStatus !== "PUBLISHED_FEEDBACK");
}

export function teacherReviewStatusMeta(status: TeacherReviewQueueStatus) {
  if (status === "DRAFT_SAVED") {
    return { label: "Draft saved", tone: "warning" as const };
  }
  if (status === "PUBLISHED_FEEDBACK") {
    return { label: "Published feedback", tone: "success" as const };
  }
  return { label: "Needs review", tone: "neutral" as const };
}
