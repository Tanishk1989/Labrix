import type { ClassroomSummaryRecord } from "@/data/classroom-repository";
import { getClassroomsForTeacher } from "@/data/classroom-repository";
import { summarizePracticalCompletion } from "./practical-completion";

export type ClassroomCardViewModel = {
  id: string;
  name: string;
  subject: string;
  section: string;
  studentCount: number;
  activePracticalCount: number;
  nearestDeadline: string | null;
  joinCode: string;
  status: "ACTIVE" | "ARCHIVED";
  latestPractical: {
    title: string;
    submittedCount: number;
    pendingCount: number;
    completionPercentage: number;
  } | null;
};

export type MyClassesViewModel = {
  summary: {
    activeClassCount: number;
    totalStudentCount: number;
    practicalsDueSoon: number;
  };
  activeClasses: ClassroomCardViewModel[];
  archivedClasses: ClassroomCardViewModel[];
};

function toCard(classroom: ClassroomSummaryRecord): ClassroomCardViewModel {
  const studentIds = classroom.memberships
    .filter((membership) => membership.role === "STUDENT")
    .map((membership) => membership.userId);
  const latest = classroom.tasks.find((task) => task.status === "PUBLISHED") ?? null;
  const completion = latest
    ? summarizePracticalCompletion(
        studentIds,
        latest.submissionAttempts.map((submission) => submission.studentId),
      )
    : null;

  return {
    id: classroom.id,
    name: classroom.name,
    subject: classroom.subject,
    section: classroom.section,
    studentCount: studentIds.length,
    activePracticalCount: classroom.tasks.filter((task) => task.status === "PUBLISHED").length,
    nearestDeadline: latest?.deadline?.toISOString() ?? null,
    joinCode: classroom.joinCode,
    status: "ACTIVE",
    latestPractical:
      latest && completion
        ? { title: latest.title, ...completion }
        : null,
  };
}

export async function getMyClassesViewModel(
  teacherId: string,
): Promise<MyClassesViewModel> {
  const activeClasses = (await getClassroomsForTeacher(teacherId)).map(toCard);
  const dueSoon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    summary: {
      activeClassCount: activeClasses.length,
      totalStudentCount: activeClasses.reduce(
        (total, item) => total + item.studentCount,
        0,
      ),
      practicalsDueSoon: activeClasses.filter(
        (item) =>
          item.nearestDeadline && new Date(item.nearestDeadline) <= dueSoon,
      ).length,
    },
    activeClasses,
    archivedClasses: [],
  };
}
