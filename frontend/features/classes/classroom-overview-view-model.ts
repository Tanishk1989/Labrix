import type { PlatformRole } from "@prisma/client";
import {
  getClassroomForStudentById,
  getOwnedClassroomById,
} from "@/data/classroom-repository";
import { summarizePracticalCompletion } from "./practical-completion";

export type ClassroomOverviewViewModel = {
  id: string;
  name: string;
  subject: string;
  section: string;
  joinCode: string;
  studentCount: number;
  practicalCount: number;
  submittedCount: number;
  pendingCount: number;
  task: {
    id: string;
    title: string;
    deadline: string | null;
    completion: number;
  } | null;
  practicals: Array<{
    id: string;
    title: string;
    status: "DRAFT" | "PUBLISHED";
    deadline: string | null;
    submittedCount: number;
    completionPercentage: number;
  }>;
  outstandingStudents: Array<{ id: string; name: string; email: string }>;
  studentLatestSubmission: {
    id: string;
    attemptNumber: number;
    submittedAt: string;
    passedTests: number;
    totalTests: number;
  } | null;
};

export async function getClassroomOverviewViewModel(
  userId: string,
  id: string,
  role: PlatformRole = "TEACHER",
): Promise<ClassroomOverviewViewModel | null> {
  const classroom =
    role === "TEACHER"
      ? await getOwnedClassroomById(userId, id)
      : await getClassroomForStudentById(userId, id);
  if (!classroom) return null;

  const studentIds = classroom.memberships
    .filter((membership) => membership.role === "STUDENT")
    .map((membership) => membership.userId);
  const task = classroom.tasks.find((item) => item.status === "PUBLISHED") ?? null;
  const completion = summarizePracticalCompletion(
    studentIds,
    task?.submissionAttempts.map((submission) => submission.studentId) ?? [],
  );
  const studentLatestSubmission = role === "STUDENT"
    ? task?.submissionAttempts.find((submission) => submission.studentId === userId) ?? null
    : null;

  return {
    id: classroom.id,
    name: classroom.name,
    subject: classroom.subject,
    section: classroom.section,
    joinCode: classroom.joinCode,
    studentCount: studentIds.length,
    practicalCount: classroom.tasks.filter((item) => item.status === "PUBLISHED").length,
    submittedCount: completion.submittedCount,
    pendingCount: completion.pendingCount,
    task: task
      ? {
          id: task.id,
          title: task.title,
          deadline: task.deadline?.toISOString() ?? null,
          completion: completion.completionPercentage,
        }
      : null,
    practicals: classroom.tasks.map((item) => {
      const submittedIds = new Set(item.submissionAttempts.map((submission) => submission.studentId));
      return {
        id: item.id,
        title: item.title,
        status: item.status,
        deadline: item.deadline?.toISOString() ?? null,
        submittedCount: submittedIds.size,
        completionPercentage: studentIds.length === 0 ? 0 : Math.round((submittedIds.size / studentIds.length) * 100),
      };
    }),
    outstandingStudents: task
      ? classroom.memberships
          .filter(
            (membership) =>
              membership.role === "STUDENT" &&
              !task.submissionAttempts.some((submission) => submission.studentId === membership.userId),
          )
          .map((membership) => ({
            id: membership.user.id,
            name: membership.user.name,
            email: membership.user.email,
          }))
      : [],
    studentLatestSubmission: studentLatestSubmission
      ? {
          id: studentLatestSubmission.id,
          attemptNumber: studentLatestSubmission.attemptNumber,
          submittedAt: studentLatestSubmission.submittedAt.toISOString(),
          passedTests: studentLatestSubmission.resultSnapshot.passedTests,
          totalTests: studentLatestSubmission.resultSnapshot.totalTests,
        }
      : null,
  };
}
