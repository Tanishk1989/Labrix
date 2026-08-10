import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { onboardStudent } from "@/server/onboarding/student-onboarding";

const suffix = randomUUID().slice(0, 8);
const teacherId = `onboarding-teacher-${suffix}`;
const classroomId = `onboarding-classroom-${suffix}`;
const joinCode = `JOIN-${suffix}`.toUpperCase();
const createdSubject = `onboarding-created-${suffix}`;
const createdEmail = `onboarding-created-${suffix}@example.test`;
const disabledUserId = `onboarding-disabled-${suffix}`;
const disabledSubject = `onboarding-disabled-subject-${suffix}`;
const emailOwnerId = `onboarding-email-owner-${suffix}`;
const existingEmail = `onboarding-existing-${suffix}@example.test`;

function input(overrides: {
  joinCode?: string;
  providerSubject?: string;
  email?: string;
} = {}) {
  return {
    joinCode: overrides.joinCode ?? joinCode,
    identity: {
      provider: "clerk" as const,
      providerSubject: overrides.providerSubject ?? createdSubject,
    },
    profile: {
      name: "Onboarding Student",
      email: overrides.email ?? createdEmail,
    },
  };
}

describe.sequential("student onboarding persistence", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          id: teacherId,
          name: "Onboarding Teacher",
          email: `${teacherId}@example.test`,
          platformRole: "TEACHER",
        },
        {
          id: disabledUserId,
          name: "Disabled Student",
          email: `${disabledUserId}@example.test`,
          platformRole: "STUDENT",
          accountStatus: "DISABLED",
        },
        {
          id: emailOwnerId,
          name: "Existing Email Owner",
          email: existingEmail,
          platformRole: "STUDENT",
        },
      ],
    });
    await prisma.classroom.create({
      data: {
        id: classroomId,
        name: "Onboarding Classroom",
        subject: "Onboarding",
        section: "Test",
        joinCode,
        ownerTeacherId: teacherId,
      },
    });
    await prisma.externalIdentity.create({
      data: {
        userId: disabledUserId,
        provider: "clerk",
        providerSubject: disabledSubject,
      },
    });
  });

  afterAll(async () => {
    const createdMappings = await prisma.externalIdentity.findMany({
      where: {
        provider: "clerk",
        providerSubject: { startsWith: "onboarding-" },
      },
      select: { userId: true },
    });
    const userIds = [
      teacherId,
      disabledUserId,
      emailOwnerId,
      ...createdMappings.map((mapping) => mapping.userId),
    ];
    await prisma.classroom.deleteMany({ where: { id: classroomId } });
    await prisma.externalIdentity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("rejects an invalid join code without creating local identity data", async () => {
    const providerSubject = `onboarding-invalid-${suffix}`;
    const email = `onboarding-invalid-${suffix}@example.test`;
    await expect(
      onboardStudent(
        prisma,
        input({ joinCode: "NOT-A-CLASS", providerSubject, email }),
      ),
    ).resolves.toEqual({ ok: false, code: "INVALID_JOIN_CODE" });
    await expect(
      prisma.externalIdentity.findUnique({
        where: {
          provider_providerSubject: { provider: "clerk", providerSubject },
        },
      }),
    ).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { email } })).resolves.toBeNull();
  });

  it("atomically creates an ACTIVE STUDENT, Clerk identity, and membership", async () => {
    const result = await onboardStudent(prisma, input());
    expect(result).toMatchObject({
      ok: true,
      status: "CREATED",
      classroomId,
    });
    if (!result.ok) return;

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      include: { externalIdentities: true, memberships: true },
    });
    expect(user).toMatchObject({
      platformRole: "STUDENT",
      accountStatus: "ACTIVE",
      email: createdEmail,
    });
    expect(user.externalIdentities).toHaveLength(1);
    expect(user.externalIdentities[0]).toMatchObject({
      provider: "clerk",
      providerSubject: createdSubject,
    });
    expect(user.memberships).toEqual([
      expect.objectContaining({
        classroomId,
        role: "STUDENT",
        active: true,
      }),
    ]);
  });

  it("treats a repeated request as success without duplicating membership", async () => {
    const repeated = await onboardStudent(
      prisma,
      input({ joinCode: "RETRY-DOES-NOT-RELINK" }),
    );
    expect(repeated).toMatchObject({ ok: true, status: "ALREADY_ONBOARDED" });
    if (!repeated.ok) return;
    await expect(
      prisma.classMembership.count({ where: { userId: repeated.userId } }),
    ).resolves.toBe(1);
  });

  it("denies an already-linked disabled account", async () => {
    await expect(
      onboardStudent(
        prisma,
        input({
          providerSubject: disabledSubject,
          email: `${disabledSubject}@example.test`,
        }),
      ),
    ).resolves.toEqual({ ok: false, code: "DISABLED_ACCOUNT" });
  });

  it("does not link an unlinked Clerk subject by matching email", async () => {
    const providerSubject = `onboarding-email-conflict-${suffix}`;
    await expect(
      onboardStudent(prisma, input({ providerSubject, email: existingEmail })),
    ).resolves.toEqual({ ok: false, code: "EMAIL_IN_USE" });
    await expect(
      prisma.externalIdentity.findUnique({
        where: {
          provider_providerSubject: { provider: "clerk", providerSubject },
        },
      }),
    ).resolves.toBeNull();
  });
});
