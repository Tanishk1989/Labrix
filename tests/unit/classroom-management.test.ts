import { describe, expect, it, vi } from "vitest";
import {
  buildTeacherClassroomManagement,
} from "@/server/teacher/classroom-management";
import { AccessDeniedError } from "@/server/authorization/classroom-access";

vi.mock("server-only", () => ({}));

const resultSnapshot = {
  state: "COMPLETED" as const,
  passedTests: 2,
  totalTests: 3,
  visiblePassedTests: 1,
  visibleTotalTests: 1,
  hiddenPassedTests: 1,
  hiddenTotalTests: 2,
  suggestedScore: 6.7,
};

describe("teacher classroom management read model", () => {
  it("builds roster, latest progress, and analytics from one submission set", () => {
    const view = buildTeacherClassroomManagement({
      classroom: {
        id: "classroom-a",
        name: "Algorithms",
        joinCode: "CLASS-1234",
      },
      memberships: [
        {
          id: "membership-a",
          active: true,
          joinedAt: new Date("2026-08-01T00:00:00.000Z"),
          user: { id: "student-a", name: "Asha", email: "asha@example.test" },
        },
        {
          id: "membership-b",
          active: false,
          joinedAt: new Date("2026-08-02T00:00:00.000Z"),
          user: { id: "student-b", name: "Bharat", email: "bharat@example.test" },
        },
      ],
      task: { id: "task-latest", title: "Latest practical" },
      auditEntries: [],
      submissions: [
        {
          id: "submission-latest",
          taskId: "task-latest",
          studentId: "student-a",
          attemptNumber: 2,
          submittedAt: new Date("2026-08-11T12:00:00.000Z"),
          language: "JAVA",
          task: { id: "task-latest", title: "Latest practical" },
          review: { status: "PUBLISHED" },
          resultSnapshot,
        },
        {
          id: "submission-old",
          taskId: "task-old",
          studentId: "student-a",
          attemptNumber: 1,
          submittedAt: new Date("2026-08-10T12:00:00.000Z"),
          language: "CPP",
          task: { id: "task-old", title: "Old practical" },
          review: null,
          resultSnapshot,
        },
      ],
    });

    expect(view.roster.students).toHaveLength(1);
    expect(view.roster.inactiveStudents).toHaveLength(1);
    expect(view.roster.students[0]).toMatchObject({
      submissionCount: 2,
      publishedReviewCount: 1,
      latestSubmission: { id: "submission-latest" },
    });
    expect(view.progress.students[0]?.latestSubmission).toMatchObject({
      id: "submission-latest",
      attemptNumber: 2,
      resultSnapshot: { passedTests: 2, totalTests: 3 },
    });
    expect(view.analytics).toMatchObject({
      submittedStudentCount: 1,
      reviewedCount: 1,
      hiddenTests: { passed: 1, total: 2 },
    });
  });

  it("rejects unavailable owner-scoped classrooms", () => {
    expect(() =>
      buildTeacherClassroomManagement({
        classroom: null,
        memberships: [],
        task: null,
        auditEntries: [],
        submissions: [],
      }),
    ).toThrow(AccessDeniedError);
  });
});
