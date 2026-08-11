import { randomUUID } from "node:crypto";
import { PlatformRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getClassroomForStudentById } from "@/data/classroom-repository";
import { prisma } from "@/lib/db/prisma";
import {
  AccessDeniedError,
  requirePublishedTaskForStudent,
} from "@/server/authorization/classroom-access";
import {
  deactivateStudentMembership,
  getTeacherClassroomRoster,
  reactivateStudentMembership,
  regenerateClassroomJoinCode,
} from "@/server/classrooms/roster";

vi.mock("server-only", () => ({}));

const suffix = randomUUID().slice(0, 8);
const teacherId = `roster-teacher-${suffix}`;
const otherTeacherId = `roster-other-teacher-${suffix}`;
const studentId = `roster-student-${suffix}`;
const classroomId = `roster-classroom-${suffix}`;
const membershipId = `roster-membership-${suffix}`;
const taskId = `roster-task-${suffix}`;
const sessionId = `roster-session-${suffix}`;
const draftId = `roster-draft-${suffix}`;
const runId = `roster-run-${suffix}`;
const resultId = `roster-result-${suffix}`;
const submissionId = `roster-submission-${suffix}`;
const reviewId = `roster-review-${suffix}`;
const initialJoinCode = `ROSTER-${suffix}`.toUpperCase();

describe.sequential("teacher roster controls", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: teacherId, name: "Roster Teacher", email: `${teacherId}@example.test`, platformRole: "TEACHER" },
        { id: otherTeacherId, name: "Other Roster Teacher", email: `${otherTeacherId}@example.test`, platformRole: "TEACHER" },
        { id: studentId, name: "Roster Student", email: `${studentId}@example.test`, platformRole: "STUDENT" },
      ],
    });
    await prisma.classroom.create({
      data: {
        id: classroomId,
        name: "Roster Classroom",
        subject: "Access control",
        section: "Test",
        ownerTeacherId: teacherId,
        joinCode: initialJoinCode,
        memberships: {
          create: {
            id: membershipId,
            userId: studentId,
            role: "STUDENT",
            active: true,
          },
        },
      },
    });
    await prisma.task.create({
      data: {
        id: taskId,
        classroomId,
        authorTeacherId: teacherId,
        title: "Roster Practical",
        instructions: "Preserve this historical attempt.",
        allowedLanguages: ["JAVA"],
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    await prisma.codingSession.create({
      data: {
        id: sessionId,
        taskId,
        studentId,
        attemptNumber: 1,
        status: "SUBMITTED",
        language: "JAVA",
        submittedAt: new Date(),
      },
    });
    await prisma.draft.create({
      data: {
        id: draftId,
        codingSessionId: sessionId,
        sourceCode: "class Main {}",
        revision: 1,
      },
    });
    await prisma.runAttempt.create({
      data: {
        id: runId,
        codingSessionId: sessionId,
        sequence: 1,
        language: "JAVA",
        sourceCodeSnapshot: "class Main {}",
        completedAt: new Date(),
      },
    });
    await prisma.resultSnapshot.create({
      data: {
        id: resultId,
        runAttemptId: runId,
        state: "COMPLETED",
        passedTests: 1,
        totalTests: 1,
        suggestedScore: 10,
        testResults: [],
      },
    });
    await prisma.submissionAttempt.create({
      data: {
        id: submissionId,
        taskId,
        studentId,
        codingSessionId: sessionId,
        resultSnapshotId: resultId,
        attemptNumber: 1,
        idempotencyKey: `roster-submit-${suffix}`,
        language: "JAVA",
        sourceCodeSnapshot: "class Main {}",
      },
    });
    await prisma.submissionReview.create({
      data: {
        id: reviewId,
        submissionAttemptId: submissionId,
        reviewerTeacherId: teacherId,
        feedback: "Historical feedback",
        marksAwarded: 9,
        marksOutOf: 10,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.membershipAuditEntry.deleteMany({ where: { classroomId } });
    await prisma.submissionReview.deleteMany({ where: { id: reviewId } });
    await prisma.submissionAttempt.deleteMany({ where: { id: submissionId } });
    await prisma.resultSnapshot.deleteMany({ where: { id: resultId } });
    await prisma.runAttempt.deleteMany({ where: { id: runId } });
    await prisma.draft.deleteMany({ where: { id: draftId } });
    await prisma.codingSession.deleteMany({ where: { id: sessionId } });
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.classMembership.deleteMany({ where: { id: membershipId } });
    await prisma.classroom.deleteMany({ where: { id: classroomId } });
    await prisma.user.deleteMany({ where: { id: { in: [teacherId, otherTeacherId, studentId] } } });
    await prisma.$disconnect();
  });

  it("returns active roster details only to the classroom owner", async () => {
    const roster = await getTeacherClassroomRoster(teacherId, classroomId);
    expect(roster.joinCode).toBe(initialJoinCode);
    expect(roster.students).toEqual([
      expect.objectContaining({
        membershipId,
        studentId,
        name: "Roster Student",
        status: "ACTIVE",
        submissionCount: 1,
        draftReviewCount: 0,
        publishedReviewCount: 1,
        latestSubmission: expect.objectContaining({ id: submissionId }),
      }),
    ]);
    expect(roster.inactiveStudents).toEqual([]);
    await expect(
      getTeacherClassroomRoster(otherTeacherId, classroomId),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      getTeacherClassroomRoster(studentId, classroomId),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("rejects student and non-owner teacher control attempts", async () => {
    await expect(
      deactivateStudentMembership(prisma, {
        actor: { id: studentId, role: PlatformRole.STUDENT },
        classroomId,
        membershipId,
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      deactivateStudentMembership(prisma, {
        actor: { id: otherTeacherId, role: PlatformRole.TEACHER },
        classroomId,
        membershipId,
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      regenerateClassroomJoinCode(prisma, {
        actor: { id: otherTeacherId, role: PlatformRole.TEACHER },
        classroomId,
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      prisma.classMembership.findUniqueOrThrow({ where: { id: membershipId } }),
    ).resolves.toMatchObject({ active: true });
    await expect(
      prisma.membershipAuditEntry.count({ where: { classroomId } }),
    ).resolves.toBe(0);
  });

  it("regenerates the unique join code without changing membership or history", async () => {
    const regenerated = await regenerateClassroomJoinCode(prisma, {
      actor: { id: teacherId, role: PlatformRole.TEACHER },
      classroomId,
    });
    expect(regenerated.joinCode).not.toBe(initialJoinCode);
    await expect(
      prisma.classroom.findUnique({ where: { joinCode: initialJoinCode } }),
    ).resolves.toBeNull();
    await expect(
      prisma.classroom.findUnique({ where: { joinCode: regenerated.joinCode } }),
    ).resolves.toMatchObject({ id: classroomId });
    await expect(
      prisma.submissionAttempt.count({ where: { id: submissionId } }),
    ).resolves.toBe(1);
  });

  it("deactivates access while preserving every historical record", async () => {
    await expect(
      getClassroomForStudentById(studentId, classroomId),
    ).resolves.not.toBeNull();
    await expect(
      requirePublishedTaskForStudent(prisma, studentId, taskId),
    ).resolves.toMatchObject({ id: taskId });

    await deactivateStudentMembership(prisma, {
      actor: { id: teacherId, role: PlatformRole.TEACHER },
      classroomId,
      membershipId,
    });

    await expect(
      prisma.membershipAuditEntry.findFirstOrThrow({
        where: { classroomId },
        orderBy: { createdAt: "desc" },
      }),
    ).resolves.toMatchObject({
      classroomId,
      membershipId,
      studentId,
      actorTeacherId: teacherId,
      action: "DEACTIVATED",
      reason: null,
    });

    await expect(
      getClassroomForStudentById(studentId, classroomId),
    ).resolves.toBeNull();
    await expect(
      requirePublishedTaskForStudent(prisma, studentId, taskId),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      getTeacherClassroomRoster(teacherId, classroomId),
    ).resolves.toMatchObject({
      students: [],
      inactiveStudents: [
        expect.objectContaining({
          membershipId,
          studentId,
          status: "INACTIVE",
          submissionCount: 1,
          publishedReviewCount: 1,
          latestSubmission: expect.objectContaining({ id: submissionId }),
        }),
      ],
      auditEntries: [
        expect.objectContaining({
          action: "DEACTIVATED",
          student: expect.objectContaining({ id: studentId }),
          actorTeacher: expect.objectContaining({ id: teacherId }),
        }),
      ],
    });

    const [membership, user, session, draft, submission, result, run, review] = await Promise.all([
      prisma.classMembership.findUniqueOrThrow({ where: { id: membershipId } }),
      prisma.user.findUniqueOrThrow({ where: { id: studentId } }),
      prisma.codingSession.findUniqueOrThrow({ where: { id: sessionId } }),
      prisma.draft.findUniqueOrThrow({ where: { id: draftId } }),
      prisma.submissionAttempt.findUniqueOrThrow({ where: { id: submissionId } }),
      prisma.resultSnapshot.findUniqueOrThrow({ where: { id: resultId } }),
      prisma.runAttempt.findUniqueOrThrow({ where: { id: runId } }),
      prisma.submissionReview.findUniqueOrThrow({ where: { id: reviewId } }),
    ]);
    expect(membership.active).toBe(false);
    expect(user.id).toBe(studentId);
    expect(session).toMatchObject({ id: sessionId, status: "SUBMITTED" });
    expect(draft).toMatchObject({ sourceCode: "class Main {}", revision: 1 });
    expect(submission.sourceCodeSnapshot).toBe("class Main {}");
    expect(result).toMatchObject({ passedTests: 1, totalTests: 1 });
    expect(run.sourceCodeSnapshot).toBe("class Main {}");
    expect(review).toMatchObject({
      feedback: "Historical feedback",
      marksAwarded: 9,
      status: "PUBLISHED",
    });
  });

  it("rejects student and non-owner teacher reactivation attempts", async () => {
    await expect(
      reactivateStudentMembership(prisma, {
        actor: { id: studentId, role: PlatformRole.STUDENT },
        classroomId,
        membershipId,
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      reactivateStudentMembership(prisma, {
        actor: { id: otherTeacherId, role: PlatformRole.TEACHER },
        classroomId,
        membershipId,
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      prisma.classMembership.findUniqueOrThrow({ where: { id: membershipId } }),
    ).resolves.toMatchObject({ active: false });
    await expect(
      prisma.membershipAuditEntry.count({ where: { classroomId } }),
    ).resolves.toBe(1);
  });

  it("reactivates the same membership and restores access without changing history", async () => {
    const reactivated = await reactivateStudentMembership(prisma, {
      actor: { id: teacherId, role: PlatformRole.TEACHER },
      classroomId,
      membershipId,
    });
    expect(reactivated).toEqual({ membershipId, studentId });

    await expect(
      prisma.membershipAuditEntry.findFirstOrThrow({
        where: { classroomId },
        orderBy: { createdAt: "desc" },
      }),
    ).resolves.toMatchObject({
      classroomId,
      membershipId,
      studentId,
      actorTeacherId: teacherId,
      action: "REACTIVATED",
      reason: null,
    });

    await expect(
      getClassroomForStudentById(studentId, classroomId),
    ).resolves.toMatchObject({ id: classroomId });
    await expect(
      requirePublishedTaskForStudent(prisma, studentId, taskId),
    ).resolves.toMatchObject({ id: taskId });
    await expect(
      prisma.classMembership.count({ where: { classroomId, userId: studentId } }),
    ).resolves.toBe(1);
    await expect(
      getTeacherClassroomRoster(teacherId, classroomId),
    ).resolves.toMatchObject({
      students: [
        expect.objectContaining({
          membershipId,
          status: "ACTIVE",
          submissionCount: 1,
          publishedReviewCount: 1,
        }),
      ],
      inactiveStudents: [],
      auditEntries: [
        expect.objectContaining({ action: "REACTIVATED" }),
        expect.objectContaining({ action: "DEACTIVATED" }),
      ],
    });

    const preservedCounts = await Promise.all([
      prisma.codingSession.count({ where: { id: sessionId } }),
      prisma.draft.count({ where: { id: draftId } }),
      prisma.runAttempt.count({ where: { id: runId } }),
      prisma.resultSnapshot.count({ where: { id: resultId } }),
      prisma.submissionAttempt.count({ where: { id: submissionId } }),
      prisma.submissionReview.count({ where: { id: reviewId } }),
    ]);
    expect(preservedCounts).toEqual([1, 1, 1, 1, 1, 1]);
    await expect(
      prisma.membershipAuditEntry.count({ where: { classroomId, membershipId } }),
    ).resolves.toBe(2);
  });
});
