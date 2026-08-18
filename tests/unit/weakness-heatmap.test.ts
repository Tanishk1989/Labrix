import { describe, expect, it } from "vitest";
import { buildClassWeaknessHeatmap, CORE_CONCEPTS } from "@/features/progress/weakness-heatmap";
import type { TeacherOverview } from "@/server/teacher/overview";

function testOverviewFixture(): TeacherOverview {
  return {
    summary: {
      classroomCount: 1,
      distinctStudentCount: 2,
      publishedPracticalCount: 2,
      submissionAttemptCount: 2,
      needsReviewCount: 1,
    },
    classrooms: [
      {
        id: "class-1",
        name: "Data Structures Lab",
        subject: "CS102",
        section: "A",
        studentCount: 2,
        publishedPracticalCount: 2,
        completionPercentage: 100,
        activePracticalTitle: "Balanced Brackets",
        outstandingStudentCount: 0,
      },
    ],
    practicals: [
      {
        id: "practical-1",
        classroomId: "class-1",
        classroomName: "Data Structures Lab",
        classroomSubject: "CS102",
        title: "Balanced Brackets",
        status: "PUBLISHED",
        deadline: null,
        testCount: 4,
        studentCount: 2,
        submittedCount: 2,
        completionPercentage: 100,
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    ],
    submissions: [
      {
        id: "sub-1",
        studentId: "student-1",
        studentName: "Aarav Sharma",
        classroomId: "class-1",
        classroomName: "Data Structures Lab",
        classroomSubject: "CS102",
        taskId: "practical-1",
        taskTitle: "Balanced Brackets",
        attemptNumber: 1,
        language: "CPP",
        submittedAt: "2026-08-02T10:00:00.000Z",
        state: "COMPLETED",
        passedTests: 4,
        totalTests: 4,
        suggestedScore: 10,
        teacherMarks: { awarded: 10, outOf: 10 },
        reviewStatus: "PUBLISHED_FEEDBACK",
      },
      {
        id: "sub-2",
        studentId: "student-2",
        studentName: "Priya Patel",
        classroomId: "class-1",
        classroomName: "Data Structures Lab",
        classroomSubject: "CS102",
        taskId: "practical-1",
        taskTitle: "Balanced Brackets",
        attemptNumber: 2,
        language: "JAVA",
        submittedAt: "2026-08-02T11:00:00.000Z",
        state: "COMPLETED",
        passedTests: 2,
        totalTests: 4,
        suggestedScore: 5,
        teacherMarks: null,
        reviewStatus: "NEEDS_REVIEW",
      },
    ],
    attention: [],
    progress: {
      eligibleStudentCount: 2,
      overallCompletionPercentage: 100,
      completedStudentPracticalPairs: 2,
      totalStudentPracticalPairs: 2,
      students: [
        {
          id: "student-1",
          name: "Aarav Sharma",
          email: "aarav@example.edu",
          classroomIds: ["class-1"],
          submittedPracticalCount: 1,
          availablePracticalCount: 1,
          completionPercentage: 100,
          latestActivityAt: "2026-08-02T10:00:00.000Z",
        },
        {
          id: "student-2",
          name: "Priya Patel",
          email: "priya@example.edu",
          classroomIds: ["class-1"],
          submittedPracticalCount: 1,
          availablePracticalCount: 1,
          completionPercentage: 100,
          latestActivityAt: "2026-08-02T11:00:00.000Z",
        },
      ],
    },
  };
}

describe("buildClassWeaknessHeatmap", () => {
  it("computes concept mastery scores and overall class diagnostics", () => {
    const overview = testOverviewFixture();
    const result = buildClassWeaknessHeatmap(overview);

    expect(result.profiles.length).toBe(2);
    expect(result.classAverageMastery).toBeGreaterThan(0);
    expect(result.topClassBottleneck).toBeDefined();
    expect(result.topClassBottleneck?.concept).toBeDefined();

    // Check student 1 (full score)
    const s1 = result.profiles.find((p) => p.studentId === "student-1")!;
    expect(s1.overallMasteryPercentage).toBeGreaterThanOrEqual(80);
    expect(s1.riskStatus).toBe("EXCELLING");

    // Check student 2 (partial failure)
    const s2 = result.profiles.find((p) => p.studentId === "student-2")!;
    expect(s2.riskStatus).not.toBe("EXCELLING");
    expect(s2.concepts.BOUNDARY_CONDITIONS).toBeDefined();
  });

  it("handles empty student or submission lists safely", () => {
    const emptyOverview: TeacherOverview = {
      summary: { classroomCount: 0, distinctStudentCount: 0, publishedPracticalCount: 0, submissionAttemptCount: 0, needsReviewCount: 0 },
      classrooms: [],
      practicals: [],
      submissions: [],
      attention: [],
      progress: { eligibleStudentCount: 0, overallCompletionPercentage: 0, completedStudentPracticalPairs: 0, totalStudentPracticalPairs: 0, students: [] },
    };

    const result = buildClassWeaknessHeatmap(emptyOverview);
    expect(result.profiles).toEqual([]);
    expect(result.classAverageMastery).toBe(0);
    expect(result.totalAtRiskStudents).toBe(0);
  });

  it("exports 5 distinct core CS concepts", () => {
    expect(CORE_CONCEPTS.length).toBe(5);
    expect(CORE_CONCEPTS.map((c) => c.id)).toContain("BOUNDARY_CONDITIONS");
    expect(CORE_CONCEPTS.map((c) => c.id)).toContain("DATA_STRUCTURE_INVARIANTS");
  });
});
