import { describe, expect, it } from "vitest";
import { buildTeacherProgressViewModel } from "@/features/progress/teacher-progress-view-model";
import type { TeacherOverview } from "@/server/teacher/overview";

function overviewFixture(
  overrides: Partial<TeacherOverview> = {},
): TeacherOverview {
  return {
    summary: {
      classroomCount: 1,
      distinctStudentCount: 2,
      publishedPracticalCount: 2,
      submissionAttemptCount: 2,
      needsReviewCount: 2,
    },
    classrooms: [
      {
        id: "class-1",
        name: "Programming Lab",
        subject: "Algorithms",
        section: "A",
        studentCount: 2,
        publishedPracticalCount: 2,
        completionPercentage: 50,
        activePracticalTitle: "Arrays",
        outstandingStudentCount: 1,
      },
    ],
    practicals: [
      {
        id: "practical-1",
        classroomId: "class-1",
        classroomName: "Programming Lab",
        classroomSubject: "Algorithms",
        title: "Arrays",
        status: "PUBLISHED",
        deadline: null,
        testCount: 2,
        studentCount: 2,
        submittedCount: 1,
        completionPercentage: 50,
        createdAt: "2026-08-01T00:00:00.000Z",
      },
      {
        id: "practical-2",
        classroomId: "class-1",
        classroomName: "Programming Lab",
        classroomSubject: "Algorithms",
        title: "Stacks",
        status: "PUBLISHED",
        deadline: null,
        testCount: 2,
        studentCount: 2,
        submittedCount: 2,
        completionPercentage: 100,
        createdAt: "2026-07-31T00:00:00.000Z",
      },
    ],
    submissions: [],
    attention: [],
    progress: {
      eligibleStudentCount: 2,
      overallCompletionPercentage: 75,
      completedStudentPracticalPairs: 3,
      totalStudentPracticalPairs: 4,
      students: [
        {
          id: "student-1",
          name: "Student One",
          email: "one@example.com",
          classroomIds: ["class-1"],
          submittedPracticalCount: 2,
          availablePracticalCount: 2,
          completionPercentage: 100,
          latestActivityAt: "2026-08-02T00:00:00.000Z",
        },
        {
          id: "student-2",
          name: "Student Two",
          email: "two@example.com",
          classroomIds: ["class-1"],
          submittedPracticalCount: 1,
          availablePracticalCount: 2,
          completionPercentage: 50,
          latestActivityAt: null,
        },
      ],
    },
    ...overrides,
  };
}

describe("teacher progress view model", () => {
  it("preserves authoritative completion totals and finds the lowest practical", () => {
    const view = buildTeacherProgressViewModel(overviewFixture({
      submissions: [
        {
          id: "submission-passed",
          studentId: "student-1",
          studentName: "Student One",
          classroomId: "class-1",
          classroomName: "Programming Lab",
          classroomSubject: "Algorithms",
          taskId: "practical-1",
          taskTitle: "Arrays",
          attemptNumber: 1,
          language: "CPP",
          submittedAt: "2026-08-02T00:00:00.000Z",
          state: "COMPLETED",
          passedTests: 2,
          totalTests: 2,
          suggestedScore: 10,
          teacherMarks: { awarded: 9, outOf: 10 },
          reviewStatus: "PUBLISHED_FEEDBACK",
        },
        {
          id: "submission-compile-error",
          studentId: "student-2",
          studentName: "Student Two",
          classroomId: "class-1",
          classroomName: "Programming Lab",
          classroomSubject: "Algorithms",
          taskId: "practical-2",
          taskTitle: "Stacks",
          attemptNumber: 1,
          language: "JAVA",
          submittedAt: "2026-08-01T00:00:00.000Z",
          state: "COMPILATION_ERROR",
          passedTests: 0,
          totalTests: 2,
          suggestedScore: 0,
          teacherMarks: null,
          reviewStatus: "NEEDS_REVIEW",
        },
      ],
    }));

    expect(view).toMatchObject({
      hasCompletionScope: true,
      overallCompletionPercentage: 75,
      completedPairs: 3,
      totalPairs: 4,
      incompletePairs: 1,
      publishedPracticalCount: 2,
      passedAllProvidedTestsPairs: 1,
      publishedReviewPairs: 1,
    });
    expect(view.lowestSubmissionCoverage?.title).toBe("Arrays");
    expect(view.publishedPracticals.find((item) => item.id === "practical-2")).toMatchObject({
      submittedCount: 2,
      passedAllProvidedTestsCount: 0,
      publishedReviewCount: 0,
      needsReviewCount: 1,
    });
  });

  it("does not treat zero students as measurable failed completion", () => {
    const base = overviewFixture();
    const view = buildTeacherProgressViewModel(overviewFixture({
      practicals: base.practicals.map((practical) => ({
        ...practical,
        studentCount: 0,
        submittedCount: 0,
        completionPercentage: 0,
      })),
      progress: {
        eligibleStudentCount: 0,
        overallCompletionPercentage: 0,
        completedStudentPracticalPairs: 0,
        totalStudentPracticalPairs: 0,
        students: [],
      },
    }));

    expect(view.hasPublishedPracticals).toBe(true);
    expect(view.hasStudents).toBe(false);
    expect(view.hasCompletionScope).toBe(false);
    expect(view.incompletePairs).toBe(0);
    expect(view.lowestSubmissionCoverage).toBeNull();
  });

  it("distinguishes a class with no published practicals", () => {
    const view = buildTeacherProgressViewModel(overviewFixture({
      practicals: [],
      progress: {
        eligibleStudentCount: 2,
        overallCompletionPercentage: 0,
        completedStudentPracticalPairs: 0,
        totalStudentPracticalPairs: 0,
        students: [],
      },
    }));

    expect(view.hasClassrooms).toBe(true);
    expect(view.hasPublishedPracticals).toBe(false);
    expect(view.hasCompletionScope).toBe(false);
  });

  it("limits a class progress view to that classroom", () => {
    const base = overviewFixture();
    const view = buildTeacherProgressViewModel({
      ...base,
      classrooms: [
        ...base.classrooms,
        {
          ...base.classrooms[0],
          id: "class-2",
          name: "Systems Lab",
        },
      ],
      practicals: [
        ...base.practicals,
        {
          ...base.practicals[0],
          id: "practical-3",
          classroomId: "class-2",
          classroomName: "Systems Lab",
          title: "Processes",
        },
      ],
      progress: {
        ...base.progress,
        students: [
          ...base.progress.students,
          {
            ...base.progress.students[0],
            id: "student-3",
            name: "Student Three",
            email: "three@example.com",
            classroomIds: ["class-2"],
          },
        ],
      },
    }, "class-2");

    expect(view.selectedClassroom?.name).toBe("Systems Lab");
    expect(view.publishedPracticals.map((practical) => practical.title)).toEqual(["Processes"]);
    expect(view.students.map((student) => student.name)).toEqual(["Student Three"]);
  });
});
