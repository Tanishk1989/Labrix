import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getStudentOverview } from "@/server/student/overview";
import {
  getSubmissionForStudent,
  getSubmissionForTeacher,
} from "@/server/attempts/service";
import { AccessDeniedError } from "@/server/authorization/classroom-access";
import {
  saveSubmissionReview,
  SubmissionReviewAccessError,
  SubmissionReviewValidationError,
} from "@/server/reviews/submission-review";

vi.mock("server-only", () => ({}));

const suffix = randomUUID().slice(0, 8);
const teacherId = `review-teacher-${suffix}`;
const otherTeacherId = `review-other-teacher-${suffix}`;
const studentId = `review-student-${suffix}`;
const otherStudentId = `review-other-student-${suffix}`;
const classroomId = `review-classroom-${suffix}`;
const taskId = `review-task-${suffix}`;
const submissionIds = [`review-submission-1-${suffix}`, `review-submission-2-${suffix}`];
const sessionIds = [`review-session-1-${suffix}`, `review-session-2-${suffix}`];
const runIds = [`review-run-1-${suffix}`, `review-run-2-${suffix}`];
const resultIds = [`review-result-1-${suffix}`, `review-result-2-${suffix}`];

describe.sequential("teacher submission reviews", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: teacherId, name: "Review Teacher", email: `${teacherId}@demo.labrix.local`, platformRole: "TEACHER" },
        { id: otherTeacherId, name: "Other Teacher", email: `${otherTeacherId}@demo.labrix.local`, platformRole: "TEACHER" },
        { id: studentId, name: "Review Student", email: `${studentId}@demo.labrix.local`, platformRole: "STUDENT" },
        { id: otherStudentId, name: "Other Student", email: `${otherStudentId}@demo.labrix.local`, platformRole: "STUDENT" },
      ],
    });
    await prisma.classroom.create({
      data: {
        id: classroomId,
        name: "Review classroom",
        subject: "Review safety",
        section: "Test",
        joinCode: `REVIEW-${suffix}`,
        ownerTeacherId: teacherId,
        memberships: {
          create: [
            { userId: teacherId, role: "TEACHER" },
            { userId: studentId, role: "STUDENT" },
            { userId: otherStudentId, role: "STUDENT" },
          ],
        },
      },
    });
    await prisma.task.create({
      data: {
        id: taskId,
        classroomId,
        authorTeacherId: teacherId,
        title: "Review practical",
        instructions: "Submit a solution.",
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
          studentId,
          attemptNumber: index + 1,
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
          sourceCodeSnapshot: `class Main { /* attempt ${index + 1} */ }`,
          completedAt: new Date(),
        },
      });
      await prisma.resultSnapshot.create({
        data: {
          id: resultIds[index],
          runAttemptId: runIds[index],
          state: "COMPLETED",
          passedTests: index + 1,
          totalTests: 2,
          testResults: [],
        },
      });
      await prisma.submissionAttempt.create({
        data: {
          id: submissionIds[index],
          taskId,
          studentId,
          codingSessionId: sessionIds[index],
          resultSnapshotId: resultIds[index],
          attemptNumber: index + 1,
          idempotencyKey: `review-key-${index + 1}-${suffix}`,
          language: "JAVA",
          sourceCodeSnapshot: `class Main { /* attempt ${index + 1} */ }`,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.submissionReview.deleteMany({ where: { submissionAttemptId: { in: submissionIds } } });
    await prisma.submissionAttempt.deleteMany({ where: { id: { in: submissionIds } } });
    await prisma.resultSnapshot.deleteMany({ where: { id: { in: resultIds } } });
    await prisma.runAttempt.deleteMany({ where: { id: { in: runIds } } });
    await prisma.codingSession.deleteMany({ where: { id: { in: sessionIds } } });
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.classMembership.deleteMany({ where: { classroomId } });
    await prisma.classroom.deleteMany({ where: { id: classroomId } });
    await prisma.user.deleteMany({ where: { id: { in: [teacherId, otherTeacherId, studentId, otherStudentId] } } });
    await prisma.$disconnect();
  });

  it("allows the classroom-owning teacher to save a draft review", async () => {
    const review = await saveSubmissionReview(prisma, {
      actor: { id: teacherId, role: "TEACHER" },
      submissionAttemptId: submissionIds[0],
      feedback: "Good direction; explain the edge case.",
      marksAwarded: 7,
      intent: "DRAFT",
    });
    expect(review).toMatchObject({
      submissionAttemptId: submissionIds[0],
      reviewerTeacherId: teacherId,
      marksAwarded: 7,
      marksOutOf: 10,
      status: "DRAFT",
      publishedAt: null,
    });
  });

  it("rejects another teacher and a student", async () => {
    await expect(
      saveSubmissionReview(prisma, {
        actor: { id: otherTeacherId, role: "TEACHER" },
        submissionAttemptId: submissionIds[0],
        feedback: "Not allowed",
        marksAwarded: 5,
        intent: "DRAFT",
      }),
    ).rejects.toBeInstanceOf(SubmissionReviewAccessError);
    await expect(
      saveSubmissionReview(prisma, {
        actor: { id: studentId, role: "STUDENT" },
        submissionAttemptId: submissionIds[0],
        feedback: "Student edit",
        marksAwarded: 10,
        intent: "PUBLISHED",
      }),
    ).rejects.toBeInstanceOf(SubmissionReviewAccessError);
  });

  it.each([-1, 11])("rejects marks outside the fixed scale: %s", async (marksAwarded) => {
    await expect(
      saveSubmissionReview(prisma, {
        actor: { id: teacherId, role: "TEACHER" },
        submissionAttemptId: submissionIds[0],
        feedback: "Invalid marks",
        marksAwarded,
        intent: "DRAFT",
      }),
    ).rejects.toBeInstanceOf(SubmissionReviewValidationError);
  });

  it("hides drafts from the student while retaining teacher visibility", async () => {
    const [teacherView, studentView] = await Promise.all([
      getSubmissionForTeacher(teacherId, submissionIds[0]),
      getSubmissionForStudent(studentId, submissionIds[0]),
    ]);
    expect(teacherView.review?.status).toBe("DRAFT");
    expect(studentView.review).toBeNull();
    const overview = await getStudentOverview(studentId);
    const attempt = overview.submissions.find(
      (item) => item.id === submissionIds[0],
    );
    expect(attempt).toMatchObject({
      suggestedScore: 5,
      visiblePassedTests: 1,
      visibleTotalTests: 2,
      hiddenPassedTests: 0,
      hiddenTotalTests: 0,
      publishedReviewExists: false,
    });
    expect(JSON.stringify(overview)).not.toContain(
      "Good direction; explain the edge case.",
    );
  });

  it("publishes feedback only to the owner student", async () => {
    await saveSubmissionReview(prisma, {
      actor: { id: teacherId, role: "TEACHER" },
      submissionAttemptId: submissionIds[0],
      feedback: "Correct approach. Add clearer variable names.",
      marksAwarded: 8,
      intent: "PUBLISHED",
    });
    const studentView = await getSubmissionForStudent(studentId, submissionIds[0]);
    expect(studentView.review).toMatchObject({
      status: "PUBLISHED",
      marksAwarded: 8,
      marksOutOf: 10,
      feedback: "Correct approach. Add clearer variable names.",
    });
    const overview = await getStudentOverview(studentId);
    expect(
      overview.submissions.find((item) => item.id === submissionIds[0])
        ?.publishedReviewExists,
    ).toBe(true);
    await expect(
      getSubmissionForStudent(otherStudentId, submissionIds[0]),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("keeps reviews separate across resubmissions", async () => {
    await saveSubmissionReview(prisma, {
      actor: { id: teacherId, role: "TEACHER" },
      submissionAttemptId: submissionIds[1],
      feedback: "Second attempt improved.",
      marksAwarded: 9,
      intent: "PUBLISHED",
    });
    const reviews = await prisma.submissionReview.findMany({
      where: { submissionAttemptId: { in: submissionIds } },
      orderBy: { submissionAttemptId: "asc" },
    });
    expect(reviews).toHaveLength(2);
    expect(new Set(reviews.map((review) => review.submissionAttemptId))).toEqual(
      new Set(submissionIds),
    );
  });

  it("does not mutate the immutable submission or result snapshot", async () => {
    const submission = await prisma.submissionAttempt.findUniqueOrThrow({
      where: { id: submissionIds[0] },
    });
    const result = await prisma.resultSnapshot.findUniqueOrThrow({
      where: { id: resultIds[0] },
    });
    expect(submission).toMatchObject({
      sourceCodeSnapshot: "class Main { /* attempt 1 */ }",
      resultSnapshotId: resultIds[0],
      attemptNumber: 1,
    });
    expect(result).toMatchObject({ passedTests: 1, totalTests: 2 });
  });
});
