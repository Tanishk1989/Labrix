import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireOwnedClassroom } from "@/server/authorization/classroom-access";
import {
  CLASSROOM_MANAGEMENT_CACHE_TAG,
  TEACHER_OVERVIEW_CACHE_TAG,
} from "@/server/teacher/cache-tags";

export interface EffectiveHintPermission {
  allowed: boolean;
  source: "STUDENT_OVERRIDE" | "CLASSROOM_DEFAULT" | "SYSTEM_DEFAULT";
  classDefault: boolean;
  studentOverride: boolean | null;
}

/**
 * Resolves the effective permission for a student in a classroom.
 * Rule:
 * 1. Student-specific permission (if present) overrides classroom default.
 * 2. Otherwise, classroom policy default applies.
 * 3. Default is strictly LOCKED (false).
 */
export async function getEffectiveStudentHintPermission(
  db: Pick<Prisma.TransactionClient, "classroomHintPolicy" | "studentHintPermission">,
  classroomId: string,
  studentId: string,
): Promise<EffectiveHintPermission> {
  const [studentPerm, classPolicy] = await Promise.all([
    db.studentHintPermission.findUnique({
      where: {
        classroomId_studentId: {
          classroomId,
          studentId,
        },
      },
      select: { enabled: true },
    }),
    db.classroomHintPolicy.findUnique({
      where: { classroomId },
      select: { enabledForAll: true },
    }),
  ]);

  const classDefault = classPolicy?.enabledForAll ?? false;
  const studentOverride = studentPerm !== null ? studentPerm.enabled : null;

  if (studentOverride !== null) {
    return {
      allowed: studentOverride,
      source: "STUDENT_OVERRIDE",
      classDefault,
      studentOverride,
    };
  }

  if (classPolicy !== null) {
    return {
      allowed: classPolicy.enabledForAll,
      source: "CLASSROOM_DEFAULT",
      classDefault,
      studentOverride: null,
    };
  }

  return {
    allowed: false,
    source: "SYSTEM_DEFAULT",
    classDefault: false,
    studentOverride: null,
  };
}

/**
 * Teacher sets or updates explicit hint permission for an individual student.
 */
export async function setStudentHintPermission(
  teacherId: string,
  classroomId: string,
  studentId: string,
  enabled: boolean,
) {
  await requireOwnedClassroom(prisma, teacherId, classroomId);

  // Validate student belongs to classroom
  const membership = await prisma.classMembership.findUnique({
    where: {
      classroomId_userId: {
        classroomId,
        userId: studentId,
      },
    },
    select: { id: true, active: true },
  });

  if (!membership || !membership.active) {
    throw new Error("Student is not an active member of this classroom.");
  }

  const permission = await prisma.studentHintPermission.upsert({
    where: {
      classroomId_studentId: {
        classroomId,
        studentId,
      },
    },
    create: {
      classroomId,
      studentId,
      enabled,
      grantedByTeacherId: teacherId,
    },
    update: {
      enabled,
      grantedByTeacherId: teacherId,
    },
  });

  revalidatePath(`/classes/${classroomId}/students`);
  revalidatePath("/classes");
  updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
  updateTag(TEACHER_OVERVIEW_CACHE_TAG);

  return permission;
}

/**
 * Teacher sets cohort-wide default hint policy for the classroom.
 */
export async function setClassroomHintPolicy(
  teacherId: string,
  classroomId: string,
  enabledForAll: boolean,
) {
  await requireOwnedClassroom(prisma, teacherId, classroomId);

  const policy = await prisma.classroomHintPolicy.upsert({
    where: { classroomId },
    create: {
      classroomId,
      enabledForAll,
      updatedByTeacherId: teacherId,
    },
    update: {
      enabledForAll,
      updatedByTeacherId: teacherId,
    },
  });

  revalidatePath(`/classes/${classroomId}/students`);
  revalidatePath("/classes");
  updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
  updateTag(TEACHER_OVERVIEW_CACHE_TAG);

  return policy;
}

/**
 * Loads hint permissions and hint usage counts for all students in a classroom.
 */
export async function getClassroomHintOverview(
  teacherId: string,
  classroomId: string,
) {
  await requireOwnedClassroom(prisma, teacherId, classroomId);

  const [policy, studentPermissions, hintInteractions] = await Promise.all([
    prisma.classroomHintPolicy.findUnique({
      where: { classroomId },
      select: { enabledForAll: true },
    }),
    prisma.studentHintPermission.findMany({
      where: { classroomId },
      select: { studentId: true, enabled: true },
    }),
    prisma.hintInteraction.groupBy({
      by: ["studentId"],
      where: { classroomId },
      _count: { id: true },
    }),
  ]);

  const permissionsMap = new Map<string, boolean>();
  for (const sp of studentPermissions) {
    permissionsMap.set(sp.studentId, sp.enabled);
  }

  const usageMap = new Map<string, number>();
  for (const hi of hintInteractions) {
    usageMap.set(hi.studentId, hi._count.id);
  }

  return {
    classDefault: policy?.enabledForAll ?? false,
    permissionsMap,
    usageMap,
  };
}
