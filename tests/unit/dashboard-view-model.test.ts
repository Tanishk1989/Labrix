import { describe, expect, it } from "vitest";
import { buildTeacherDashboardViewModel } from "@/features/dashboard/dashboard-view-model";
import type {
  TeacherOverview,
  TeacherPracticalSummary,
  TeacherSubmissionRecord,
} from "@/server/teacher/overview";

type Classroom = TeacherOverview["classrooms"][number];

const baseSummary: TeacherOverview["summary"] = {
  classroomCount: 0,
  distinctStudentCount: 0,
  publishedPracticalCount: 0,
  submissionAttemptCount: 0,
  needsReviewCount: 0,
};

function classroom(overrides: Partial<Classroom> = {}): Classroom {
  return {
    id: "class-1",
    name: "Algorithms Lab",
    subject: "Algorithms",
    section: "A",
    studentCount: 12,
    publishedPracticalCount: 0,
    completionPercentage: 0,
    activePracticalTitle: null,
    outstandingStudentCount: 0,
    ...overrides,
  };
}

function practical(overrides: Partial<TeacherPracticalSummary> = {}): TeacherPracticalSummary {
  return {
    id: "practical-1",
    classroomId: "class-1",
    classroomName: "Algorithms Lab",
    classroomSubject: "Algorithms",
    title: "Sorting",
    status: "PUBLISHED",
    deadline: null,
    testCount: 4,
    studentCount: 12,
    submittedCount: 8,
    completionPercentage: 67,
    createdAt: "2026-08-10T09:00:00.000Z",
    ...overrides,
  };
}

function submission(overrides: Partial<TeacherSubmissionRecord> = {}): TeacherSubmissionRecord {
  return {
    id: "submission-1",
    studentId: "student-1",
    studentName: "Ada Student",
    classroomId: "class-1",
    classroomName: "Algorithms Lab",
    classroomSubject: "Algorithms",
    taskId: "practical-1",
    taskTitle: "Sorting",
    attemptNumber: 1,
    language: "JAVA",
    submittedAt: "2026-08-10T10:00:00.000Z",
    state: "COMPLETED",
    passedTests: 4,
    totalTests: 4,
    suggestedScore: 10,
    teacherMarks: null,
    reviewStatus: "NEEDS_REVIEW",
    ...overrides,
  };
}

function overview(overrides: Partial<TeacherOverview> = {}): TeacherOverview {
  return {
    summary: baseSummary,
    classrooms: [],
    practicals: [],
    submissions: [],
    attention: [],
    progress: {
      eligibleStudentCount: 0,
      overallCompletionPercentage: 0,
      completedStudentPracticalPairs: 0,
      totalStudentPracticalPairs: 0,
      students: [],
    },
    ...overrides,
  };
}

describe("teacher dashboard view model", () => {
  it("produces the classroom onboarding state when there are no classrooms", () => {
    const dashboard = buildTeacherDashboardViewModel(overview());

    expect(dashboard.teachingContext).toEqual({ kind: "no-classrooms" });
    expect(dashboard.header.action).toBeNull();
    expect(dashboard.header.description).toBe("Nothing needs your attention right now.");
  });

  it("uses the newest classroom as the create-practical context when none is published", () => {
    const newestClassroom = classroom({ id: "class-new", name: "Newest class" });
    const dashboard = buildTeacherDashboardViewModel(overview({
      summary: { ...baseSummary, classroomCount: 2 },
      classrooms: [newestClassroom, classroom({ id: "class-old" })],
    }));

    expect(dashboard.teachingContext).toEqual({
      kind: "no-published-practical",
      classroom: newestClassroom,
      createPracticalHref: "/classes/class-new/tasks/new",
    });
  });

  it("selects the newest published practical even when a newer draft and older rows are present", () => {
    const newestPublished = practical({
      id: "published-new",
      classroomId: "class-2",
      createdAt: "2026-08-11T09:00:00.000Z",
    });
    const dashboard = buildTeacherDashboardViewModel(overview({
      classrooms: [classroom(), classroom({ id: "class-2", name: "Systems Lab" })],
      practicals: [
        practical({ id: "draft-newer", status: "DRAFT", createdAt: "2026-08-12T09:00:00.000Z" }),
        newestPublished,
        practical({ id: "published-old", createdAt: "2026-08-01T09:00:00.000Z" }),
      ],
    }));

    expect(dashboard.teachingContext.kind).toBe("published-practical");
    if (dashboard.teachingContext.kind === "published-practical") {
      expect(dashboard.teachingContext.practical.id).toBe("published-new");
      expect(dashboard.teachingContext.classroom.id).toBe("class-2");
    }
  });

  it("separates new submissions from private review drafts", () => {
    const dashboard = buildTeacherDashboardViewModel(overview({
      summary: { ...baseSummary, needsReviewCount: 2, submissionAttemptCount: 2 },
      submissions: [
        submission(),
        submission({ id: "submission-2", reviewStatus: "DRAFT_SAVED" }),
      ],
    }));

    expect(dashboard.attention.slice(0, 2)).toMatchObject([
      { id: "new-review-queue", title: "1 new submission", href: "/submissions?review=NEW" },
      { id: "draft-review-queue", title: "1 saved review draft", href: "/submissions?review=DRAFT" },
    ]);
    expect(dashboard.recentSubmissions.map((item) => item.reviewLabel)).toContain("Draft saved");
  });

  it("does not turn practical attention into invented recent activity", () => {
    const dashboard = buildTeacherDashboardViewModel(overview({
      attention: [{
        id: "draft-class-1",
        tone: "neutral",
        title: "1 unpublished draft",
        detail: "Algorithms Lab",
        href: "/practicals?status=DRAFT",
        action: "Review drafts",
      }],
    }));

    expect(dashboard.attention).toHaveLength(1);
    expect(dashboard.recentSubmissions).toEqual([]);
  });

  it("keeps repeated immutable submissions as separate activity rows", () => {
    const dashboard = buildTeacherDashboardViewModel(overview({
      submissions: [
        submission({ id: "attempt-1", attemptNumber: 1 }),
        submission({ id: "attempt-2", attemptNumber: 2 }),
      ],
    }));

    expect(dashboard.recentSubmissions.map((item) => item.id)).toEqual(["attempt-1", "attempt-2"]);
  });

  it("orders recent submissions deterministically by timestamp and then id", () => {
    const dashboard = buildTeacherDashboardViewModel(overview({
      submissions: [
        submission({ id: "same-b", submittedAt: "2026-08-12T09:00:00.000Z" }),
        submission({ id: "older", submittedAt: "2026-08-11T09:00:00.000Z" }),
        submission({ id: "same-a", submittedAt: "2026-08-12T09:00:00.000Z" }),
      ],
    }));

    expect(dashboard.recentSubmissions.map((item) => item.id)).toEqual(["same-a", "same-b", "older"]);
  });
});
