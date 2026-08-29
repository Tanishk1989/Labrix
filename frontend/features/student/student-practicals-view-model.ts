import type { StudentOverview } from "@/server/student/overview";
import {
  hasActiveStudentSession,
  isStudentPracticalOverdue,
  orderStudentActionablePracticals,
} from "./student-dashboard-view-model";

type StudentPractical = StudentOverview["practicals"][number];

export type StudentPracticalState =
  | "NOT_SUBMITTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "FEEDBACK_AVAILABLE";

export type StudentPracticalFilter = "ALL" | "TO_DO" | "IN_PROGRESS" | "SUBMITTED" | "FEEDBACK";

export function normalizeStudentPracticalFilter(value?: string): StudentPracticalFilter {
  return value === "TO_DO" || value === "IN_PROGRESS" || value === "SUBMITTED" || value === "FEEDBACK"
    ? value
    : "ALL";
}

export function matchesStudentPracticalFilter(
  state: StudentPracticalState,
  filter: StudentPracticalFilter,
) {
  if (filter === "ALL") return true;
  if (filter === "TO_DO") return state === "NOT_SUBMITTED";
  if (filter === "FEEDBACK") return state === "FEEDBACK_AVAILABLE";
  return state === filter;
}

export type StudentPracticalRow = {
  id: string;
  title: string;
  classroomName: string;
  classroomSubject: string;
  deadline: string | null;
  latestSubmittedAt: string | null;
  state: StudentPracticalState;
  statusLabel: string;
  actionLabel: "Start practical" | "Continue practical" | "Review practical" | "View practical";
  href: string;
};

function stateFor(practical: StudentPractical): StudentPracticalState {
  if (practical.latestSubmission?.feedbackAvailable) return "FEEDBACK_AVAILABLE";
  if (practical.latestSubmission) return "SUBMITTED";
  if (hasActiveStudentSession(practical)) return "IN_PROGRESS";
  return "NOT_SUBMITTED";
}

function practicalRow(practical: StudentPractical, now: Date): StudentPracticalRow {
  const state = stateFor(practical);
  const overdue = isStudentPracticalOverdue(practical, now);
  const statusLabel = state === "FEEDBACK_AVAILABLE"
    ? "Feedback available"
    : state === "SUBMITTED"
      ? "Submitted"
      : state === "IN_PROGRESS"
        ? "In progress"
        : "Not submitted";
  return {
    id: practical.id,
    title: practical.title,
    classroomName: practical.classroom.name,
    classroomSubject: practical.classroom.subject,
    deadline: practical.deadline,
    latestSubmittedAt: practical.latestSubmission?.submittedAt ?? null,
    state,
    statusLabel: overdue ? "Deadline passed" : statusLabel,
    actionLabel: overdue
      ? "Review practical"
      : state === "IN_PROGRESS"
      ? "Continue practical"
      : state === "NOT_SUBMITTED"
        ? "Start practical"
        : "View practical",
    href: `/practicals/${practical.id}`,
  };
}

/**
 * Discovery begins with the same unsubmitted/deadline order used by Next up.
 * Submitted work follows, newest submission first, with DTO order as a stable
 * tie-breaker.
 */
export function buildStudentPracticalsViewModel(overview: StudentOverview, now = new Date()) {
  const actionable = orderStudentActionablePracticals(overview.practicals, now);
  const actionableIds = new Set(actionable.map((practical) => practical.id));
  const submitted = overview.practicals
    .map((practical, index) => ({ practical, index }))
    .filter(({ practical }) => !actionableIds.has(practical.id))
    .sort((left, right) => {
      const leftTime = left.practical.latestSubmission
        ? new Date(left.practical.latestSubmission.submittedAt).getTime()
        : 0;
      const rightTime = right.practical.latestSubmission
        ? new Date(right.practical.latestSubmission.submittedAt).getTime()
        : 0;
      return rightTime - leftTime || left.index - right.index;
    })
    .map(({ practical }) => practical);

  return {
    state: overview.classes.length === 0
      ? "NO_CLASSES" as const
      : overview.practicals.length === 0
        ? "NO_PRACTICALS" as const
        : "READY" as const,
    practicals: [...actionable, ...submitted].map((practical) => practicalRow(practical, now)),
  };
}

export function buildStudentPracticalDetailViewModel(practical: StudentPractical, now = new Date()) {
  const state = stateFor(practical);
  const latest = practical.latestSubmission;
  const overdue = isStudentPracticalOverdue(practical, now);
  return {
    id: practical.id,
    title: practical.title,
    classroom: practical.classroom,
    instructions: practical.instructions,
    constraints: practical.constraints,
    deadline: practical.deadline,
    allowedLanguages: practical.allowedLanguages,
    visibleTests: practical.visibleTests,
    state,
    statusLabel: overdue
      ? "Deadline passed"
      : state === "FEEDBACK_AVAILABLE"
      ? "Feedback available"
      : state === "SUBMITTED"
        ? "Submitted"
        : state === "IN_PROGRESS"
          ? "In progress"
          : "Not submitted",
    workspaceActionLabel: overdue
      ? "Submission closed"
      : hasActiveStudentSession(practical)
        ? "Continue coding"
        : "Start coding",
    workspaceHref: overdue ? null : `/tasks/${practical.id}`,
    latestSubmission: latest
      ? {
          id: latest.id,
          attemptNumber: latest.attemptNumber,
          submittedAt: latest.submittedAt,
          passedTests: latest.passedTests,
          totalTests: latest.totalTests,
          feedbackAvailable: latest.feedbackAvailable,
          href: `/submissions/${latest.id}?view=student`,
        }
      : null,
  };
}
