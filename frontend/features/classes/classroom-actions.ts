"use server";

import { MembershipRole } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import { getIdentityMode } from "@/server/actors/identity-mode";
import { CLASSROOM_MANAGEMENT_CACHE_TAG } from "@/server/teacher/cache-tags";

type Result = { ok: true; classroomId: string } | { ok: false; message: string };
const createSchema = z.object({
  name: z.string().trim().min(3, "Enter a classroom name.").max(80),
  subject: z.string().trim().min(3, "Enter a subject.").max(80),
  section: z.string().trim().min(2, "Enter a section.").max(80),
});

function joinCode() {
  return `CLASS-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
}

export async function createClassroom(values: unknown): Promise<Result> {
  const parsed = createSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the classroom details." };
  try {
    const teacher = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    const classroom = await prisma.classroom.create({
      data: {
        ...parsed.data,
        joinCode: joinCode(),
        ownerTeacherId: teacher.id,
        memberships: { create: { userId: teacher.id, role: MembershipRole.TEACHER } },
      },
    });
    revalidatePath("/classes");
    return { ok: true, classroomId: classroom.id };
  } catch {
    return { ok: false, message: "TRACE could not create the classroom. Try again." };
  }
}

export async function joinClassroom(code: string): Promise<Result> {
  if (getIdentityMode() !== "demo") {
    return {
      ok: false,
      message: "Classroom onboarding is not available in this authentication slice.",
    };
  }
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, message: "Enter a classroom code." };
  try {
    const classroom = await prisma.classroom.findUnique({ where: { joinCode: normalized } });
    const student = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );
    if (!classroom) return { ok: false, message: "We could not find that classroom code." };
    const membership = await prisma.classMembership.findUnique({
      where: {
        classroomId_userId: { classroomId: classroom.id, userId: student.id },
      },
      select: { active: true },
    });
    if (membership && !membership.active) {
      return {
        ok: false,
        message:
          "Your classroom access is inactive. Ask the classroom teacher to reactivate it.",
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
