import type { StudentOverview } from "@/server/student/overview";
import {
  hasActiveStudentSession,
  isStudentPracticalOverdue,
  orderStudentActionablePracticals,
} from "./student-dashboard-view-model";

export type StudentClassWorkspace = {
  id: string;
  name: string;
  subject: string;
  section: string;
  publishedCount: number;
  submittedCount: number;
  completionPercentage: number | null;
  state: "NO_PRACTICALS" | "IN_PROGRESS" | "UP_TO_DATE";
  nextWork: {
    id: string;
    title: string;
    deadline: string | null;
    statusLabel: "Overdue" | "In progress" | "Not started";
    actionLabel: "Continue" | "Start" | "Review";
    href: string;
  } | null;
};

export type StudentClassesViewModel = {
  classes: StudentClassWorkspace[];
};

export function buildStudentClassesViewModel(
  overview: StudentOverview,
  now = new Date(),
): StudentClassesViewModel {
  return {
    classes: overview.classes.map((classroom) => {
      const practicals = overview.practicals.filter(
        (practical) => practical.classroom.id === classroom.id,
      );
      const submittedCount = practicals.filter(
        (practical) => practical.latestSubmission !== null,
      ).length;
      const nextPractical = orderStudentActionablePracticals(practicals, now)[0] ?? null;
      const publishedCount = practicals.length;

      return {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        section: classroom.section,
        publishedCount,
        submittedCount,
        completionPercentage: publishedCount
          ? Math.round((submittedCount / publishedCount) * 100)
          : null,
        state: publishedCount === 0
          ? "NO_PRACTICALS"
          : submittedCount === publishedCount
            ? "UP_TO_DATE"
            : "IN_PROGRESS",
        nextWork: nextPractical
          ? {
              id: nextPractical.id,
              title: nextPractical.title,
              deadline: nextPractical.deadline,
              statusLabel: isStudentPracticalOverdue(nextPractical, now)
                ? "Overdue"
                : hasActiveStudentSession(nextPractical) ? "In progress" : "Not started",
              actionLabel: isStudentPracticalOverdue(nextPractical, now)
                ? "Review"
                : hasActiveStudentSession(nextPractical) ? "Continue" : "Start",
              href: isStudentPracticalOverdue(nextPractical, now)
                ? `/practicals/${nextPractical.id}`
                : `/tasks/${nextPractical.id}`,
            }
          : null,
      };
    }),
  };
}
