import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const classroomSummaryInclude = {
  memberships: {
    where: { active: true },
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  tasks: {
    orderBy: { createdAt: "desc" as const },
    include: {
      submissionAttempts: {
        orderBy: { attemptNumber: "desc" as const },
        select: {
          id: true,
          studentId: true,
          attemptNumber: true,
          submittedAt: true,
          resultSnapshot: { select: { passedTests: true, totalTests: true } },
        },
      },
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

export function getClassroomsForStudent(studentId: string) {
  return prisma.classroom.findMany({
    where: {
      status: "ACTIVE",
      memberships: {
        some: {
          userId: studentId,
          role: "STUDENT",
          active: true,
        },
      },
    },
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

export function getClassroomForStudentById(studentId: string, id: string) {
  return prisma.classroom.findFirst({
    where: {
      id,
      status: "ACTIVE",
      memberships: {
        some: {
          userId: studentId,
          role: "STUDENT",
          active: true,
        },
      },
    },
    include: classroomSummaryInclude,
  });
}
