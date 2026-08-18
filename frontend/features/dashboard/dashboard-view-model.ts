import { teacherReviewStatusMeta } from "@/features/submission-review/review-queue";
import type {
  TeacherAttentionItem,
  TeacherOverview,
  TeacherSubmissionRecord,
} from "@/server/teacher/overview";

export type DashboardMetric = {
  label: string;
  value: number;
};

export type DashboardAttentionRow = {
  id: string;
  kind: "review" | "practical";
  tone: TeacherAttentionItem["tone"];
  title: string;
  detail: string;
  href: string;
  action: string;
};

export type DashboardRecentSubmission = {
  id: string;
  studentName: string;
  taskTitle: string;
  classroomName: string;
  attemptNumber: number;
  submittedAt: string;
  resultLabel: string;
  reviewLabel: string;
};

type DashboardClassroom = TeacherOverview["classrooms"][number];
type DashboardPractical = TeacherOverview["practicals"][number];

export type DashboardTeachingContext =
  | { kind: "no-classrooms" }
  | {
      kind: "no-published-practical";
      classroom: DashboardClassroom;
      createPracticalHref: string;
    }
  | {
      kind: "published-practical";
      classroom: DashboardClassroom;
      practical: DashboardPractical;
    };

export type TeacherDashboardViewModel = {
  header: {
    description: string;
    action: { kind: "create-practical"; href: string } | null;
  };
  metrics: DashboardMetric[];
  attention: DashboardAttentionRow[];
  teachingContext: DashboardTeachingContext;
  recentSubmissions: DashboardRecentSubmission[];
};

function byNewestSubmission(a: TeacherSubmissionRecord, b: TeacherSubmissionRecord) {
  const difference = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  return difference || a.id.localeCompare(b.id);
}

function submissionResultLabel(submission: TeacherSubmissionRecord) {
  if (submission.state === "COMPILATION_ERROR") return "Compilation error";
  if (submission.state === "RUNTIME_ERROR") return "Runtime error";
  if (submission.state === "TIME_LIMIT_EXCEEDED") return "Time limit exceeded";
  if (submission.state === "INTERNAL_ERROR") return "Provider error";
  if (submission.totalTests === 0) return "No tests configured";
  if (submission.passedTests === submission.totalTests) return "Passed all provided tests";
  return `${submission.passedTests}/${submission.totalTests} tests passed`;
}

function buildTeachingContext(overview: TeacherOverview): DashboardTeachingContext {
  const latestPublishedPractical = overview.practicals.find(
    (practical) => practical.status === "PUBLISHED",
  );

  if (latestPublishedPractical) {
    const classroom = overview.classrooms.find(
      (candidate) => candidate.id === latestPublishedPractical.classroomId,
    );
    if (classroom) {
      return {
        kind: "published-practical",
        classroom,
        practical: latestPublishedPractical,
      };
    }
  }

  const classroom = overview.classrooms[0];
  if (!classroom) return { kind: "no-classrooms" };

  return {
    kind: "no-published-practical",
    classroom,
    createPracticalHref: `/classes/${classroom.id}/tasks/new`,
  };
}

function headerDescription(overview: TeacherOverview) {
  const reviewCount = overview.summary.needsReviewCount;
  if (reviewCount > 0 && overview.attention.length > 0) {
    return `${reviewCount} ${reviewCount === 1 ? "submission needs" : "submissions need"} review. Other practical attention is surfaced below.`;
  }
  if (reviewCount > 0) {
    return `${reviewCount} ${reviewCount === 1 ? "submission needs" : "submissions need"} review.`;
  }
  if (overview.attention.length > 0) {
    return "Practical attention is surfaced below.";
  }
  return "Nothing needs your attention right now.";
}

export function buildTeacherDashboardViewModel(
  overview: TeacherOverview,
): TeacherDashboardViewModel {
  const newReviewCount = overview.submissions.filter((submission) => submission.reviewStatus === "NEEDS_REVIEW").length;
  const draftReviewCount = overview.submissions.filter((submission) => submission.reviewStatus === "DRAFT_SAVED").length;
  const reviewAttention: DashboardAttentionRow[] = [
    ...(newReviewCount > 0 ? [{
        id: "new-review-queue",
        kind: "review",
        tone: "neutral",
        title: `${newReviewCount} new ${newReviewCount === 1 ? "submission" : "submissions"}`,
        detail: "No teacher review has been started.",
        href: "/submissions?review=NEW",
        action: "Review new work",
      } satisfies DashboardAttentionRow] : []),
    ...(draftReviewCount > 0 ? [{
        id: "draft-review-queue",
        kind: "review",
        tone: "neutral",
        title: `${draftReviewCount} saved review ${draftReviewCount === 1 ? "draft" : "drafts"}`,
        detail: "Private feedback saved for later.",
        href: "/submissions?review=DRAFT",
        action: "Continue reviews",
      } satisfies DashboardAttentionRow] : []),
  ];

  const practicalAttention: DashboardAttentionRow[] = overview.attention.map((item) => ({
    ...item,
    kind: "practical",
  }));

  const recentSubmissions = [...overview.submissions]
    .sort(byNewestSubmission)
    .slice(0, 6)
    .map((submission) => ({
      id: submission.id,
      studentName: submission.studentName,
      taskTitle: submission.taskTitle,
      classroomName: submission.classroomName,
      attemptNumber: submission.attemptNumber,
      submittedAt: submission.submittedAt,
      resultLabel: submissionResultLabel(submission),
      reviewLabel: teacherReviewStatusMeta(submission.reviewStatus).label,
    }));

  return {
    header: {
      description: headerDescription(overview),
      action: overview.classrooms[0]
        ? {
            kind: "create-practical",
            href: `/classes/${overview.classrooms[0].id}/tasks/new`,
          }
        : null,
    },
    metrics: [
      { label: "Active classes", value: overview.summary.classroomCount },
      { label: "Active students", value: overview.summary.distinctStudentCount },
      { label: "Published practicals", value: overview.summary.publishedPracticalCount },
      { label: "Needs review", value: overview.summary.needsReviewCount },
    ],
    attention: [...reviewAttention, ...practicalAttention],
    teachingContext: buildTeachingContext(overview),
    recentSubmissions,
  };
}
