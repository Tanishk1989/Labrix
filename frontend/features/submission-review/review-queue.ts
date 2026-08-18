import type { SubmissionReviewStatus } from "@prisma/client";

export type TeacherReviewQueueStatus =
  | "NEEDS_REVIEW"
  | "DRAFT_SAVED"
  | "PUBLISHED_FEEDBACK";

export type TeacherReviewQueueFilter = "ALL" | "NEW" | "DRAFT" | "PUBLISHED";

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
  if (candidate === "NEEDS_REVIEW") return "NEW";
  if (candidate === "REVIEWED") return "PUBLISHED";
  return candidate === "NEW" || candidate === "DRAFT" || candidate === "PUBLISHED"
    ? candidate
    : "ALL";
}

export function filterTeacherReviewQueue<
  T extends { reviewStatus: TeacherReviewQueueStatus },
>(rows: T[], filter: TeacherReviewQueueFilter): T[] {
  if (filter === "ALL") return rows;
  if (filter === "NEW") return rows.filter((row) => row.reviewStatus === "NEEDS_REVIEW");
  if (filter === "DRAFT") return rows.filter((row) => row.reviewStatus === "DRAFT_SAVED");
  return rows.filter((row) => row.reviewStatus === "PUBLISHED_FEEDBACK");
}

export function buildTeacherReviewSidebarQueue<T extends { id: string }>(
  rows: T[],
  selectedId: string,
  limit = 12,
): T[] {
  const recent = rows.slice(0, limit);
  if (recent.some((row) => row.id === selectedId)) return recent;
  const selected = rows.find((row) => row.id === selectedId);
  return selected ? [selected, ...recent.slice(0, Math.max(0, limit - 1))] : recent;
}

export function teacherReviewEmptyState({
  totalSubmissions,
  filter,
  hasContentFilters,
}: {
  totalSubmissions: number;
  filter: TeacherReviewQueueFilter;
  hasContentFilters: boolean;
}) {
  if (totalSubmissions === 0) {
    return {
      title: "No submissions yet",
      description: "Student attempts will appear here after they submit practicals.",
      showClear: false,
    };
  }
  if (filter === "NEW" && !hasContentFilters) {
    return {
      title: "No new submissions",
      description: "Every submitted attempt has either a saved draft or published feedback.",
      showClear: true,
    };
  }
  if (filter === "DRAFT" && !hasContentFilters) {
    return {
      title: "No saved drafts",
      description: "Reviews saved for later will appear here.",
      showClear: true,
    };
  }
  return {
    title: "No submissions match this view",
    description: "Adjust or clear the current filters to see other attempts.",
    showClear: true,
  };
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
