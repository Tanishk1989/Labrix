import {
  AccountStatus,
  MembershipRole,
  PlatformRole,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import { z } from "zod";

const onboardingInputSchema = z.object({
  joinCode: z.string().trim().min(1).max(80).transform((value) => value.toUpperCase()),
  identity: z.object({
    provider: z.literal("clerk"),
    providerSubject: z.string().trim().min(1).max(255),
  }),
  profile: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(320),
  }),
});

export type StudentOnboardingInput = z.input<typeof onboardingInputSchema>;

export type StudentOnboardingResult =
  | {
      ok: true;
      status: "CREATED" | "ALREADY_ONBOARDED";
      userId: string;
      classroomId?: string;
    }
  | {
      ok: false;
      code:
        | "INVALID_INPUT"
        | "INVALID_JOIN_CODE"
        | "DISABLED_ACCOUNT"
        | "EMAIL_IN_USE"
        | "CONFLICT";
    };

type OnboardingDb = Pick<PrismaClient, "$transaction" | "externalIdentity" | "user">;

export function parseStudentOnboardingInput(input: unknown) {
  return onboardingInputSchema.safeParse(input);
}

function existingIdentityResult(mapping: {
  userId: string;
  user: { accountStatus: AccountStatus };
}): StudentOnboardingResult {
  if (mapping.user.accountStatus === AccountStatus.DISABLED) {
    return { ok: false, code: "DISABLED_ACCOUNT" };
  }
  return {
    ok: true,
    status: "ALREADY_ONBOARDED",
    userId: mapping.userId,
  };
}

function isUniqueConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function onboardStudent(
  db: OnboardingDb,
  input: unknown,
): Promise<StudentOnboardingResult> {
  const parsed = parseStudentOnboardingInput(input);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  const { identity, profile, joinCode } = parsed.data;

  const existing = await db.externalIdentity.findUnique({
    where: {
      provider_providerSubject: {
        provider: identity.provider,
        providerSubject: identity.providerSubject,
      },
    },
    include: { user: { select: { accountStatus: true } } },
  });
  if (existing) return existingIdentityResult(existing);

  try {
    return await db.$transaction(
      async (tx) => {
        const concurrentIdentity = await tx.externalIdentity.findUnique({
          where: {
            provider_providerSubject: {
              provider: identity.provider,
              providerSubject: identity.providerSubject,
            },
          },
          include: { user: { select: { accountStatus: true } } },
        });
        if (concurrentIdentity) return existingIdentityResult(concurrentIdentity);

        const classroom = await tx.classroom.findFirst({
          where: { joinCode, status: "ACTIVE" },
          select: { id: true },
        });
        if (!classroom) {
          return { ok: false, code: "INVALID_JOIN_CODE" } as const;
        }

        const user = await tx.user.create({
          data: {
            name: profile.name,
            email: profile.email,
            platformRole: PlatformRole.STUDENT,
            accountStatus: AccountStatus.ACTIVE,
            externalIdentities: {
              create: {
                provider: identity.provider,
                providerSubject: identity.providerSubject,
              },
            },
            memberships: {
              create: {
                classroomId: classroom.id,
                role: MembershipRole.STUDENT,
                active: true,
              },
            },
          },
          select: { id: true },
        });

        return {
          ok: true,
          status: "CREATED",
          userId: user.id,
          classroomId: classroom.id,
        } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;

    const concurrentIdentity = await db.externalIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: identity.provider,
          providerSubject: identity.providerSubject,
        },
      },
      include: { user: { select: { accountStatus: true } } },
    });
    if (concurrentIdentity) return existingIdentityResult(concurrentIdentity);

    const emailOwner = await db.user.findUnique({
      where: { email: profile.email },
      select: { id: true },
    });
    return emailOwner
      ? { ok: false, code: "EMAIL_IN_USE" }
      : { ok: false, code: "CONFLICT" };
  }
}
