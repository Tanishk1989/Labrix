import {
  AccountStatus,
  PlatformRole,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import { z } from "zod";

const roleOnboardingSchema = z.object({
  role: z.nativeEnum(PlatformRole),
  identity: z.object({
    provider: z.literal("clerk"),
    providerSubject: z.string().trim().min(1).max(255),
  }),
  profile: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(320),
  }),
});

export type RoleOnboardingResult =
  | { ok: true; status: "CREATED" | "ALREADY_CONFIGURED" | "PROMOTED_TO_TEACHER"; userId: string; role: PlatformRole }
  | { ok: false; code: "INVALID_INPUT" | "DISABLED_ACCOUNT" | "EMAIL_IN_USE" | "CONFLICT" };

type RoleOnboardingDb = Pick<PrismaClient, "$transaction" | "externalIdentity" | "user">;

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function onboardRole(
  db: RoleOnboardingDb,
  input: unknown,
): Promise<RoleOnboardingResult> {
  const parsed = roleOnboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  const { identity, profile, role } = parsed.data;

  try {
    return await db.$transaction(async (tx) => {
      const mapping = await tx.externalIdentity.findUnique({
        where: {
          provider_providerSubject: {
            provider: identity.provider,
            providerSubject: identity.providerSubject,
          },
        },
        include: {
          user: { select: { id: true, platformRole: true, accountStatus: true } },
        },
      });

      if (mapping) {
        if (mapping.user.accountStatus === AccountStatus.DISABLED) {
          return { ok: false, code: "DISABLED_ACCOUNT" } as const;
        }

        // Promotion is deliberately self-service. A teacher is never silently
        // demoted by choosing the student sign-in card, because that could
        // orphan classrooms they own.
        if (role === PlatformRole.TEACHER && mapping.user.platformRole === PlatformRole.STUDENT) {
          await tx.user.update({
            where: { id: mapping.user.id },
            data: {
              platformRole: PlatformRole.TEACHER,
              accountStatus: AccountStatus.ACTIVE,
              teacherApprovalRequestedAt: null,
              teacherApprovalNotifiedAt: null,
              teacherApprovedAt: null,
            },
          });
          return {
            ok: true,
            status: "PROMOTED_TO_TEACHER",
            userId: mapping.user.id,
            role: PlatformRole.TEACHER,
          } as const;
        }

        return {
          ok: true,
          status: "ALREADY_CONFIGURED",
          userId: mapping.user.id,
          role: mapping.user.platformRole,
        } as const;
      }

      const emailOwner = await tx.user.findUnique({
        where: { email: profile.email },
        select: { id: true, accountStatus: true },
      });
      if (emailOwner) {
        return {
          ok: false,
          code: emailOwner.accountStatus === AccountStatus.DISABLED
            ? "DISABLED_ACCOUNT"
            : "EMAIL_IN_USE",
        } as const;
      }

      const user = await tx.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          platformRole: role,
          accountStatus: AccountStatus.ACTIVE,
          externalIdentities: {
            create: {
              provider: identity.provider,
              providerSubject: identity.providerSubject,
            },
          },
        },
        select: { id: true },
      });

      return { ok: true, status: "CREATED", userId: user.id, role } as const;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    });
  } catch (error) {
    if (isUniqueConflict(error)) return { ok: false, code: "CONFLICT" };
    throw error;
  }
}
