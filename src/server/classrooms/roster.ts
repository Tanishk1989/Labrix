import "server-only";

import type { PlatformRole, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  AccessDeniedError,
  requireOwnedClassroom,
} from "@/server/authorization/classroom-access";

type RosterDatabase = Pick<PrismaClient, "$transaction">;

const classroomIdSchema = z.string().trim().min(1).max(120);
const membershipInputSchema = z.object({
  classroomId: classroomIdSchema,
  membershipId: z.string().trim().min(1).max(120),
});

function requireTeacher(actor: { id: string; role: PlatformRole }) {
  if (actor.role !== "TEACHER") throw new AccessDeniedError();
  return actor;
}

function nextJoinCode() {
  return `CLASS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function getTeacherClassroomRoster(
  teacherId: string,
  classroomId: string,
) {
  const classroom = await prisma.classroom.findFirst({
    where: {
      id: classroomId,
      ownerTeacherId: teacherId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      joinCode: true,
      memberships: {
        where: { role: "STUDENT" },
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          active: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              submissionAttempts: {
                where: { task: { classroomId } },
                orderBy: { submittedAt: "desc" },
                select: {
                  id: true,
                  attemptNumber: true,
                  submittedAt: true,
                  task: { select: { id: true, title: true } },
                  review: { select: { status: true } },
                },
              },
            },
          },
        },
      },
      membershipAuditEntries: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          createdAt: true,
          student: { select: { id: true, name: true, email: true } },
          actorTeacher: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!classroom) throw new AccessDeniedError();

  const students = classroom.memberships.map((membership) => {
    const attempts = membership.user.submissionAttempts;
    return {
      membershipId: membership.id,
      studentId: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      status: membership.active ? ("ACTIVE" as const) : ("INACTIVE" as const),
      joinedAt: membership.joinedAt.toISOString(),
      submissionCount: attempts.length,
      draftReviewCount: attempts.filter(
        (attempt) => attempt.review?.status === "DRAFT",
      ).length,
      publishedReviewCount: attempts.filter(
        (attempt) => attempt.review?.status === "PUBLISHED",
      ).length,
      latestSubmission: attempts[0]
        ? {
            id: attempts[0].id,
            taskId: attempts[0].task.id,
            taskTitle: attempts[0].task.title,
            attemptNumber: attempts[0].attemptNumber,
            submittedAt: attempts[0].submittedAt.toISOString(),
          }
        : null,
    };
  });

  return {
    id: classroom.id,
    name: classroom.name,
    joinCode: classroom.joinCode,
    students: students.filter((student) => student.status === "ACTIVE"),
    inactiveStudents: students.filter(
      (student) => student.status === "INACTIVE",
    ),
    auditEntries: classroom.membershipAuditEntries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      createdAt: entry.createdAt.toISOString(),
      student: entry.student,
      actorTeacher: entry.actorTeacher,
    })),
  };
}

export async function deactivateStudentMembership(
  db: RosterDatabase,
  input: {
    actor: { id: string; role: PlatformRole };
    classroomId: unknown;
    membershipId: unknown;
  },
) {
  const actor = requireTeacher(input.actor);
  const parsed = membershipInputSchema.safeParse(input);
  if (!parsed.success) throw new AccessDeniedError();

  return db.$transaction(async (tx) => {
    await requireOwnedClassroom(tx, actor.id, parsed.data.classroomId);
    const membership = await tx.classMembership.findFirst({
      where: {
        id: parsed.data.membershipId,
        classroomId: parsed.data.classroomId,
        role: "STUDENT",
        active: true,
      },
      select: { id: true, userId: true },
    });
    if (!membership) throw new AccessDeniedError();

    await tx.classMembership.update({
      where: { id: membership.id },
      data: { active: false },
    });
    await tx.membershipAuditEntry.create({
      data: {
        classroomId: parsed.data.classroomId,
        membershipId: membership.id,
        studentId: membership.userId,
        actorTeacherId: actor.id,
        action: "DEACTIVATED",
      },
    });
    return { membershipId: membership.id, studentId: membership.userId };
  });
}

export async function reactivateStudentMembership(
  db: RosterDatabase,
  input: {
    actor: { id: string; role: PlatformRole };
    classroomId: unknown;
    membershipId: unknown;
  },
) {
  const actor = requireTeacher(input.actor);
  const parsed = membershipInputSchema.safeParse(input);
  if (!parsed.success) throw new AccessDeniedError();

  return db.$transaction(async (tx) => {
    await requireOwnedClassroom(tx, actor.id, parsed.data.classroomId);
    const membership = await tx.classMembership.findFirst({
      where: {
        id: parsed.data.membershipId,
        classroomId: parsed.data.classroomId,
        role: "STUDENT",
        active: false,
      },
      select: { id: true, userId: true },
    });
    if (!membership) throw new AccessDeniedError();

    await tx.classMembership.update({
      where: { id: membership.id },
      data: { active: true },
    });
    await tx.membershipAuditEntry.create({
      data: {
        classroomId: parsed.data.classroomId,
        membershipId: membership.id,
        studentId: membership.userId,
        actorTeacherId: actor.id,
        action: "REACTIVATED",
      },
    });
    return { membershipId: membership.id, studentId: membership.userId };
  });
}

export async function regenerateClassroomJoinCode(
  db: RosterDatabase,
  input: {
    actor: { id: string; role: PlatformRole };
    classroomId: unknown;
  },
) {
  const actor = requireTeacher(input.actor);
  const classroomId = classroomIdSchema.safeParse(input.classroomId);
  if (!classroomId.success) throw new AccessDeniedError();

  return db.$transaction(async (tx) => {
    await requireOwnedClassroom(tx, actor.id, classroomId.data);
    return tx.classroom.update({
      where: { id: classroomId.data },
      data: { joinCode: nextJoinCode() },
      select: { id: true, joinCode: true },
    });
  });
}
