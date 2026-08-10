import "server-only";

import { prisma } from "@/lib/db/prisma";

export type StudentOverview = Awaited<ReturnType<typeof getStudentOverview>>;

function completion(submitted: number, total: number) {
  return total === 0 ? 0 : Math.round((submitted / total) * 100);
}

export async function getStudentOverview(studentId: string) {
  const memberships = await prisma.classMembership.findMany({
    where: { userId: studentId, role: "STUDENT", active: true, classroom: { status: "ACTIVE" } },
    orderBy: { joinedAt: "desc" },
    include: {
      classroom: {
        include: {
          tasks: {
            where: { status: "PUBLISHED" },
            orderBy: { createdAt: "desc" },
            include: {
              testCases: { where: { visible: true }, orderBy: { position: "asc" } },
              submissionAttempts: {
                where: { studentId },
                orderBy: { attemptNumber: "desc" },
                include: { resultSnapshot: { select: { state: true, passedTests: true, totalTests: true } } },
              },
              codingSessions: {
                where: { studentId },
                orderBy: { attemptNumber: "desc" },
                take: 1,
                select: { id: true, status: true, attemptNumber: true, updatedAt: true },
              },
            },
          },
        },
      },
    },
  });

  const practicals = memberships.flatMap(({ classroom }) =>
    classroom.tasks.map((task) => {
      const latestSubmission = task.submissionAttempts[0] ?? null;
      const latestSession = task.codingSessions[0] ?? null;
      return {
        id: task.id,
        title: task.title,
        instructions: task.instructions,
        constraints: task.constraints,
        allowedLanguages: task.allowedLanguages,
        deadline: task.deadline?.toISOString() ?? null,
        classroom: { id: classroom.id, name: classroom.name, subject: classroom.subject, section: classroom.section },
        visibleTestCount: task.testCases.length,
        latestSession: latestSession ? { ...latestSession, updatedAt: latestSession.updatedAt.toISOString() } : null,
        latestSubmission: latestSubmission ? {
          id: latestSubmission.id,
          attemptNumber: latestSubmission.attemptNumber,
          language: latestSubmission.language,
          submittedAt: latestSubmission.submittedAt.toISOString(),
          state: latestSubmission.resultSnapshot.state,
          passedTests: latestSubmission.resultSnapshot.passedTests,
          totalTests: latestSubmission.resultSnapshot.totalTests,
        } : null,
        attempts: task.submissionAttempts.map((attempt) => ({
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          language: attempt.language,
          submittedAt: attempt.submittedAt.toISOString(),
          state: attempt.resultSnapshot.state,
          passedTests: attempt.resultSnapshot.passedTests,
          totalTests: attempt.resultSnapshot.totalTests,
        })),
      };
    }),
  );
  const submissions = practicals.flatMap((practical) => practical.attempts.map((attempt) => ({ ...attempt, practical: { id: practical.id, title: practical.title }, classroom: practical.classroom }))).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const submittedPracticalCount = practicals.filter((practical) => practical.latestSubmission).length;

  return {
    classes: memberships.map(({ classroom }) => {
      const submitted = classroom.tasks.filter((task) => task.submissionAttempts.length > 0).length;
      return {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        section: classroom.section,
        practicalCount: classroom.tasks.length,
        submittedPracticalCount: submitted,
        completionPercentage: completion(submitted, classroom.tasks.length),
        latestPractical: classroom.tasks[0] ? { id: classroom.tasks[0].id, title: classroom.tasks[0].title, deadline: classroom.tasks[0].deadline?.toISOString() ?? null } : null,
      };
    }),
    practicals,
    submissions,
    summary: {
      classCount: memberships.length,
      practicalCount: practicals.length,
      submittedPracticalCount,
      completionPercentage: completion(submittedPracticalCount, practicals.length),
    },
  };
}

export async function getStudentPractical(studentId: string, taskId: string) {
  const overview = await getStudentOverview(studentId);
  return overview.practicals.find((practical) => practical.id === taskId) ?? null;
}
