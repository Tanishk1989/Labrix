import { describe, expect, it } from "vitest";
import { buildStudentDashboardViewModel } from "@/features/student/student-dashboard-view-model";
import type { StudentOverview } from "@/server/student/overview";

type StudentClass = StudentOverview["classes"][number];
type StudentPractical = StudentOverview["practicals"][number];
type StudentSubmission = StudentOverview["submissions"][number];

function studentClass(overrides: Partial<StudentClass> = {}): StudentClass {
  return {
    id: "class-1",
    name: "Algorithms Lab",
    subject: "Algorithms",
    section: "A",
    practicalCount: 0,
    submittedPracticalCount: 0,
    completionPercentage: 0,
    latestPractical: null,
    ...overrides,
  };
}

function practical(overrides: Partial<StudentPractical> = {}): StudentPractical {
  return {
    id: "practical-1",
    title: "Linked List",
    instructions: "Implement the required operations.",
    constraints: null,
    allowedLanguages: ["JAVA"],
    deadline: null,
    classroom: {
      id: "class-1",
      name: "Algorithms Lab",
      subject: "Algorithms",
      section: "A",
    },
    visibleTestCount: 3,
    visibleTests: [],
    latestSession: null,
    latestSubmission: null,
    attempts: [],
    ...overrides,
  };
}

function submission(overrides: Partial<StudentSubmission> = {}): StudentSubmission {
  return {
    id: "submission-1",
    attemptNumber: 1,
    language: "JAVA",
    submittedAt: "2026-08-11T10:00:00.000Z",
    state: "COMPLETED",
    passedTests: 3,
    totalTests: 3,
    visiblePassedTests: 3,
    visibleTotalTests: 3,
    feedbackAvailable: false,
    publishedMarks: null,
    practical: { id: "practical-1", title: "Linked List" },
    classroom: {
      id: "class-1",
      name: "Algorithms Lab",
      subject: "Algorithms",
      section: "A",
    },
    ...overrides,
  };
}

function overview(overrides: Partial<StudentOverview> = {}): StudentOverview {
  return {
    classes: [studentClass()],
    practicals: [],
    submissions: [],
    summary: {
      classCount: 1,
      practicalCount: 0,
      submittedPracticalCount: 0,
      completionPercentage: 0,
    },
    ...overrides,
  };
}

describe("student dashboard view model", () => {
  it("shows the join-class state when there are no active memberships", () => {
    const dashboard = buildStudentDashboardViewModel(overview({
      classes: [],
      summary: { classCount: 0, practicalCount: 0, submittedPracticalCount: 0, completionPercentage: 0 },
    }));

    expect(dashboard).toMatchObject({
      state: "NO_CLASSES",
      nextUp: null,
      upcoming: [],
    });
  });

  it("shows an honest caught-up state when classes have no published practicals", () => {
    const dashboard = buildStudentDashboardViewModel(overview());

    expect(dashboard).toMatchObject({
      state: "NO_PRACTICALS",
      headline: "You’re all caught up.",
      progress: { submitted: 0, total: 0, percentage: 0 },
    });
  });

  it("selects an unsubmitted practical for first work", () => {
    const dashboard = buildStudentDashboardViewModel(overview({
      practicals: [practical()],
      summary: { classCount: 1, practicalCount: 1, submittedPracticalCount: 0, completionPercentage: 0 },
    }));

    expect(dashboard).toMatchObject({
      state: "ACTIONABLE",
      headline: "Ready to code?",
      nextUp: {
        id: "practical-1",
        statusLabel: "Not started",
        actionLabel: "Start practical",
        href: "/tasks/practical-1",
      },
    });
  });

  it("uses a real saved session to offer continuation without changing completion", () => {
    const dashboard = buildStudentDashboardViewModel(overview({
      practicals: [practical({
        latestSession: {
          id: "session-1",
          status: "ACTIVE",
          attemptNumber: 1,
          updatedAt: "2026-08-11T12:00:00.000Z",
        },
      })],
      summary: { classCount: 1, practicalCount: 1, submittedPracticalCount: 0, completionPercentage: 0 },
    }));

    expect(dashboard).toMatchObject({
      headline: "Continue where you left off.",
      nextUp: { statusLabel: "In progress", actionLabel: "Continue practical" },
      progress: { submitted: 0, total: 1, percentage: 0 },
    });
  });

  it("labels unsubmitted work after its deadline as overdue", () => {
    const dashboard = buildStudentDashboardViewModel(overview({
      practicals: [practical({ deadline: "2026-08-15T10:00:00.000Z" })],
      summary: { classCount: 1, practicalCount: 1, submittedPracticalCount: 0, completionPercentage: 0 },
    }), new Date("2026-08-25T10:00:00.000Z"));

    expect(dashboard).toMatchObject({
      headline: "An overdue practical needs attention.",
      nextUp: { statusLabel: "Overdue" },
    });
  });

  it("orders unsubmitted work by deadline and preserves DTO order for ties", () => {
    const dashboard = buildStudentDashboardViewModel(overview({
      practicals: [
        practical({ id: "no-deadline", title: "No deadline" }),
        practical({ id: "later", title: "Later", deadline: "2026-08-20T10:00:00.000Z" }),
        practical({ id: "earlier-a", title: "Earlier A", deadline: "2026-08-15T10:00:00.000Z" }),
        practical({ id: "earlier-b", title: "Earlier B", deadline: "2026-08-15T10:00:00.000Z" }),
      ],
      summary: { classCount: 1, practicalCount: 4, submittedPracticalCount: 0, completionPercentage: 0 },
    }));

    expect(dashboard.nextUp?.id).toBe("earlier-a");
    expect(dashboard.upcoming.map((item) => item.id)).toEqual(["earlier-b", "later", "no-deadline"]);
  });

  it("shows the all-submitted state using practical-level completion", () => {
    const latest = submission();
    const dashboard = buildStudentDashboardViewModel(overview({
      practicals: [practical({
        latestSubmission: {
          id: latest.id,
          attemptNumber: latest.attemptNumber,
          language: latest.language,
          submittedAt: latest.submittedAt,
          state: latest.state,
          passedTests: latest.passedTests,
          totalTests: latest.totalTests,
          feedbackAvailable: latest.feedbackAvailable,
        },
        attempts: [{
          id: latest.id,
          attemptNumber: latest.attemptNumber,
          language: latest.language,
          submittedAt: latest.submittedAt,
          state: latest.state,
          passedTests: latest.passedTests,
          totalTests: latest.totalTests,
          visiblePassedTests: latest.visiblePassedTests,
          visibleTotalTests: latest.visibleTotalTests,
          feedbackAvailable: latest.feedbackAvailable,
          publishedMarks: latest.publishedMarks,
        }],
      })],
      submissions: [latest],
      summary: { classCount: 1, practicalCount: 1, submittedPracticalCount: 1, completionPercentage: 100 },
    }));

    expect(dashboard).toMatchObject({
      state: "ALL_SUBMITTED",
      nextUp: null,
      progress: { submitted: 1, total: 1, percentage: 100 },
    });
  });

  it("keeps repeated attempts in recent submission history and sorts them by time", () => {
    const dashboard = buildStudentDashboardViewModel(overview({
      practicals: [practical()],
      submissions: [
        submission({ id: "attempt-1", attemptNumber: 1, submittedAt: "2026-08-10T10:00:00.000Z" }),
        submission({ id: "attempt-2", attemptNumber: 2, submittedAt: "2026-08-11T10:00:00.000Z", passedTests: 2 }),
      ],
      summary: { classCount: 1, practicalCount: 1, submittedPracticalCount: 0, completionPercentage: 0 },
    }));

    expect(dashboard.recentSubmissions.map((item) => item.id)).toEqual(["attempt-2", "attempt-1"]);
    expect(dashboard.recentSubmissions[0]).toMatchObject({
      attemptNumber: 2,
      resultLabel: "2/3 tests passed",
    });
  });
});
