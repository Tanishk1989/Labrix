import "server-only";

import type { RunResultState, SubmissionReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { snapshotBreakdown } from "@/server/attempts/service";
import { AccessDeniedError, requireOwnedClassroom } from "@/server/authorization/classroom-access";

export const LOW_SUGGESTED_SCORE_THRESHOLD = 5;

export type PracticalAnalyticsAttentionReason =
  | "NO_SUBMISSION"
  | "LOW_SUGGESTED_SCORE"
  | "FAILED_HIDDEN_TESTS"
  | "NEEDS_REVIEW";

export type PracticalAnalyticsStudent = {
  id: string;
  name: string;
  email: string;
};

export type PracticalAnalyticsAttempt = {
  id: string;
  studentId: string;
  attemptNumber: number;
  submittedAt: Date;
  reviewStatus: SubmissionReviewStatus | null;
  result: {
    state: RunResultState;
    passedTests: number;
    totalTests: number;
    visiblePassedTests: number | null;
    visibleTotalTests: number | null;
    hiddenPassedTests: number | null;
    hiddenTotalTests: number | null;
    suggestedScore: number | null;
  };
};

export type PracticalAnalyticsAttentionItem = {
  student: PracticalAnalyticsStudent;
  submissionId: string | null;
  attemptNumber: number | null;
  suggestedScore: number | null;
  reasons: PracticalAnalyticsAttentionReason[];
};

function percentage(passed: number, total: number) {
  return total > 0 ? Math.round((passed / total) * 1_000) / 10 : null;
}

function oneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function buildPracticalAnalytics(
  students: PracticalAnalyticsStudent[],
  attempts: PracticalAnalyticsAttempt[],
) {
  const latestByStudent = new Map<string, PracticalAnalyticsAttempt>();
  for (const attempt of attempts) {
    const current = latestByStudent.get(attempt.studentId);
    if (!current || attempt.attemptNumber > current.attemptNumber) {
      latestByStudent.set(attempt.studentId, attempt);
    }
  }

  let suggestedScoreTotal = 0;
  let visiblePassed = 0;
  let visibleTotal = 0;
  let hiddenPassed = 0;
  let hiddenTotal = 0;
  let reviewedCount = 0;

  const attention: PracticalAnalyticsAttentionItem[] = [];
  for (const student of students) {
    const attempt = latestByStudent.get(student.id);
    if (!attempt) {
      attention.push({
        student,
        submissionId: null,
        attemptNumber: null,
        suggestedScore: null,
        reasons: ["NO_SUBMISSION"],
      });
      continue;
    }

    const breakdown = snapshotBreakdown(attempt.result);
    suggestedScoreTotal += breakdown.suggestedScore;
    visiblePassed += breakdown.visiblePassedTests;
    visibleTotal += breakdown.visibleTotalTests;
    hiddenPassed += breakdown.hiddenPassedTests;
    hiddenTotal += breakdown.hiddenTotalTests;
    if (attempt.reviewStatus === "PUBLISHED") reviewedCount += 1;

    const reasons: PracticalAnalyticsAttentionReason[] = [];
    if (breakdown.suggestedScore < LOW_SUGGESTED_SCORE_THRESHOLD) {
      reasons.push("LOW_SUGGESTED_SCORE");
    }
    if (
      breakdown.hiddenTotalTests > 0 &&
      breakdown.hiddenPassedTests < breakdown.hiddenTotalTests
    ) {
      reasons.push("FAILED_HIDDEN_TESTS");
    }
    if (attempt.reviewStatus !== "PUBLISHED") reasons.push("NEEDS_REVIEW");

    if (reasons.length) {
      attention.push({
        student,
        submissionId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        suggestedScore: breakdown.suggestedScore,
        reasons,
      });
    }
  }

  const submittedCount = latestByStudent.size;
  return {
    activeStudentCount: students.length,
    submittedStudentCount: submittedCount,
    pendingStudentCount: students.length - submittedCount,
    averageSuggestedScore:
      submittedCount > 0 ? oneDecimal(suggestedScoreTotal / submittedCount) : null,
    visibleTests: {
      passed: visiblePassed,
      total: visibleTotal,
      passRate: percentage(visiblePassed, visibleTotal),
    },
    hiddenTests: {
      passed: hiddenPassed,
      total: hiddenTotal,
      passRate: percentage(hiddenPassed, hiddenTotal),
    },
    reviewedCount,
    needsReviewCount: submittedCount - reviewedCount,
    attention,
  };
}

export async function getTeacherPracticalAnalytics(
  teacherId: string,
  classroomId: string,
  taskId: string,
) {
  await requireOwnedClassroom(prisma, teacherId, classroomId);

  const task = await prisma.task.findFirst({
    where: { id: taskId, classroomId, status: "PUBLISHED" },
    select: { id: true, title: true },
  });
  if (!task) throw new AccessDeniedError();

  const memberships = await prisma.classMembership.findMany({
    where: { classroomId, role: "STUDENT", active: true },
    orderBy: { joinedAt: "asc" },
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  const students = memberships.map((membership) => membership.user);
  const attempts = students.length
    ? await prisma.submissionAttempt.findMany({
        where: { taskId, studentId: { in: students.map((student) => student.id) } },
        orderBy: [{ attemptNumber: "desc" }, { submittedAt: "desc" }],
        select: {
          id: true,
          studentId: true,
          attemptNumber: true,
          submittedAt: true,
          review: { select: { status: true } },
          resultSnapshot: {
            select: {
              state: true,
              passedTests: true,
              totalTests: true,
              visiblePassedTests: true,
              visibleTotalTests: true,
              hiddenPassedTests: true,
              hiddenTotalTests: true,
              suggestedScore: true,
            },
          },
        },
      })
    : [];

  return {
    classroom: { id: classroomId },
    task,
    ...buildPracticalAnalytics(
      students,
      attempts.map((attempt) => ({
        id: attempt.id,
        studentId: attempt.studentId,
        attemptNumber: attempt.attemptNumber,
        submittedAt: attempt.submittedAt,
        reviewStatus: attempt.review?.status ?? null,
        result: attempt.resultSnapshot,
      })),
    ),
  };
}
