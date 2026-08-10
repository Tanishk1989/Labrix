import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  resolveDemoStudentActor,
  resolveDemoTeacherActor,
} from "@/server/actors/demo-session";

const suffix = randomUUID().slice(0, 8);
const firstUserId = `identity-user-1-${suffix}`;
const secondUserId = `identity-user-2-${suffix}`;

function expectUniqueConstraint(error: unknown) {
  expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  expect((error as Prisma.PrismaClientKnownRequestError).code).toBe("P2002");
}

describe.sequential("provider-neutral identity foundation", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          id: firstUserId,
          name: "Identity Test One",
          email: `${firstUserId}@demo.labrix.local`,
          platformRole: "STUDENT",
        },
        {
          id: secondUserId,
          name: "Identity Test Two",
          email: `${secondUserId}@demo.labrix.local`,
          platformRole: "STUDENT",
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.externalIdentity.deleteMany({
      where: { userId: { in: [firstUserId, secondUserId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [firstUserId, secondUserId] } },
    });
    await prisma.$disconnect();
  });

  it("keeps existing seeded users valid for the fixed demo resolver", async () => {
    const [student, teacher] = await Promise.all([
      resolveDemoStudentActor(),
      resolveDemoTeacherActor(),
    ]);

    expect(student).toMatchObject({ id: "demo-student-1", role: "STUDENT" });
    expect(teacher).toMatchObject({ id: "demo-teacher", role: "TEACHER" });
  });

  it("defaults existing and newly created local users to ACTIVE", async () => {
    const users = await prisma.user.findMany({
      where: { id: { in: ["demo-teacher", "demo-student-1", firstUserId] } },
      select: { accountStatus: true },
    });

    expect(users).toHaveLength(3);
    expect(users.every((user) => user.accountStatus === "ACTIVE")).toBe(true);
  });

  it("enforces provider and subject uniqueness", async () => {
    await prisma.externalIdentity.create({
      data: {
        userId: firstUserId,
        provider: "clerk",
        providerSubject: `subject-${suffix}`,
      },
    });

    try {
      await prisma.externalIdentity.create({
        data: {
          userId: secondUserId,
          provider: "clerk",
          providerSubject: `subject-${suffix}`,
        },
      });
      throw new Error("Expected provider subject uniqueness to reject the mapping.");
    } catch (error) {
      expectUniqueConstraint(error);
    }
  });

  it("allows different providers to use the same subject value", async () => {
    await expect(
      prisma.externalIdentity.create({
        data: {
          userId: secondUserId,
          provider: "future-provider",
          providerSubject: `subject-${suffix}`,
        },
      }),
    ).resolves.toMatchObject({
      userId: secondUserId,
      provider: "future-provider",
      providerSubject: `subject-${suffix}`,
    });
  });

  it("prevents one local user from receiving two identities for one provider", async () => {
    try {
      await prisma.externalIdentity.create({
        data: {
          userId: firstUserId,
          provider: "clerk",
          providerSubject: `another-subject-${suffix}`,
        },
      });
      throw new Error("Expected user/provider uniqueness to reject the mapping.");
    } catch (error) {
      expectUniqueConstraint(error);
    }
  });

  it("preserves existing classroom and submission relationships", async () => {
    const classroom = await prisma.classroom.findUniqueOrThrow({
      where: { id: "dsa-2026" },
      include: {
        memberships: { select: { userId: true } },
        tasks: {
          include: {
            submissionAttempts: {
              include: {
                student: { select: { id: true } },
                codingSession: { select: { studentId: true } },
                resultSnapshot: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    expect(classroom.ownerTeacherId).toBe("demo-teacher");
    expect(classroom.memberships.map((membership) => membership.userId)).toEqual(
      expect.arrayContaining([
        "demo-teacher",
        "demo-student-1",
        "demo-student-2",
        "demo-student-3",
      ]),
    );
    expect(
      classroom.tasks.reduce(
        (count, task) => count + task.submissionAttempts.length,
        0,
      ),
    ).toBeGreaterThan(0);
    for (const task of classroom.tasks) {
      for (const submission of task.submissionAttempts) {
        expect(submission.student.id).toBe(submission.studentId);
        expect(submission.codingSession.studentId).toBe(submission.studentId);
        expect(submission.resultSnapshot.id).toBe(submission.resultSnapshotId);
      }
    }
  });
});
