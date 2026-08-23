import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function requireConfirmation() {
  if (!process.argv.includes("--confirm") && !process.argv.includes("--dry-run")) {
    throw new Error(
      "Refusing to remove data without --confirm. This command deletes only TRACE demo and automated-test fixtures.",
    );
  }
}

async function main() {
  requireConfirmation();
  const dryRun = process.argv.includes("--dry-run");

  const fixtureUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: { startsWith: "demo-" } },
        { id: { startsWith: "integration-" } },
        { id: { startsWith: "identity-" } },
        { email: { endsWith: "@demo.labrix.local" } },
        { email: { endsWith: "@northbridge.example" } },
      ],
    },
    select: { id: true },
  });
  const fixtureUserIds = fixtureUsers.map(({ id }) => id);

  const fixtureClassrooms = await prisma.classroom.findMany({
    where: {
      OR: [
        { id: "dsa-2026" },
        { id: { startsWith: "demo-" } },
        { id: { startsWith: "integration-" } },
        ...(fixtureUserIds.length
          ? [{ ownerTeacherId: { in: fixtureUserIds } }]
          : []),
      ],
    },
    select: { id: true },
  });
  const fixtureClassroomIds = fixtureClassrooms.map(({ id }) => id);

  const fixtureTasks = await prisma.task.findMany({
    where: {
      OR: [
        { id: { in: ["two-sum", "balanced-brackets", "campus-route-planner"] } },
        { id: { startsWith: "demo-" } },
        { id: { startsWith: "integration-" } },
        ...(fixtureClassroomIds.length
          ? [{ classroomId: { in: fixtureClassroomIds } }]
          : []),
        ...(fixtureUserIds.length
          ? [{ authorTeacherId: { in: fixtureUserIds } }]
          : []),
      ],
    },
    select: { id: true },
  });
  const fixtureTaskIds = fixtureTasks.map(({ id }) => id);

  const fixtureSessions = await prisma.codingSession.findMany({
    where: {
      OR: [
        ...(fixtureTaskIds.length ? [{ taskId: { in: fixtureTaskIds } }] : []),
        ...(fixtureUserIds.length ? [{ studentId: { in: fixtureUserIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const fixtureSessionIds = fixtureSessions.map(({ id }) => id);

  const fixtureSubmissions = await prisma.submissionAttempt.findMany({
    where: {
      OR: [
        ...(fixtureTaskIds.length ? [{ taskId: { in: fixtureTaskIds } }] : []),
        ...(fixtureUserIds.length ? [{ studentId: { in: fixtureUserIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const fixtureSubmissionIds = fixtureSubmissions.map(({ id }) => id);

  const fixtureReviews = await prisma.submissionReview.findMany({
    where: {
      OR: [
        ...(fixtureSubmissionIds.length
          ? [{ submissionAttemptId: { in: fixtureSubmissionIds } }]
          : []),
        ...(fixtureUserIds.length
          ? [{ reviewerTeacherId: { in: fixtureUserIds } }]
          : []),
      ],
    },
    select: { id: true },
  });
  const fixtureReviewIds = fixtureReviews.map(({ id }) => id);

  const fixtureRuns = await prisma.runAttempt.findMany({
    where: fixtureSessionIds.length
      ? { codingSessionId: { in: fixtureSessionIds } }
      : { id: { in: [] } },
    select: { id: true },
  });
  const fixtureRunIds = fixtureRuns.map(({ id }) => id);

  const summary = {
    users: fixtureUserIds.length,
    classrooms: fixtureClassroomIds.length,
    tasks: fixtureTaskIds.length,
    submissions: fixtureSubmissionIds.length,
  };
  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, matched: summary }));
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (fixtureReviewIds.length) {
      await tx.submissionReviewCriterionScore.deleteMany({ where: { reviewId: { in: fixtureReviewIds } } });
      await tx.submissionReviewRevision.deleteMany({ where: { reviewId: { in: fixtureReviewIds } } });
      await tx.submissionReview.deleteMany({ where: { id: { in: fixtureReviewIds } } });
    }
    if (fixtureSessionIds.length) {
      await tx.hintInteraction.deleteMany({ where: { codingSessionId: { in: fixtureSessionIds } } });
      await tx.codeEvent.deleteMany({ where: { codingSessionId: { in: fixtureSessionIds } } });
    }
    if (fixtureSubmissionIds.length) {
      await tx.submissionAttempt.deleteMany({ where: { id: { in: fixtureSubmissionIds } } });
    }
    if (fixtureRunIds.length) {
      await tx.resultSnapshot.deleteMany({ where: { runAttemptId: { in: fixtureRunIds } } });
      await tx.runAttempt.deleteMany({ where: { id: { in: fixtureRunIds } } });
    }
    if (fixtureSessionIds.length) {
      await tx.draft.deleteMany({ where: { codingSessionId: { in: fixtureSessionIds } } });
      await tx.codingSession.deleteMany({ where: { id: { in: fixtureSessionIds } } });
    }
    if (fixtureTaskIds.length) {
      await tx.testCase.deleteMany({ where: { taskId: { in: fixtureTaskIds } } });
      await tx.rubricCriterion.deleteMany({ where: { taskId: { in: fixtureTaskIds } } });
      await tx.task.deleteMany({ where: { id: { in: fixtureTaskIds } } });
    }
    if (fixtureClassroomIds.length) {
      await tx.studentHintPermission.deleteMany({ where: { classroomId: { in: fixtureClassroomIds } } });
      await tx.classroomHintPolicy.deleteMany({ where: { classroomId: { in: fixtureClassroomIds } } });
      await tx.membershipAuditEntry.deleteMany({ where: { classroomId: { in: fixtureClassroomIds } } });
      await tx.classMembership.deleteMany({ where: { classroomId: { in: fixtureClassroomIds } } });
      await tx.classroom.deleteMany({ where: { id: { in: fixtureClassroomIds } } });
    }
    if (fixtureUserIds.length) {
      await tx.studentHintPermission.deleteMany({ where: { studentId: { in: fixtureUserIds } } });
      await tx.externalIdentity.deleteMany({ where: { userId: { in: fixtureUserIds } } });
      await tx.user.deleteMany({ where: { id: { in: fixtureUserIds } } });
    }
  }, { timeout: 30_000 });

  console.log(JSON.stringify({
    removed: summary,
  }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Demo data removal failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
