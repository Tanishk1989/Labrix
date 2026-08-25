import { describe, expect, it } from "vitest";
import {
  buildStudentPracticalDetailViewModel,
  buildStudentPracticalsViewModel,
  matchesStudentPracticalFilter,
  normalizeStudentPracticalFilter,
} from "@/features/student/student-practicals-view-model";
import type { StudentOverview } from "@/server/student/overview";

type StudentClass = StudentOverview["classes"][number];
type StudentPractical = StudentOverview["practicals"][number];

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
    instructions: "Implement insertion and deletion.",
    constraints: "Use a singly linked list.",
    allowedLanguages: ["CPP", "JAVA"],
    deadline: null,
    classroom: {
      id: "class-1",
      name: "Algorithms Lab",
      subject: "Algorithms",
      section: "A",
    },
    visibleTestCount: 1,
    visibleTests: [{ id: "visible-1", input: "1 5", expectedOutput: "5" }],
    latestSession: null,
    latestSubmission: null,
    attempts: [],
    ...overrides,
  };
}

function latestSubmission({
  feedbackAvailable = false,
  submittedAt = "2026-08-11T10:00:00.000Z",
}: {
  feedbackAvailable?: boolean;
  submittedAt?: string;
} = {}): NonNullable<StudentPractical["latestSubmission"]> {
  return {
    id: "submission-1",
    attemptNumber: 1,
    language: "JAVA",
    submittedAt,
    state: "COMPLETED",
    passedTests: 1,
    totalTests: 1,
    feedbackAvailable,
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

describe("student practical discovery", () => {
  it("normalizes and separates the four student work views", () => {
    expect(normalizeStudentPracticalFilter()).toBe("TO_DO");
    expect(normalizeStudentPracticalFilter("unexpected")).toBe("TO_DO");
    expect(normalizeStudentPracticalFilter("FEEDBACK")).toBe("FEEDBACK");
    expect(matchesStudentPracticalFilter("NOT_SUBMITTED", "TO_DO")).toBe(true);
    expect(matchesStudentPracticalFilter("IN_PROGRESS", "TO_DO")).toBe(false);
    expect(matchesStudentPracticalFilter("SUBMITTED", "SUBMITTED")).toBe(true);
    expect(matchesStudentPracticalFilter("FEEDBACK_AVAILABLE", "FEEDBACK")).toBe(true);
  });
  it("distinguishes no-class and no-published-practical states", () => {
    expect(buildStudentPracticalsViewModel(overview({ classes: [] })).state).toBe("NO_CLASSES");
    expect(buildStudentPracticalsViewModel(overview()).state).toBe("NO_PRACTICALS");
  });

  it("uses the shared deadline priority for unsubmitted work", () => {
    const view = buildStudentPracticalsViewModel(overview({
      practicals: [
        practical({ id: "none", deadline: null }),
        practical({ id: "later", deadline: "2026-08-20T10:00:00.000Z" }),
        practical({ id: "earlier", deadline: "2026-08-14T10:00:00.000Z" }),
      ],
    }));

    expect(view.practicals.map((item) => item.id)).toEqual(["earlier", "later", "none"]);
  });

  it("derives not-submitted and genuinely active-session states", () => {
    const view = buildStudentPracticalsViewModel(overview({
      practicals: [
        practical({ id: "new" }),
        practical({ id: "active", latestSession: {
          id: "session-active",
          status: "ACTIVE",
          attemptNumber: 1,
          updatedAt: "2026-08-12T10:00:00.000Z",
        } }),
        practical({ id: "closed", latestSession: {
          id: "session-closed",
          status: "SUBMITTED",
          attemptNumber: 1,
          updatedAt: "2026-08-12T10:00:00.000Z",
        } }),
      ],
    }));

    expect(view.practicals.find((item) => item.id === "new")).toMatchObject({ statusLabel: "Not submitted", actionLabel: "Start practical" });
    expect(view.practicals.find((item) => item.id === "active")).toMatchObject({ statusLabel: "In progress", actionLabel: "Continue practical" });
    expect(view.practicals.find((item) => item.id === "closed")).toMatchObject({ statusLabel: "Not submitted", actionLabel: "Start practical" });
  });

  it("places submitted work after actionable work and orders it newest first", () => {
    const view = buildStudentPracticalsViewModel(overview({
      practicals: [
        practical({ id: "older", latestSubmission: latestSubmission({ submittedAt: "2026-08-10T10:00:00.000Z" }) }),
        practical({ id: "waiting" }),
        practical({ id: "newer", latestSubmission: latestSubmission({ submittedAt: "2026-08-12T10:00:00.000Z" }) }),
      ],
    }));

    expect(view.practicals.map((item) => item.id)).toEqual(["waiting", "newer", "older"]);
  });

  it("surfaces only an explicit published-feedback availability boolean", () => {
    const view = buildStudentPracticalsViewModel(overview({
      practicals: [practical({ latestSubmission: latestSubmission({ feedbackAvailable: true }) })],
    }));

    expect(view.practicals[0]).toMatchObject({
      state: "FEEDBACK_AVAILABLE",
      statusLabel: "Feedback available",
      actionLabel: "View practical",
    });
    expect(JSON.stringify(view)).not.toContain("feedback text");
  });
});

describe("student practical detail", () => {
  it("preserves authored content and public tests and links to the real workspace", () => {
    const view = buildStudentPracticalDetailViewModel(practical());

    expect(view).toMatchObject({
      instructions: "Implement insertion and deletion.",
      constraints: "Use a singly linked list.",
      workspaceHref: "/tasks/practical-1",
      workspaceActionLabel: "Start coding",
      visibleTests: [{ id: "visible-1", input: "1 5", expectedOutput: "5" }],
    });
  });

  it("links published feedback to the existing student-owned submission", () => {
    const view = buildStudentPracticalDetailViewModel(practical({
      latestSubmission: latestSubmission({ feedbackAvailable: true }),
    }));

    expect(view.latestSubmission).toMatchObject({
      feedbackAvailable: true,
      href: "/submissions/submission-1?view=student",
    });
  });
});
