import type { StudentOverview } from "@/server/student/overview";
import { describeSubmissionOutcome } from "@/domain/submissions/academic-progress";
import { hasActiveStudentSession } from "./student-dashboard-view-model";

export type StudentProgressState = "NO_CLASSES" | "NO_PRACTICALS" | "READY";

export function buildStudentProgressViewModel(overview: StudentOverview) {
  const submissionById = new Map(overview.submissions.map((submission) => [submission.id, submission]));
  const classroomOrder = new Map(overview.classes.map((classroom, index) => [classroom.id, index]));
  const grouped = new Map<string, {
    id: string;
    name: string;
    subject: string;
    section: string;
    practicals: Array<{
      id: string;
      title: string;
      deadline: string | null;
      workStatusLabel: "Not started" | "In progress" | "Submitted";
      outcomeLabel: string | null;
      passedAllProvidedTests: boolean;
      reviewLabel: "Teacher review pending" | "Feedback available" | null;
      publishedMarks: { awarded: number; outOf: number } | null;
      actionLabel: "Start practical" | "Continue practical" | "View submission";
      actionHref: string;
    }>;
  }>();

  for (const practical of overview.practicals) {
    const classroom = practical.classroom;
    const group = grouped.get(classroom.id) ?? {
      id: classroom.id,
      name: classroom.name,
      subject: classroom.subject,
      section: classroom.section,
      practicals: [],
    };
    const latest = practical.latestSubmission;
    const historySubmission = latest ? submissionById.get(latest.id) : undefined;
    const feedbackAvailable = latest?.feedbackAvailable === true;
    const outcome = latest ? describeSubmissionOutcome(latest) : null;
    group.practicals.push({
      id: practical.id,
      title: practical.title,
      deadline: practical.deadline,
      workStatusLabel: latest
        ? "Submitted"
        : hasActiveStudentSession(practical)
          ? "In progress"
          : "Not started",
      outcomeLabel: outcome?.label ?? null,
      passedAllProvidedTests: outcome?.passedAllProvidedTests ?? false,
      reviewLabel: latest
        ? feedbackAvailable
          ? "Feedback available"
          : "Teacher review pending"
        : null,
      publishedMarks: feedbackAvailable ? historySubmission?.publishedMarks ?? null : null,
      actionLabel: latest
        ? "View submission"
        : hasActiveStudentSession(practical)
          ? "Continue practical"
          : "Start practical",
      actionHref: latest ? `/submissions/${latest.id}?view=student` : `/tasks/${practical.id}`,
    });
    grouped.set(classroom.id, group);
  }

  const classes = [...grouped.values()]
    .sort((left, right) => (classroomOrder.get(left.id) ?? 0) - (classroomOrder.get(right.id) ?? 0))
    .map((classroom) => {
      const submittedCount = classroom.practicals.filter((practical) => practical.workStatusLabel === "Submitted").length;
      const passedAllProvidedTestsCount = classroom.practicals.filter(
        (practical) => practical.passedAllProvidedTests,
      ).length;
      const publishedReviewCount = classroom.practicals.filter(
        (practical) => practical.reviewLabel === "Feedback available",
      ).length;
      const totalCount = classroom.practicals.length;
      return {
        ...classroom,
        submittedCount,
        passedAllProvidedTestsCount,
        publishedReviewCount,
        totalCount,
        completionPercentage: totalCount ? Math.round((submittedCount / totalCount) * 100) : 0,
      };
    });

  const total = overview.summary.practicalCount;
  const submitted = overview.summary.submittedPracticalCount;
  const passedAllProvidedTests = overview.practicals.filter((practical) =>
    practical.latestSubmission
      ? describeSubmissionOutcome(practical.latestSubmission).passedAllProvidedTests
      : false
  ).length;
  const publishedReviews = overview.practicals.filter(
    (practical) => practical.latestSubmission?.feedbackAvailable === true,
  ).length;
  return {
    state: overview.classes.length === 0
      ? "NO_CLASSES" as const
      : total === 0
        ? "NO_PRACTICALS" as const
        : "READY" as const,
    summary: {
      submitted,
      total,
      awaiting: Math.max(0, total - submitted),
      percentage: overview.summary.completionPercentage,
      passedAllProvidedTests,
      publishedReviews,
    },
    allSubmitted: total > 0 && submitted === total,
    classes,
  };
}
