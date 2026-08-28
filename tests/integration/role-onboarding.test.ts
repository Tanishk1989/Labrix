import { randomUUID } from "node:crypto";
import { PlatformRole } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { onboardRole } from "@/server/onboarding/role-onboarding";

const suffix = randomUUID().slice(0, 8);
const subjects = {
  student: `role-student-${suffix}`,
  teacher: `role-teacher-${suffix}`,
};
const emails = {
  student: `${subjects.student}@example.test`,
  teacher: `${subjects.teacher}@example.test`,
};

function input(kind: keyof typeof subjects, role: PlatformRole) {
  return {
    role,
    identity: { provider: "clerk" as const, providerSubject: subjects[kind] },
    profile: { name: `Role ${kind}`, email: emails[kind] },
  };
}

describe.sequential("self-service role onboarding", () => {
  afterAll(async () => {
    await prisma.externalIdentity.deleteMany({
      where: { providerSubject: { in: Object.values(subjects) } },
    });
    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await prisma.$disconnect();
  });

  it("creates a student immediately without requiring a classroom code", async () => {
    await expect(onboardRole(prisma, input("student", PlatformRole.STUDENT)))
      .resolves.toMatchObject({ ok: true, status: "CREATED", role: "STUDENT" });
  });

  it("lets an existing student promote to teacher", async () => {
    await expect(onboardRole(prisma, input("student", PlatformRole.TEACHER)))
      .resolves.toMatchObject({ ok: true, status: "PROMOTED_TO_TEACHER", role: "TEACHER" });
    await expect(prisma.user.findUnique({ where: { email: emails.student } }))
      .resolves.toMatchObject({ platformRole: "TEACHER", accountStatus: "ACTIVE" });
  });

  it("creates a teacher immediately and never silently demotes it", async () => {
    await expect(onboardRole(prisma, input("teacher", PlatformRole.TEACHER)))
      .resolves.toMatchObject({ ok: true, status: "CREATED", role: "TEACHER" });
    await expect(onboardRole(prisma, input("teacher", PlatformRole.STUDENT)))
      .resolves.toMatchObject({ ok: true, status: "ALREADY_CONFIGURED", role: "TEACHER" });
  });
});
