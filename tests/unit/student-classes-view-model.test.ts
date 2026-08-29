import { describe, expect, it } from "vitest";
import { buildStudentClassesViewModel } from "@/features/student/student-classes-view-model";
import type { StudentOverview } from "@/server/student/overview";

type StudentClass = StudentOverview["classes"][number];
type StudentPractical = StudentOverview["practicals"][number];

function studentClass(overrides: Partial<StudentClass> = {}): StudentClass {
  return {
    id: "class-1",
    name: "DSA Practical Lab",
    subject: "Data Structures & Algorithms",
    section: "BTech CSE · Section A",
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
      name: "DSA Practical Lab",
      subject: "Data Structures & Algorithms",
      section: "BTech CSE · Section A",
    },
    visibleTestCount: 3,
    visibleTests: [],
    latestSession: null,
    latestSubmission: null,
    attempts: [],
    ...overrides,
  };
}

function submittedPractical(overrides: Partial<StudentPractical> = {}): StudentPractical {
  return practical({
    latestSubmission: {
      id: "submission-1",
      attemptNumber: 1,
      language: "JAVA",
      submittedAt: "2026-08-10T10:00:00.000Z",
      state: "COMPLETED",
      passedTests: 3,
      totalTests: 3,
      feedbackAvailable: false,
    },
    attempts: [{
      id: "submission-1",
      attemptNumber: 1,
      language: "JAVA",
      submittedAt: "2026-08-10T10:00:00.000Z",
      state: "COMPLETED",
      passedTests: 3,
      totalTests: 3,
      visiblePassedTests: 3,
      visibleTotalTests: 3,
      feedbackAvailable: false,
      publishedMarks: null,
    }],
    ...overrides,
  });
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

describe("student Classes view model", () => {
  it("returns an honest empty list when the student has no classes", () => {
    expect(buildStudentClassesViewModel(overview({ classes: [] })).classes).toEqual([]);
  });

  it("does not present zero percent as performance when nothing is published", () => {
    expect(buildStudentClassesViewModel(overview()).classes[0]).toMatchObject({
      state: "NO_PRACTICALS",
      publishedCount: 0,
      submittedCount: 0,
      completionPercentage: null,
      nextWork: null,
    });
  });

  it("derives partial completion from the student's own submitted practicals", () => {
    const view = buildStudentClassesViewModel(overview({
      practicals: [
        submittedPractical({ id: "submitted" }),
        practical({ id: "waiting" }),
      ],
    }), new Date("2026-08-01T10:00:00.000Z"));

    expect(view.classes[0]).toMatchObject({
      state: "IN_PROGRESS",
      publishedCount: 2,
      submittedCount: 1,
      completionPercentage: 50,
      nextWork: { id: "waiting", actionLabel: "Start" },
    });
  });

  it("uses the dashboard deadline rule independently within each class", () => {
    const view = buildStudentClassesViewModel(overview({
      practicals: [
        practical({ id: "no-deadline", title: "Stack" }),
        practical({ id: "later", title: "Trees", deadline: "2026-08-20T10:00:00.000Z" }),
        practical({ id: "earlier", title: "Queue", deadline: "2026-08-14T10:00:00.000Z" }),
      ],
    }), new Date("2026-08-01T10:00:00.000Z"));

    expect(view.classes[0].nextWork).toMatchObject({ id: "earlier", title: "Queue" });
  });

  it("uses a saved session only to label a real continuation", () => {
    const view = buildStudentClassesViewModel(overview({
      practicals: [practical({
        latestSession: {
          id: "session-1",
          status: "ACTIVE",
          attemptNumber: 1,
          updatedAt: "2026-08-12T10:00:00.000Z",
        },
      })],
    }));

    expect(view.classes[0].nextWork).toMatchObject({
      statusLabel: "In progress",
      actionLabel: "Continue",
    });
  });

  it("opens overdue work in review mode instead of a blocked workspace", () => {
    const view = buildStudentClassesViewModel(overview({
      practicals: [practical({ deadline: "2026-08-15T10:00:00.000Z" })],
    }), new Date("2026-08-25T10:00:00.000Z"));

    expect(view.classes[0].nextWork).toMatchObject({
      statusLabel: "Overdue",
      actionLabel: "Review",
      href: "/practicals/practical-1",
    });
  });

  it("marks a class up to date when every published practical has a submission", () => {
    const view = buildStudentClassesViewModel(overview({
      practicals: [
        submittedPractical({ id: "one" }),
        submittedPractical({ id: "two", latestSubmission: {
          id: "submission-2",
          attemptNumber: 2,
          language: "JAVA",
          submittedAt: "2026-08-11T10:00:00.000Z",
          state: "COMPLETED",
          passedTests: 2,
          totalTests: 3,
          feedbackAvailable: false,
        } }),
      ],
    }));

    expect(view.classes[0]).toMatchObject({
      state: "UP_TO_DATE",
      submittedCount: 2,
      publishedCount: 2,
      completionPercentage: 100,
      nextWork: null,
    });
  });

  it("does not carry teacher-only roster, analytics, or join-code fields", () => {
    const serialized = JSON.stringify(buildStudentClassesViewModel(overview({
      practicals: [practical()],
    })));

    expect(serialized).not.toContain("joinCode");
    expect(serialized).not.toContain("studentCount");
    expect(serialized).not.toContain("submittedCountByClass");
  });
});
