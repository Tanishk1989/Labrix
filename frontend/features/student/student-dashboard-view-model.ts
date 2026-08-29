import type { StudentOverview } from "@/server/student/overview";

type StudentPractical = StudentOverview["practicals"][number];

export function hasActiveStudentSession(practical: StudentPractical) {
  return practical.latestSession?.status === "ACTIVE";
}

export function isStudentPracticalOverdue(
  practical: Pick<StudentPractical, "deadline" | "latestSubmission">,
  now = new Date(),
) {
  return Boolean(
    practical.deadline &&
    practical.latestSubmission === null &&
    new Date(practical.deadline).getTime() < now.getTime(),
  );
}

export function orderStudentActionablePracticals(
  practicals: StudentPractical[],
  now = new Date(),
) {
  return practicals
    .map((practical, index) => ({ practical, index }))
    .filter(({ practical }) => practical.latestSubmission === null)
    .sort((left, right) => {
      const leftOverdue = isStudentPracticalOverdue(left.practical, now);
      const rightOverdue = isStudentPracticalOverdue(right.practical, now);
      if (leftOverdue !== rightOverdue) return leftOverdue ? 1 : -1;
      const leftDeadline = left.practical.deadline
        ? new Date(left.practical.deadline).getTime()
        : Number.POSITIVE_INFINITY;
      const rightDeadline = right.practical.deadline
        ? new Date(right.practical.deadline).getTime()
        : Number.POSITIVE_INFINITY;
      return leftDeadline - rightDeadline || left.index - right.index;
    })
    .map(({ practical }) => practical);
}

export type StudentDashboardPractical = {
  id: string;
  title: string;
  classroomName: string;
  classroomSubject: string;
  deadline: string | null;
  statusLabel: "Overdue" | "In progress" | "Not started";
  actionLabel: "Continue practical" | "Start practical" | "Review practical";
  href: string;
};

export type StudentDashboardSubmission = {
  id: string;
  practicalTitle: string;
  classroomName: string;
  attemptNumber: number;
  submittedAt: string;
  resultLabel: string;
  resultTone: "passed" | "warning" | "compilation-error" | "danger" | "neutral";
};

export type StudentDashboardViewModel = {
  state: "NO_CLASSES" | "NO_PRACTICALS" | "ACTIONABLE" | "ALL_SUBMITTED";
  headline: string;
  description: string;
  nextUp: StudentDashboardPractical | null;
  upcoming: StudentDashboardPractical[];
  progress: {
    submitted: number;
    total: number;
    percentage: number;
  };
  recentSubmissions: StudentDashboardSubmission[];
};

function practicalRow(practical: StudentPractical, now: Date): StudentDashboardPractical {
  const inProgress = hasActiveStudentSession(practical);
  const overdue = isStudentPracticalOverdue(practical, now);
  return {
    id: practical.id,
    title: practical.title,
    classroomName: practical.classroom.name,
    classroomSubject: practical.classroom.subject,
    deadline: practical.deadline,
    statusLabel: overdue ? "Overdue" : inProgress ? "In progress" : "Not started",
    actionLabel: overdue
      ? "Review practical"
      : inProgress ? "Continue practical" : "Start practical",
    href: overdue ? `/practicals/${practical.id}` : `/tasks/${practical.id}`,
  };
}

function submissionResult(state: string, passed: number, total: number) {
  if (state === "COMPILATION_ERROR") {
    return { label: "Compilation error", tone: "compilation-error" as const };
  }
  if (state !== "COMPLETED") {
    const normalized = state.replaceAll("_", " ").toLowerCase();
    return {
      label: `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`,
      tone: "danger" as const,
    };
  }
  if (total === 0) {
    return { label: "No tests configured", tone: "neutral" as const };
  }
  if (passed === total) {
    return { label: "Passed all provided tests", tone: "passed" as const };
  }
  return { label: `${passed}/${total} tests passed`, tone: "warning" as const };
}

/**
 * Selects unsubmitted published practicals by earliest real deadline. Work
 * without a deadline follows dated work, and the overview DTO order is the
 * stable tie-breaker. A saved session changes the action label, not priority.
 */
export function buildStudentDashboardViewModel(
  overview: StudentOverview,
  now = new Date(),
): StudentDashboardViewModel {
  const actionable = orderStudentActionablePracticals(overview.practicals, now)
    .map((practical) => practicalRow(practical, now));

  const recentSubmissions = [...overview.submissions]
    .sort((left, right) => (
      new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
    ))
    .slice(0, 5)
    .map((submission) => {
      const result = submissionResult(
        submission.state,
        submission.passedTests,
        submission.totalTests,
      );
      return {
        id: submission.id,
        practicalTitle: submission.practical.title,
        classroomName: submission.classroom.name,
        attemptNumber: submission.attemptNumber,
        submittedAt: submission.submittedAt,
        resultLabel: result.label,
        resultTone: result.tone,
      };
    });

  const progress = {
    submitted: overview.summary.submittedPracticalCount,
    total: overview.summary.practicalCount,
    percentage: overview.summary.completionPercentage,
  };

  if (overview.classes.length === 0) {
    return {
      state: "NO_CLASSES",
      headline: "Ready to code?",
      description: "Join a class to receive practicals from your teacher.",
      nextUp: null,
      upcoming: [],
      progress,
      recentSubmissions,
    };
  }

  if (overview.practicals.length === 0) {
    return {
      state: "NO_PRACTICALS",
      headline: "You’re all caught up.",
      description: "No practicals have been published for your classes yet.",
      nextUp: null,
      upcoming: [],
      progress,
      recentSubmissions,
    };
  }

  if (actionable.length === 0) {
    return {
      state: "ALL_SUBMITTED",
      headline: "You’re up to date.",
      description: "All currently published practicals have a submission.",
      nextUp: null,
      upcoming: [],
      progress,
      recentSubmissions,
    };
  }

  return {
    state: "ACTIONABLE",
    headline: actionable[0].statusLabel === "Overdue"
      ? "An overdue practical needs attention."
      : actionable[0].statusLabel === "In progress"
        ? "Continue where you left off."
        : "Ready to code?",
    description: actionable[0].statusLabel === "Overdue"
      ? `${actionable.length} ${actionable.length === 1 ? "practical is" : "practicals are"} still awaiting submission. Check your teacher’s late-work policy.`
      : `${actionable.length} ${actionable.length === 1 ? "practical is" : "practicals are"} waiting for submission.`,
    nextUp: actionable[0],
    upcoming: actionable.slice(1),
    progress,
    recentSubmissions,
  };
}
