import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { AccessDeniedError } from "@/server/authorization/classroom-access";
import { getTeacherPracticalAnalytics } from "@/server/teacher/practical-analytics";

vi.mock("server-only", () => ({}));

const suffix = randomUUID().slice(0, 8);
const teacherId = `analytics-teacher-${suffix}`;
const otherTeacherId = `analytics-other-teacher-${suffix}`;
const studentIds = [
  `analytics-student-a-${suffix}`,
  `analytics-student-b-${suffix}`,
  `analytics-student-c-${suffix}`,
];
const inactiveStudentId = `analytics-inactive-${suffix}`;
const classroomId = `analytics-classroom-${suffix}`;
const taskId = `analytics-task-${suffix}`;
const sessionIds = [
  `analytics-session-a-${suffix}`,
  `analytics-session-b-${suffix}`,
];
const runIds = [`analytics-run-a-${suffix}`, `analytics-run-b-${suffix}`];
const resultIds = [
  `analytics-result-a-${suffix}`,
  `analytics-result-b-${suffix}`,
];
const submissionIds = [
  `analytics-submission-a-${suffix}`,
  `analytics-submission-b-${suffix}`,
];
const reviewIds = [`analytics-review-a-${suffix}`, `analytics-review-b-${suffix}`];

describe.sequential("teacher practical analytics", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: teacherId, name: "Analytics Teacher", email: `${teacherId}@example.test`, platformRole: "TEACHER" },
        { id: otherTeacherId, name: "Other Analytics Teacher", email: `${otherTeacherId}@example.test`, platformRole: "TEACHER" },
        ...studentIds.map((id, index) => ({ id, name: `Analytics Student ${index + 1}`, email: `${id}@example.test`, platformRole: "STUDENT" as const })),
        { id: inactiveStudentId, name: "Inactive Analytics Student", email: `${inactiveStudentId}@example.test`, platformRole: "STUDENT" },
      ],
    });
    await prisma.classroom.create({
      data: {
        id: classroomId,
        name: "Analytics Classroom",
        subject: "Deterministic metrics",
        section: "Test",
        joinCode: `ANALYTICS-${suffix}`.toUpperCase(),
        ownerTeacherId: teacherId,
        memberships: {
          create: [
            ...studentIds.map((userId) => ({ userId, role: "STUDENT" as const })),
            { userId: inactiveStudentId, role: "STUDENT", active: false },
          ],
        },
      },
    });
    await prisma.task.create({
      data: {
        id: taskId,
        classroomId,
        authorTeacherId: teacherId,
        title: "Analytics Practical",
        instructions: "Use persisted attempts.",
        allowedLanguages: ["JAVA"],
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    for (let index = 0; index < 2; index += 1) {
      await prisma.codingSession.create({
        data: {
          id: sessionIds[index],
          taskId,
          studentId: studentIds[index],
          attemptNumber: 1,
          status: "SUBMITTED",
          language: "JAVA",
          submittedAt: new Date(),
        },
      });
      await prisma.runAttempt.create({
        data: {
          id: runIds[index],
          codingSessionId: sessionIds[index],
          sequence: 1,
          language: "JAVA",
          sourceCodeSnapshot: `class Main { /* ${index} */ }`,
          completedAt: new Date(),
        },
      });
      await prisma.resultSnapshot.create({
        data: index === 0
          ? {
              id: resultIds[index],
              runAttemptId: runIds[index],
              state: "COMPLETED",
              passedTests: 3,
              totalTests: 4,
              visiblePassedTests: 2,
              visibleTotalTests: 2,
              hiddenPassedTests: 1,
              hiddenTotalTests: 2,
              suggestedScore: 7.5,
              testResults: [],
            }
          : {
              id: resultIds[index],
              runAttemptId: runIds[index],
              state: "COMPLETED",
              passedTests: 1,
              totalTests: 2,
              testResults: [],
            },
      });
      await prisma.submissionAttempt.create({
        data: {
          id: submissionIds[index],
          taskId,
          studentId: studentIds[index],
          codingSessionId: sessionIds[index],
          resultSnapshotId: resultIds[index],
          attemptNumber: 1,
          idempotencyKey: `analytics-submit-${index}-${suffix}`,
          language: "JAVA",
          sourceCodeSnapshot: `class Main { /* ${index} */ }`,
        },
      });
    }
    await prisma.submissionReview.createMany({
      data: [
        {
          id: reviewIds[0],
          submissionAttemptId: submissionIds[0],
          reviewerTeacherId: teacherId,
          feedback: "Published feedback",
          marksAwarded: 8,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
        {
          id: reviewIds[1],
          submissionAttemptId: submissionIds[1],
          reviewerTeacherId: teacherId,
          feedback: "Private draft",
          marksAwarded: 5,
          status: "DRAFT",
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.submissionReview.deleteMany({ where: { id: { in: reviewIds } } });
    await prisma.submissionAttempt.deleteMany({ where: { id: { in: submissionIds } } });
    await prisma.resultSnapshot.deleteMany({ where: { id: { in: resultIds } } });
    await prisma.runAttempt.deleteMany({ where: { id: { in: runIds } } });
    await prisma.codingSession.deleteMany({ where: { id: { in: sessionIds } } });
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.classMembership.deleteMany({ where: { classroomId } });
    await prisma.classroom.deleteMany({ where: { id: classroomId } });
    await prisma.user.deleteMany({ where: { id: { in: [teacherId, otherTeacherId, ...studentIds, inactiveStudentId] } } });
    await prisma.$disconnect();
  });

  it("returns latest-attempt analytics for active students to the owner", async () => {
    const analytics = await getTeacherPracticalAnalytics(
      teacherId,
      classroomId,
      taskId,
    );

    expect(analytics).toMatchObject({
      activeStudentCount: 3,
      submittedStudentCount: 2,
      pendingStudentCount: 1,
      averageSuggestedScore: 6.3,
      visibleTests: { passed: 3, total: 4, passRate: 75 },
      hiddenTests: { passed: 1, total: 2, passRate: 50 },
      reviewedCount: 1,
      needsReviewCount: 1,
    });
    expect(analytics.attention.map((item) => item.student.id)).toEqual(studentIds);
    expect(JSON.stringify(analytics)).not.toContain("Private draft");
    expect(JSON.stringify(analytics)).not.toContain("expectedOutput");
  });

  it("rejects a non-owner teacher and a student", async () => {
    await expect(
      getTeacherPracticalAnalytics(otherTeacherId, classroomId, taskId),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      getTeacherPracticalAnalytics(studentIds[0], classroomId, taskId),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
