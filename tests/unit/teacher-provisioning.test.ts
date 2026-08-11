import { AccountStatus, PlatformRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { parseStudentOnboardingInput } from "@/server/onboarding/student-onboarding";
import {
  authorizeTeacherProvisioningCommand,
  provisionTeacher,
  TeacherProvisioningError,
} from "@/server/admin/teacher-provisioning";

const authorization = authorizeTeacherProvisioningCommand({
  allowFlag: "true",
  confirmation: "PROVISION_TEACHER",
});

function fakeDb(input: {
  subjectMapping?: object | null;
  providerMapping?: object | null;
  user?: {
    id: string;
    platformRole: PlatformRole;
    accountStatus: AccountStatus;
  } | null;
  emailOwner?: object | null;
}) {
  const externalIdentity = {
    findUnique: vi.fn(async (query: { where: object }) => {
      if ("provider_providerSubject" in query.where) {
        return input.subjectMapping ?? null;
      }
      return input.providerMapping ?? null;
    }),
    create: vi.fn(async ({ data }: { data: object }) => ({ id: "identity-1", ...data })),
  };
  const user = {
    findUnique: vi.fn(async (query: { where: { id?: string; email?: string } }) =>
      query.where.email ? input.emailOwner ?? null : input.user ?? null,
    ),
    findFirst: vi.fn(async () => input.emailOwner ?? null),
    create: vi.fn(async () => ({ id: "new-teacher" })),
  };
  const tx = { externalIdentity, user };
  return {
    db: {
      externalIdentity,
      user,
      $transaction: vi.fn(async (operation: (client: typeof tx) => unknown) =>
        operation(tx),
      ),
    } as never,
    externalIdentity,
    user,
  };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  try {
    await promise;
    throw new Error("Expected teacher provisioning to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(TeacherProvisioningError);
    expect((error as TeacherProvisioningError).code).toBe(code);
  }
}

describe("admin teacher provisioning", () => {
  it("requires the explicit administrator command gate", () => {
    expect(() =>
      authorizeTeacherProvisioningCommand({
        allowFlag: undefined,
        confirmation: "PROVISION_TEACHER",
      }),
    ).toThrow(TeacherProvisioningError);
  });

  it("creates and links an explicitly provisioned teacher", async () => {
    const { db, user } = fakeDb({});
    const result = await provisionTeacher(db, authorization, {
      mode: "CREATE",
      name: "  Pilot Teacher  ",
      email: "  TEACHER@EXAMPLE.COM ",
      clerkSubject: " clerk_teacher_1 ",
    });

    expect(result).toEqual({ status: "CREATED", userId: "new-teacher" });
    expect(user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Pilot Teacher",
        email: "teacher@example.com",
        platformRole: PlatformRole.TEACHER,
        accountStatus: AccountStatus.ACTIVE,
        externalIdentities: {
          create: {
            provider: "clerk",
            providerSubject: "clerk_teacher_1",
          },
        },
      }),
      select: { id: true },
    });
  });

  it("rejects an already-linked Clerk subject", async () => {
    const { db } = fakeDb({ subjectMapping: { id: "existing" } });
    await expectCode(
      provisionTeacher(db, authorization, {
        mode: "CREATE",
        name: "Teacher",
        email: "teacher@example.com",
        clerkSubject: "already-linked",
      }),
      "DUPLICATE_SUBJECT",
    );
  });

  it("never promotes or links an existing student as a teacher", async () => {
    const { db, externalIdentity } = fakeDb({
      user: {
        id: "student-1",
        platformRole: PlatformRole.STUDENT,
        accountStatus: AccountStatus.ACTIVE,
      },
    });
    await expectCode(
      provisionTeacher(db, authorization, {
        mode: "LINK_EXISTING",
        userId: "student-1",
        clerkSubject: "student-subject",
      }),
      "INVALID_ROLE",
    );
    expect(externalIdentity.create).not.toHaveBeenCalled();
  });

  it("rejects a disabled teacher", async () => {
    const { db } = fakeDb({
      user: {
        id: "teacher-disabled",
        platformRole: PlatformRole.TEACHER,
        accountStatus: AccountStatus.DISABLED,
      },
    });
    await expectCode(
      provisionTeacher(db, authorization, {
        mode: "LINK_EXISTING",
        userId: "teacher-disabled",
        clerkSubject: "teacher-subject",
      }),
      "DISABLED_USER",
    );
  });

  it("rejects email collisions without linking by email", async () => {
    const { db, user, externalIdentity } = fakeDb({
      emailOwner: { id: "student-with-email" },
    });
    await expectCode(
      provisionTeacher(db, authorization, {
        mode: "CREATE",
        name: "Teacher",
        email: "existing@example.com",
        clerkSubject: "new-subject",
      }),
      "EMAIL_IN_USE",
    );
    expect(user.create).not.toHaveBeenCalled();
    expect(externalIdentity.create).not.toHaveBeenCalled();
  });

  it("rejects a conflicting Clerk mapping on the selected teacher", async () => {
    const { db } = fakeDb({
      user: {
        id: "teacher-1",
        platformRole: PlatformRole.TEACHER,
        accountStatus: AccountStatus.ACTIVE,
      },
      providerMapping: { id: "other-clerk-mapping" },
    });
    await expectCode(
      provisionTeacher(db, authorization, {
        mode: "LINK_EXISTING",
        userId: "teacher-1",
        clerkSubject: "new-subject",
      }),
      "PROVIDER_CONFLICT",
    );
  });

  it("does not bypass guarded student onboarding", () => {
    expect(
      parseStudentOnboardingInput({
        identity: { provider: "clerk", providerSubject: "new-student" },
        profile: { name: "Student", email: "student@example.com" },
      }).success,
    ).toBe(false);
  });
});
