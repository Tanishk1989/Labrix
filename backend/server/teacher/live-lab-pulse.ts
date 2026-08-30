import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  classifyLiveLabPulseStudent,
  consecutiveFailedRunCount,
  liveLabPulseStatusOrder,
  type LiveLabPulseStatus,
} from "@/domain/classrooms/live-lab-pulse";
import { AccessDeniedError } from "@/server/authorization/classroom-access";

function latestDate(values: Array<Date | null | undefined>) {
  return values.reduce<Date | null>((latest, value) => {
    if (!value) return latest;
    return !latest || value > latest ? value : latest;
  }, null);
}

function activityLabel(type: string, taskTitle: string) {
  if (type === "SESSION_STARTED") return `Started ${taskTitle}`;
  if (type === "DRAFT_SAVED") return `Saved code for ${taskTitle}`;
  if (type === "RUN_REQUESTED") return `Started tests for ${taskTitle}`;
  if (type === "RUN_COMPLETED") return `Completed tests for ${taskTitle}`;
  return `Submitted ${taskTitle}`;
}

export async function getTeacherLiveLabPulse(
  teacherId: string,
  classroomId: string,
  now = new Date(),
) {
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, ownerTeacherId: teacherId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      subject: true,
      section: true,
      hintPolicy: { select: { enabledForAll: true } },
      studentHintPermissions: { select: { studentId: true, enabled: true } },
      memberships: {
        where: { role: "STUDENT", active: true },
        orderBy: { joinedAt: "asc" },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              codingSessions: {
                where: { task: { classroomId } },
                orderBy: { startedAt: "desc" },
                take: 3,
                select: {
                  id: true,
                  attemptNumber: true,
                  language: true,
                  status: true,
                  startedAt: true,
                  updatedAt: true,
                  task: { select: { id: true, title: true } },
                  events: {
                    orderBy: { occurredAt: "desc" },
                    take: 8,
                    select: { id: true, type: true, occurredAt: true },
                  },
                  runs: {
                    orderBy: { requestedAt: "desc" },
                    take: 5,
                    select: {
                      id: true,
                      requestedAt: true,
                      completedAt: true,
                      resultSnapshot: {
                        select: {
                          state: true,
                          visiblePassedTests: true,
                          visibleTotalTests: true,
                        },
                      },
                    },
                  },
                  executionJobs: {
                    where: { status: { in: ["QUEUED", "RUNNING"] } },
                    orderBy: { updatedAt: "desc" },
                    take: 1,
                    select: { id: true, status: true, updatedAt: true },
                  },
                },
              },
              submissionAttempts: {
                where: { task: { classroomId } },
                orderBy: { submittedAt: "desc" },
                take: 3,
                select: {
                  id: true,
                  attemptNumber: true,
                  submittedAt: true,
                  task: { select: { id: true, title: true } },
                  resultSnapshot: {
                    select: {
                      state: true,
                      visiblePassedTests: true,
                      visibleTotalTests: true,
                    },
                  },
                },
              },
              hintInteractions: {
                where: { classroomId },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                  id: true,
                  hintLevel: true,
                  createdAt: true,
                  task: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!classroom) throw new AccessDeniedError();

  const permissionByStudent = new Map(
    classroom.studentHintPermissions.map((permission) => [permission.studentId, permission.enabled]),
  );
  const students = classroom.memberships.map(({ user }) => {
    const session = user.codingSessions.find((codingSession) => codingSession.status === "ACTIVE")
      ?? user.codingSessions[0]
      ?? null;
    const latestSubmission = user.submissionAttempts[0] ?? null;
    const runs = session?.runs ?? [];
    const failedRuns = consecutiveFailedRunCount(runs.map((run) => ({
      state: run.resultSnapshot?.state ?? null,
      visiblePassedTests: run.resultSnapshot?.visiblePassedTests ?? null,
      visibleTotalTests: run.resultSnapshot?.visibleTotalTests ?? null,
    })));
    const lastActivityAt = latestDate([
      session?.updatedAt,
      session?.events[0]?.occurredAt,
      runs[0]?.completedAt,
      runs[0]?.requestedAt,
      latestSubmission?.submittedAt,
      user.hintInteractions[0]?.createdAt,
    ]);
    const classification = classifyLiveLabPulseStudent({
      hasActiveSession: session?.status === "ACTIVE",
      hasActiveExecution: Boolean(session?.executionJobs.length),
      lastActivityAt,
      latestSubmissionAt: latestSubmission?.submittedAt ?? null,
      consecutiveFailedRuns: failedRuns,
    }, now);
    const activity = [
      ...user.codingSessions.flatMap((codingSession) => codingSession.events.map((event) => ({
        id: event.id,
        occurredAt: event.occurredAt,
        label: activityLabel(event.type, codingSession.task.title),
        kind: event.type,
      }))),
      ...user.hintInteractions.map((hint) => ({
        id: hint.id,
        occurredAt: hint.createdAt,
        label: `Used level ${hint.hintLevel} hint for ${hint.task.title}`,
        kind: "HINT_USED",
      })),
    ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime()).slice(0, 8);
    const hintOverride = permissionByStudent.get(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: classification.status,
      statusReason: classification.reason,
      lastActivityAt: lastActivityAt?.toISOString() ?? null,
      currentPractical: session ? { id: session.task.id, title: session.task.title } : null,
      attemptNumber: session?.attemptNumber ?? null,
      language: session?.language ?? null,
      consecutiveFailedRuns: failedRuns,
      hintCount: user.hintInteractions.length,
      hintAccessEnabled: hintOverride ?? classroom.hintPolicy?.enabledForAll ?? false,
      latestSubmission: latestSubmission ? {
        id: latestSubmission.id,
        taskId: latestSubmission.task.id,
        taskTitle: latestSubmission.task.title,
        attemptNumber: latestSubmission.attemptNumber,
        submittedAt: latestSubmission.submittedAt.toISOString(),
        state: latestSubmission.resultSnapshot.state,
        visiblePassedTests: latestSubmission.resultSnapshot.visiblePassedTests ?? 0,
        visibleTotalTests: latestSubmission.resultSnapshot.visibleTotalTests ?? 0,
      } : null,
      activity: activity.map((item) => ({
        ...item,
        occurredAt: item.occurredAt.toISOString(),
      })),
    };
  });

  const counts = Object.fromEntries(
    liveLabPulseStatusOrder.map((status) => [
      status,
      students.filter((student) => student.status === status).length,
    ]),
  ) as Record<LiveLabPulseStatus, number>;

  return {
    classroom: {
      id: classroom.id,
      name: classroom.name,
      subject: classroom.subject,
      section: classroom.section,
    },
    capturedAt: now.toISOString(),
    counts,
    students,
  };
}

export type TeacherLiveLabPulse = Awaited<ReturnType<typeof getTeacherLiveLabPulse>>;
