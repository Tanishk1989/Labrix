import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { AccessDeniedError } from "@/server/authorization/classroom-access";
import { CLASSROOM_MANAGEMENT_CACHE_TAG } from "@/server/teacher/cache-tags";
import { buildPracticalAnalytics } from "@/server/teacher/practical-analytics";

const membershipSelect = {
  id: true,
  active: true,
  joinedAt: true,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ClassMembershipSelect;

const auditEntrySelect = {
  id: true,
  action: true,
  createdAt: true,
  student: { select: { id: true, name: true, email: true } },
  actorTeacher: { select: { id: true, name: true } },
} satisfies Prisma.MembershipAuditEntrySelect;

const submissionSelect = {
  id: true,
  taskId: true,
  studentId: true,
  attemptNumber: true,
  submittedAt: true,
  language: true,
  task: { select: { id: true, title: true } },
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
} satisfies Prisma.SubmissionAttemptSelect;

type ManagementMembership = Prisma.ClassMembershipGetPayload<{
  select: typeof membershipSelect;
}>;
type ManagementAuditEntry = Prisma.MembershipAuditEntryGetPayload<{
  select: typeof auditEntrySelect;
}>;
type ManagementSubmission = Prisma.SubmissionAttemptGetPayload<{
  select: typeof submissionSelect;
}>;

type ClassroomManagementSource = {
  classroom: { id: string; name: string; joinCode: string } | null;
  memberships: ManagementMembership[];
  task: { id: string; title: string } | null;
  auditEntries: ManagementAuditEntry[];
  submissions: ManagementSubmission[];
};

export function buildTeacherClassroomManagement(
  source: ClassroomManagementSource,
) {
  if (!source.classroom) throw new AccessDeniedError();

  const submissionsByStudent = new Map<string, ManagementSubmission[]>();
  for (const submission of source.submissions) {
    const existing = submissionsByStudent.get(submission.studentId);
    if (existing) existing.push(submission);
    else submissionsByStudent.set(submission.studentId, [submission]);
  }

  const rosterStudents = source.memberships.map((membership) => {
    const attempts = submissionsByStudent.get(membership.user.id) ?? [];
    const latestSubmission = attempts[0] ?? null;
    return {
      membershipId: membership.id,
      studentId: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      status: membership.active ? ("ACTIVE" as const) : ("INACTIVE" as const),
      joinedAt: membership.joinedAt.toISOString(),
      submissionCount: attempts.length,
      draftReviewCount: attempts.filter(
        (attempt) => attempt.review?.status === "DRAFT",
      ).length,
      publishedReviewCount: attempts.filter(
        (attempt) => attempt.review?.status === "PUBLISHED",
      ).length,
      latestSubmission: latestSubmission
        ? {
            id: latestSubmission.id,
            taskId: latestSubmission.task.id,
            taskTitle: latestSubmission.task.title,
            attemptNumber: latestSubmission.attemptNumber,
            submittedAt: latestSubmission.submittedAt.toISOString(),
          }
        : null,
    };
  });

  const activeMemberships = source.memberships.filter(
    (membership) => membership.active,
  );
  const latestTaskSubmissions = source.task
    ? source.submissions.filter(
        (submission) => submission.taskId === source.task?.id,
      )
    : [];
  const latestByStudent = new Map<string, ManagementSubmission>();
  for (const submission of latestTaskSubmissions) {
    const current = latestByStudent.get(submission.studentId);
    if (!current || submission.attemptNumber > current.attemptNumber) {
      latestByStudent.set(submission.studentId, submission);
    }
  }

  const progressStudents = activeMemberships.map(({ user }) => {
    const latest = latestByStudent.get(user.id);
    return {
      ...user,
      latestSubmission: latest
        ? {
            id: latest.id,
            attemptNumber: latest.attemptNumber,
            language: latest.language,
            submittedAt: latest.submittedAt.toISOString(),
            resultSnapshot: {
              state: latest.resultSnapshot.state,
              passedTests: latest.resultSnapshot.passedTests,
              totalTests: latest.resultSnapshot.totalTests,
            },
          }
        : null,
    };
  });

  const analytics = source.task
    ? {
        classroom: { id: source.classroom.id },
        task: source.task,
        ...buildPracticalAnalytics(
          activeMemberships.map(({ user }) => user),
          latestTaskSubmissions.map((submission) => ({
            id: submission.id,
            studentId: submission.studentId,
            attemptNumber: submission.attemptNumber,
            submittedAt: submission.submittedAt,
            reviewStatus: submission.review?.status ?? null,
            result: submission.resultSnapshot,
          })),
        ),
      }
    : null;

  return {
    progress: {
      classroom: { id: source.classroom.id, name: source.classroom.name },
      task: source.task,
      students: progressStudents,
    },
    roster: {
      id: source.classroom.id,
      name: source.classroom.name,
      joinCode: source.classroom.joinCode,
      students: rosterStudents.filter((student) => student.status === "ACTIVE"),
      inactiveStudents: rosterStudents.filter(
        (student) => student.status === "INACTIVE",
      ),
      auditEntries: source.auditEntries.map((entry) => ({
        id: entry.id,
        action: entry.action,
        createdAt: entry.createdAt.toISOString(),
        student: entry.student,
        actorTeacher: entry.actorTeacher,
      })),
    },
    analytics,
  };
}

async function loadTeacherClassroomManagement(
  teacherId: string,
  classroomId: string,
) {
  const ownerScope = { ownerTeacherId: teacherId, status: "ACTIVE" } as const;
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, ...ownerScope },
    select: { id: true, name: true, joinCode: true },
  });
  if (!classroom) throw new AccessDeniedError();

  // The local app uses a remote pooled Neon database. Keeping these small reads
  // sequential lets Prisma reuse its warm connection; Promise.all expands the
  // pool and pays several new TLS/database connection handshakes per page load.
  const memberships = await prisma.classMembership.findMany({
    where: { classroomId, role: "STUDENT", classroom: ownerScope },
    orderBy: { joinedAt: "asc" },
    select: membershipSelect,
  });
  const task = await prisma.task.findFirst({
    where: { classroomId, status: "PUBLISHED", classroom: ownerScope },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
  const auditEntries = await prisma.membershipAuditEntry.findMany({
    where: { classroomId, classroom: ownerScope },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: auditEntrySelect,
  });
  const submissions = await prisma.submissionAttempt.findMany({
    where: {
      task: { classroomId, classroom: ownerScope },
      student: {
        memberships: {
          some: { classroomId, role: "STUDENT" },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
    select: submissionSelect,
  });

  return buildTeacherClassroomManagement({
    classroom,
    memberships,
    task,
    auditEntries,
    submissions,
  });
}

const getCachedTeacherClassroomManagement = unstable_cache(
  loadTeacherClassroomManagement,
  ["teacher-classroom-management-v1"],
  {
    tags: [CLASSROOM_MANAGEMENT_CACHE_TAG],
    revalidate: 30,
  },
);

export function getTeacherClassroomManagement(
  teacherId: string,
  classroomId: string,
) {
  return getCachedTeacherClassroomManagement(teacherId, classroomId);
}
