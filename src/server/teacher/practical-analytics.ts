import "server-only";

import type { RunResultState, SubmissionReviewStatus } from "@prisma/client";
import {
  buildIntegrityReviewSignal,
  type IntegrityReviewCategory,
} from "@/domain/evidence/integrity-review-signals";
import { buildSubmissionEvidenceFacts } from "@/domain/evidence/submission-evidence";
import { prisma } from "@/lib/db/prisma";
import { snapshotBreakdown } from "@/server/attempts/service";
import { AccessDeniedError, requireOwnedClassroom } from "@/server/authorization/classroom-access";

export const LOW_SUGGESTED_SCORE_THRESHOLD = 5;
export const TOP_VERIFIED_SCORE_THRESHOLD = 8;
export const TEACHER_ATTENTION_GROUP_LIMIT = 5;

export type PracticalAnalyticsAttentionReason =
  | "NO_SUBMISSION"
  | "LOW_SUGGESTED_SCORE"
  | "FAILED_HIDDEN_TESTS"
  | "NEEDS_REVIEW"
  | "HIGH_REVIEW_PRIORITY";

export type PracticalAnalyticsTopVerifiedReason =
  | "HIGH_SUGGESTED_SCORE"
  | "NO_HIGH_REVIEW_PRIORITY"
  | "HIDDEN_AGGREGATE_PASSED"
  | "HIDDEN_AGGREGATE_NOT_APPLICABLE"
  | "HIDDEN_AGGREGATE_UNAVAILABLE"
  | "REVIEW_PUBLISHED";

export type PracticalAnalyticsHiddenAggregate =
  | { availability: "AVAILABLE"; passed: number; total: number }
  | { availability: "UNAVAILABLE"; passed: null; total: null };

export type PracticalAnalyticsReviewStatus =
  | SubmissionReviewStatus
  | "NOT_REVIEWED"
  | "NOT_APPLICABLE";

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
  integrityCategory: IntegrityReviewCategory;
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
  hiddenAggregate: PracticalAnalyticsHiddenAggregate;
  reviewStatus: PracticalAnalyticsReviewStatus;
  integrityCategory: IntegrityReviewCategory | null;
  reasons: PracticalAnalyticsAttentionReason[];
};

export type PracticalAnalyticsTopVerifiedItem = {
  student: PracticalAnalyticsStudent;
  submissionId: string;
  attemptNumber: number;
  suggestedScore: number;
  hiddenAggregate: PracticalAnalyticsHiddenAggregate;
  reviewStatus: "PUBLISHED";
  integrityCategory: Exclude<
    IntegrityReviewCategory,
    "HIGH_REVIEW_PRIORITY"
  >;
  reasons: PracticalAnalyticsTopVerifiedReason[];
};

function percentage(passed: number, total: number) {
  return total > 0 ? Math.round((passed / total) * 1_000) / 10 : null;
}

function oneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function hiddenAggregate(
  result: PracticalAnalyticsAttempt["result"],
): PracticalAnalyticsHiddenAggregate {
  if (
    result.hiddenPassedTests === null ||
    result.hiddenTotalTests === null ||
    result.hiddenPassedTests < 0 ||
    result.hiddenTotalTests < 0 ||
    result.hiddenPassedTests > result.hiddenTotalTests
  ) {
    return { availability: "UNAVAILABLE", passed: null, total: null };
  }
  return {
    availability: "AVAILABLE",
    passed: result.hiddenPassedTests,
    total: result.hiddenTotalTests,
  };
}

function reviewStatus(
  status: SubmissionReviewStatus | null,
): PracticalAnalyticsReviewStatus {
  return status ?? "NOT_REVIEWED";
}

function compareStudentName(
  left: { student: PracticalAnalyticsStudent },
  right: { student: PracticalAnalyticsStudent },
) {
  return left.student.name.localeCompare(right.student.name, "en");
}

const attentionReasonPriority: Record<PracticalAnalyticsAttentionReason, number> = {
  HIGH_REVIEW_PRIORITY: 0,
  NO_SUBMISSION: 1,
  FAILED_HIDDEN_TESTS: 2,
  LOW_SUGGESTED_SCORE: 3,
  NEEDS_REVIEW: 4,
};

function attentionPriority(item: PracticalAnalyticsAttentionItem) {
  return Math.min(...item.reasons.map((reason) => attentionReasonPriority[reason]));
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
  let latestAttemptNumberTotal = 0;
  let resubmittedStudentCount = 0;
  const reviewStatusCounts = { published: 0, draft: 0, unreviewed: 0 };
  const integritySignalCounts: Record<IntegrityReviewCategory, number> = {
    LOW_ATTENTION: 0,
    REVIEW_RECOMMENDED: 0,
    HIGH_REVIEW_PRIORITY: 0,
  };

  const attention: PracticalAnalyticsAttentionItem[] = [];
  const topVerifiedPerformers: PracticalAnalyticsTopVerifiedItem[] = [];
  for (const student of students) {
    const attempt = latestByStudent.get(student.id);
    if (!attempt) {
      attention.push({
        student,
        submissionId: null,
        attemptNumber: null,
        suggestedScore: null,
        hiddenAggregate: {
          availability: "UNAVAILABLE",
          passed: null,
          total: null,
        },
        reviewStatus: "NOT_APPLICABLE",
        integrityCategory: null,
        reasons: ["NO_SUBMISSION"],
      });
      continue;
    }

    const breakdown = snapshotBreakdown(attempt.result);
    latestAttemptNumberTotal += attempt.attemptNumber;
    if (attempt.attemptNumber > 1) resubmittedStudentCount += 1;
    suggestedScoreTotal += breakdown.suggestedScore;
    visiblePassed += breakdown.visiblePassedTests;
    visibleTotal += breakdown.visibleTotalTests;
    hiddenPassed += breakdown.hiddenPassedTests;
    hiddenTotal += breakdown.hiddenTotalTests;
    if (attempt.reviewStatus === "PUBLISHED") reviewedCount += 1;
    if (attempt.reviewStatus === "PUBLISHED") reviewStatusCounts.published += 1;
    else if (attempt.reviewStatus === "DRAFT") reviewStatusCounts.draft += 1;
    else reviewStatusCounts.unreviewed += 1;
    integritySignalCounts[attempt.integrityCategory] += 1;
    const attemptHiddenAggregate = hiddenAggregate(attempt.result);
    const failedAvailableHiddenAggregate =
      attemptHiddenAggregate.availability === "AVAILABLE" &&
      attemptHiddenAggregate.total > 0 &&
      attemptHiddenAggregate.passed < attemptHiddenAggregate.total;

    if (
      breakdown.suggestedScore >= TOP_VERIFIED_SCORE_THRESHOLD &&
      attempt.reviewStatus === "PUBLISHED" &&
      attempt.integrityCategory !== "HIGH_REVIEW_PRIORITY" &&
      !failedAvailableHiddenAggregate
    ) {
      const hiddenReason: PracticalAnalyticsTopVerifiedReason =
        attemptHiddenAggregate.availability === "UNAVAILABLE"
          ? "HIDDEN_AGGREGATE_UNAVAILABLE"
          : attemptHiddenAggregate.total === 0
            ? "HIDDEN_AGGREGATE_NOT_APPLICABLE"
            : "HIDDEN_AGGREGATE_PASSED";
      topVerifiedPerformers.push({
        student,
        submissionId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        suggestedScore: breakdown.suggestedScore,
        hiddenAggregate: attemptHiddenAggregate,
        reviewStatus: "PUBLISHED",
        integrityCategory: attempt.integrityCategory,
        reasons: [
          "HIGH_SUGGESTED_SCORE",
          "NO_HIGH_REVIEW_PRIORITY",
          hiddenReason,
          "REVIEW_PUBLISHED",
        ],
      });
    }

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
    if (attempt.integrityCategory === "HIGH_REVIEW_PRIORITY") {
      reasons.push("HIGH_REVIEW_PRIORITY");
    }

    if (reasons.length) {
      attention.push({
        student,
        submissionId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        suggestedScore: breakdown.suggestedScore,
        hiddenAggregate: attemptHiddenAggregate,
        reviewStatus: reviewStatus(attempt.reviewStatus),
        integrityCategory: attempt.integrityCategory,
        reasons,
      });
    }
  }

  const submittedCount = latestByStudent.size;
  const orderedTopVerifiedPerformers = [...topVerifiedPerformers].sort(
    (left, right) =>
      right.suggestedScore - left.suggestedScore ||
      right.attemptNumber - left.attemptNumber ||
      compareStudentName(left, right),
  );
  const orderedAttention = [...attention].sort(
    (left, right) =>
      attentionPriority(left) - attentionPriority(right) ||
      compareStudentName(left, right),
  );
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
    anonymizedAttemptStatistics: {
      latestAttemptNumberAverage:
        submittedCount > 0
          ? oneDecimal(latestAttemptNumberTotal / submittedCount)
          : null,
      resubmittedStudentCount,
    },
    reviewStatusCounts,
    integritySignalCounts,
    topVerifiedPerformers: orderedTopVerifiedPerformers,
    attention: orderedAttention,
    groups: {
      topVerifiedPerformers: {
        totalCount: orderedTopVerifiedPerformers.length,
        items: orderedTopVerifiedPerformers.slice(
          0,
          TEACHER_ATTENTION_GROUP_LIMIT,
        ),
      },
      needsAttention: {
        totalCount: orderedAttention.length,
        items: orderedAttention.slice(0, TEACHER_ATTENTION_GROUP_LIMIT),
      },
    },
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
    select: { id: true, title: true, instructions: true },
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
          timingStatus: true,
          practicalVersion: true,
          sourceCodeSnapshot: true,
          review: { select: { status: true } },
          resultSnapshot: {
            select: {
              runAttemptId: true,
              state: true,
              executionMode: true,
              passedTests: true,
              totalTests: true,
              visiblePassedTests: true,
              visibleTotalTests: true,
              hiddenPassedTests: true,
              hiddenTotalTests: true,
              suggestedScore: true,
            },
          },
          codingSession: {
            select: {
              startedAt: true,
              runs: {
                orderBy: { sequence: "asc" },
                select: {
                  id: true,
                  sequence: true,
                  sourceCodeSnapshot: true,
                  requestedAt: true,
                  completedAt: true,
                  resultSnapshot: {
                    select: {
                      state: true,
                      passedTests: true,
                      totalTests: true,
                    },
                  },
                },
              },
              events: {
                orderBy: { sequence: "asc" },
                select: { sequence: true, type: true, occurredAt: true },
              },
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
      attempts.map((attempt) => {
        const facts = buildSubmissionEvidenceFacts({
          submission: {
            sourceCodeSnapshot: attempt.sourceCodeSnapshot,
            submittedAt: attempt.submittedAt,
            timingStatus: attempt.timingStatus,
            practicalVersion: attempt.practicalVersion,
            resultRunAttemptId: attempt.resultSnapshot.runAttemptId,
          },
          result: attempt.resultSnapshot,
          session: attempt.codingSession,
        });
        return {
          id: attempt.id,
          studentId: attempt.studentId,
          attemptNumber: attempt.attemptNumber,
          submittedAt: attempt.submittedAt,
          reviewStatus: attempt.review?.status ?? null,
          integrityCategory: buildIntegrityReviewSignal(facts).category,
          result: attempt.resultSnapshot,
        };
      }),
    ),
  };
}
