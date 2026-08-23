"use server";

import { MembershipRole } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import { CLASSROOM_MANAGEMENT_CACHE_TAG } from "@/server/teacher/cache-tags";
import {
  checkEnrollmentEligibility,
  generateCryptographicJoinCode,
  normalizeJoinCode,
} from "@/server/classrooms/join-code-generator";
import { globalRateLimiter } from "@/server/security/rate-limiter";
import { RATE_LIMIT_CONFIGS } from "@/server/security/rate-limit-configs";
import { logAdminAction } from "@/server/audit/admin-audit";

type Result = { ok: true; classroomId: string } | { ok: false; message: string };

const createSchema = z.object({
  name: z.string().trim().min(3, "Enter a classroom name.").max(80),
  subject: z.string().trim().min(3, "Enter a subject.").max(80),
  section: z.string().trim().min(2, "Enter a section.").max(80),
});

export async function createClassroom(values: unknown): Promise<Result> {
  const parsed = createSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the classroom details." };
  }
  try {
    const teacher = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    const code = generateCryptographicJoinCode();
    const classroom = await prisma.classroom.create({
      data: {
        ...parsed.data,
        joinCode: code,
        ownerTeacherId: teacher.id,
        memberships: { create: { userId: teacher.id, role: MembershipRole.TEACHER } },
      },
    });

    await logAdminAction({
      actorUserId: teacher.id,
      action: "CLASSROOM_CREATED",
      targetType: "CLASSROOM",
      targetId: classroom.id,
      metadata: { name: classroom.name, joinCode: code },
    });

    revalidatePath("/classes");
    revalidatePath("/dashboard");
    updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
    return { ok: true, classroomId: classroom.id };
  } catch {
    return { ok: false, message: "TRACE could not create the classroom. Try again." };
  }
}

export async function joinClassroom(code: string): Promise<Result> {
  const normalized = normalizeJoinCode(code);
  if (!normalized) return { ok: false, message: "Enter a classroom code." };

  try {
    const student = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );

    // Rate limit join code attempts per student (5 attempts / 10 min)
    const rl = await globalRateLimiter.check(student.id, RATE_LIMIT_CONFIGS.JOIN_CODE);
    if (!rl.success) {
      return {
        ok: false,
        message: `Too many join attempts. Please wait ${rl.retryAfterSeconds} seconds before trying again.`,
      };
    }

    const classroom = await prisma.classroom.findUnique({ where: { joinCode: normalized } });
    if (!classroom) return { ok: false, message: "We could not find that classroom code." };

    // Check enrollment window and expiration
    const eligibility = checkEnrollmentEligibility({
      status: classroom.status,
      enrollmentOpen: classroom.enrollmentOpen,
      enrollmentStartsAt: classroom.enrollmentStartsAt,
      enrollmentEndsAt: classroom.enrollmentEndsAt,
      joinCodeExpiresAt: classroom.joinCodeExpiresAt,
    });

    if (!eligibility.eligible) {
      const messages: Record<typeof eligibility.reason, string> = {
        CLASSROOM_ARCHIVED: "This classroom has been archived.",
        ENROLLMENT_CLOSED: "Enrollment for this classroom is currently closed.",
        ENROLLMENT_NOT_STARTED: "Enrollment for this classroom has not opened yet.",
        ENROLLMENT_ENDED: "The enrollment window for this classroom has closed.",
        JOIN_CODE_EXPIRED: "This classroom join code has expired. Ask your teacher for the new code.",
      };
      return { ok: false, message: messages[eligibility.reason] };
    }

    const membership = await prisma.classMembership.findUnique({
      where: {
        classroomId_userId: { classroomId: classroom.id, userId: student.id },
      },
      select: { active: true },
    });

    if (membership && !membership.active) {
      return {
        ok: false,
        message: "Your classroom access is inactive. Ask the classroom teacher to reactivate it.",
      };
    }

    await prisma.classMembership.upsert({
      where: {
        classroomId_userId: { classroomId: classroom.id, userId: student.id },
      },
      update: {},
      create: {
        classroomId: classroom.id,
        userId: student.id,
        role: MembershipRole.STUDENT,
      },
    });

    revalidatePath("/classes");
    revalidatePath(`/classes/${classroom.id}`);
    updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
    return { ok: true, classroomId: classroom.id };
  } catch {
    return { ok: false, message: "TRACE could not join the classroom. Try again." };
  }
}

/**
 * Rotate classroom join code to a new cryptographic code with optional expiration.
 */
export async function rotateJoinCode(
  classroomId: string,
  expiresInHours?: number,
): Promise<{ ok: boolean; newJoinCode?: string; message?: string }> {
  try {
    const teacher = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom || classroom.ownerTeacherId !== teacher.id) {
      return { ok: false, message: "Unauthorized." };
    }

    const newCode = generateCryptographicJoinCode();
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 3600 * 1000)
      : null;

    await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        joinCode: newCode,
        joinCodeRotatedAt: new Date(),
        joinCodeExpiresAt: expiresAt,
      },
    });

    await logAdminAction({
      actorUserId: teacher.id,
      action: "JOIN_CODE_ROTATED",
      targetType: "CLASSROOM",
      targetId: classroomId,
      metadata: { previousJoinCode: classroom.joinCode, newJoinCode: newCode, expiresAt },
    });

    revalidatePath(`/classes/${classroomId}`);
    updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
    return { ok: true, newJoinCode: newCode };
  } catch {
    return { ok: false, message: "Failed to rotate join code." };
  }
}
