import { getOwnedClassroomById } from "@/data/classroom-repository";
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
};

export async function getClassroomOverviewViewModel(
  teacherId: string,
  id: string,
): Promise<ClassroomOverviewViewModel | null> {
  const classroom = await getOwnedClassroomById(teacherId, id);
  if (!classroom) return null;

  const studentIds = classroom.memberships
    .filter((membership) => membership.role === "STUDENT")
    .map((membership) => membership.userId);
  const task = classroom.tasks.find((item) => item.status === "PUBLISHED") ?? null;
  const completion = summarizePracticalCompletion(
    studentIds,
    task?.submissionAttempts.map((submission) => submission.studentId) ?? [],
  );

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
  };
}
