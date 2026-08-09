import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const classroomSummaryInclude = {
  memberships: { where: { active: true } },
  tasks: {
    orderBy: { createdAt: "desc" as const },
    include: {
      submissionAttempts: { select: { studentId: true } },
    },
  },
} satisfies Prisma.ClassroomInclude;

export type ClassroomSummaryRecord = Prisma.ClassroomGetPayload<{
  include: typeof classroomSummaryInclude;
}>;

export function getClassroomsForTeacher(teacherId: string) {
  return prisma.classroom.findMany({
    where: { status: "ACTIVE", ownerTeacherId: teacherId },
    include: classroomSummaryInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function getOwnedClassroomById(teacherId: string, id: string) {
  return prisma.classroom.findFirst({
    where: { id, ownerTeacherId: teacherId },
    include: classroomSummaryInclude,
  });
}
