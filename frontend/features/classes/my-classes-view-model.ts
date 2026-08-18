import { unstable_cache } from "next/cache";
import type { ClassroomSummaryRecord } from "@/data/classroom-repository";
import {
  getClassroomsForStudent,
  getClassroomsForTeacher,
} from "@/data/classroom-repository";
import type { PlatformRole } from "@prisma/client";
import { CLASSROOM_MANAGEMENT_CACHE_TAG } from "@/server/teacher/cache-tags";
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

export function countVisiblePracticals(
  tasks: Array<{ status: "DRAFT" | "PUBLISHED" }>,
  role: PlatformRole,
) {
  const publishedCount = tasks.filter(
    (task) => task.status === "PUBLISHED",
  ).length;
  return role === "STUDENT" ? Math.min(publishedCount, 1) : publishedCount;
}

function toCard(
  classroom: ClassroomSummaryRecord,
  role: PlatformRole,
): ClassroomCardViewModel {
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
    activePracticalCount: countVisiblePracticals(classroom.tasks, role),
    nearestDeadline: latest?.deadline?.toISOString() ?? null,
    joinCode: classroom.joinCode,
    status: "ACTIVE",
    latestPractical:
      latest && completion
        ? { title: latest.title, ...completion }
        : null,
  };
}

async function loadMyClassesViewModel(
  userId: string,
  role: PlatformRole = "TEACHER",
): Promise<MyClassesViewModel> {
  const records =
    role === "TEACHER"
      ? await getClassroomsForTeacher(userId)
      : await getClassroomsForStudent(userId);
  const activeClasses = records.map((classroom) => toCard(classroom, role));
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

const getCachedMyClassesViewModel = unstable_cache(
  loadMyClassesViewModel,
  ["my-classes-view-model-v1"],
  {
    tags: [CLASSROOM_MANAGEMENT_CACHE_TAG],
    revalidate: 60,
  },
);

export function getMyClassesViewModel(
  userId: string,
  role: PlatformRole = "TEACHER",
): Promise<MyClassesViewModel> {
  return getCachedMyClassesViewModel(userId, role);
}
