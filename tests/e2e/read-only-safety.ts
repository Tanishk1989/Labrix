import type { Page } from "@playwright/test";
import { prisma } from "../../src/lib/db/prisma";

const readMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function monitorApplicationMutations(page: Page) {
  const mutationRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.origin === "http://127.0.0.1:3000" &&
      !readMethods.has(request.method())
    ) {
      mutationRequests.push(`${request.method()} ${url.pathname}`);
    }
  });
  return mutationRequests;
}

export async function captureDatabaseFingerprint() {
  const [
    users,
    identities,
    classrooms,
    memberships,
    membershipAudit,
    tasks,
    testCases,
    sessions,
    drafts,
    runs,
    results,
    submissions,
    reviews,
    events,
  ] = await Promise.all([
    prisma.user.aggregate({ _count: true, _max: { updatedAt: true } }),
    prisma.externalIdentity.aggregate({
      _count: true,
      _max: { updatedAt: true },
    }),
    prisma.classroom.aggregate({ _count: true, _max: { updatedAt: true } }),
    prisma.classMembership.aggregate({
      _count: true,
      _max: { joinedAt: true },
    }),
    prisma.membershipAuditEntry.aggregate({
      _count: true,
      _max: { createdAt: true },
    }),
    prisma.task.aggregate({ _count: true, _max: { updatedAt: true } }),
    prisma.testCase.aggregate({ _count: true, _max: { updatedAt: true } }),
    prisma.codingSession.aggregate({
      _count: true,
      _max: { updatedAt: true },
    }),
    prisma.draft.aggregate({ _count: true, _max: { updatedAt: true } }),
    prisma.runAttempt.aggregate({ _count: true, _max: { completedAt: true } }),
    prisma.resultSnapshot.aggregate({ _count: true, _max: { createdAt: true } }),
    prisma.submissionAttempt.aggregate({
      _count: true,
      _max: { submittedAt: true },
    }),
    prisma.submissionReview.aggregate({
      _count: true,
      _max: { updatedAt: true },
    }),
    prisma.codeEvent.aggregate({ _count: true, _max: { occurredAt: true } }),
  ]);
  return JSON.stringify({
    users,
    identities,
    classrooms,
    memberships,
    membershipAudit,
    tasks,
    testCases,
    sessions,
    drafts,
    runs,
    results,
    submissions,
    reviews,
    events,
  });
}

export async function requireReadOnlyFixtures() {
  const studentId = process.env.LABRIX_READ_ONLY_STUDENT_ID ?? "demo-student-1";
  const taskId = process.env.LABRIX_READ_ONLY_TASK_ID ?? "two-sum";
  const [task, session, submission] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        classroom: { select: { id: true, name: true } },
      },
    }),
    prisma.codingSession.findFirst({
      where: { studentId, taskId, status: "ACTIVE" },
      select: { id: true },
    }),
    prisma.submissionAttempt.findFirst({
      where: { studentId, taskId },
      orderBy: { submittedAt: "desc" },
      select: { id: true },
    }),
  ]);
  if (!task || !session || !submission) {
    throw new Error(
      "Read-only acceptance requires an existing active coding session and immutable submission for the configured student/task; it will not create them.",
    );
  }
  return {
    classroomId: task.classroom.id,
    classroomName: task.classroom.name,
    sessionId: session.id,
    submissionId: submission.id,
    studentId,
    taskId,
    taskTitle: task.title,
  };
}

export async function hiddenTestValues(taskId: string) {
  return prisma.testCase.findMany({
    where: { taskId, visible: false },
    select: { id: true },
  });
}

export function disconnectReadOnlyDatabase() {
  return prisma.$disconnect();
}
