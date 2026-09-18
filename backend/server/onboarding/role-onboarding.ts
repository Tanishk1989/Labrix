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
    emailVerified: z.literal(true),
  }),
});

export type RoleOnboardingResult =
  | { ok: true; status: "CREATED" | "ALREADY_CONFIGURED" | "ROLE_CHANGED" | "IDENTITY_LINKED"; userId: string; role: PlatformRole }
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

        // The role explicitly selected during sign-in is authoritative. Keep
        // owned classrooms and memberships intact so switching workspaces is
        // reversible and does not discard user data.
        if (role !== mapping.user.platformRole) {
          await tx.user.update({
            where: { id: mapping.user.id },
            data: {
              platformRole: role,
              accountStatus: AccountStatus.ACTIVE,
              teacherApprovalRequestedAt: null,
              teacherApprovalNotifiedAt: null,
              teacherApprovedAt: null,
            },
          });
          return {
            ok: true,
            status: "ROLE_CHANGED",
            userId: mapping.user.id,
            role,
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
        select: {
          id: true,
          accountStatus: true,
          externalIdentities: {
            where: { provider: identity.provider },
            select: { id: true },
          },
        },
      });
      if (emailOwner) {
        if (emailOwner.accountStatus === AccountStatus.DISABLED) {
          return { ok: false, code: "DISABLED_ACCOUNT" } as const;
        }

        // The caller only reaches this path after Clerk verifies the primary
        // email. Relink stale Clerk subjects (for example after an instance or
        // connection migration) while preserving the user's TRACE data.
        const existingClerkIdentity = emailOwner.externalIdentities[0];
        if (existingClerkIdentity) {
          await tx.externalIdentity.update({
            where: { id: existingClerkIdentity.id },
            data: { providerSubject: identity.providerSubject },
          });
        } else {
          await tx.externalIdentity.create({
            data: {
              userId: emailOwner.id,
              provider: identity.provider,
              providerSubject: identity.providerSubject,
            },
          });
        }
        await tx.user.update({
          where: { id: emailOwner.id },
          data: {
            name: profile.name,
            platformRole: role,
            accountStatus: AccountStatus.ACTIVE,
            teacherApprovalRequestedAt: null,
            teacherApprovalNotifiedAt: null,
            teacherApprovedAt: null,
          },
        });
        return {
          ok: true,
          status: "IDENTITY_LINKED",
          userId: emailOwner.id,
          role,
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
