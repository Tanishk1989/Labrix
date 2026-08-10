import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getClassroomOverviewViewModel } from "@/features/classes/classroom-overview-view-model";
import {
  getSubmissionForTeacher,
  getTeacherClassroomProgress,
} from "@/server/attempts/service";
import {
  IdentityLinkError,
  linkExternalIdentity,
} from "@/server/actors/link-external-identity";

const suffix = randomUUID().slice(0, 8);
const teacherId = `auth-teacher-${suffix}`;
const studentId = `auth-student-${suffix}`;
const classroomId = `auth-classroom-${suffix}`;
const clerkSubject = `clerk-subject-${suffix}`;

describe.sequential("authenticated authorization boundaries", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          id: teacherId,
          name: "Auth Boundary Teacher",
          email: `${teacherId}@demo.labrix.local`,
          platformRole: "TEACHER",
        },
        {
          id: studentId,
          name: "Auth Boundary Student",
          email: `${studentId}@demo.labrix.local`,
          platformRole: "STUDENT",
        },
      ],
    });
    await prisma.classroom.create({
      data: {
        id: classroomId,
        name: "Other Auth Classroom",
        subject: "Authorization",
        section: "Test",
        joinCode: `AUTH-${suffix}`,
        ownerTeacherId: teacherId,
      },
    });
  });

  afterAll(async () => {
    await prisma.externalIdentity.deleteMany({
      where: { userId: { in: [teacherId, studentId] } },
    });
    await prisma.classroom.deleteMany({ where: { id: classroomId } });
    await prisma.user.deleteMany({ where: { id: { in: [teacherId, studentId] } } });
    await prisma.$disconnect();
  });

  it("explicitly links an existing user without changing the local role", async () => {
    const mapping = await linkExternalIdentity(prisma, {
      userId: studentId,
      provider: "clerk",
      providerSubject: clerkSubject,
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: studentId } });
    expect(mapping.userId).toBe(studentId);
    expect(user.platformRole).toBe("STUDENT");
  });

  it("rejects conflicting identity links", async () => {
    await expect(
      linkExternalIdentity(prisma, {
        userId: teacherId,
        provider: "clerk",
        providerSubject: clerkSubject,
      }),
    ).rejects.toBeInstanceOf(IdentityLinkError);
    await expect(
      linkExternalIdentity(prisma, {
        userId: studentId,
        provider: "clerk",
        providerSubject: `different-${clerkSubject}`,
      }),
    ).rejects.toBeInstanceOf(IdentityLinkError);
  });

  it("rejects linking a nonexistent Labrix user", async () => {
    await expect(
      linkExternalIdentity(prisma, {
        userId: `missing-${suffix}`,
        provider: "clerk",
        providerSubject: `missing-${clerkSubject}`,
      }),
    ).rejects.toBeInstanceOf(IdentityLinkError);
  });

  it("denies a student access to a classroom without active membership", async () => {
    await expect(
      getClassroomOverviewViewModel("demo-student-1", classroomId, "STUDENT"),
    ).resolves.toBeNull();
  });

  it("denies a student access to another student's submission review", async () => {
    const submission = await prisma.submissionAttempt.findFirstOrThrow({
      orderBy: { submittedAt: "asc" },
      select: { id: true },
    });
    await expect(
      getSubmissionForTeacher("demo-student-2", submission.id),
    ).rejects.toMatchObject({ name: "AccessDeniedError" });
  });

  it("denies a teacher access to a non-owned classroom", async () => {
    await expect(
      getTeacherClassroomProgress(teacherId, "dsa-2026"),
    ).rejects.toMatchObject({ name: "AccessDeniedError" });
  });
});
