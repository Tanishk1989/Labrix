import {
  AccountStatus,
  PlatformRole,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import { z } from "zod";

const confirmationPhrase = "PROVISION_TEACHER";
const authorizationMarker = Symbol("teacher-provisioning-authorization");

type TeacherProvisioningAuthorization = {
  readonly [authorizationMarker]: true;
};

const teacherProvisioningInputSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("CREATE"),
    clerkSubject: z.string().trim().min(1).max(255),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(320),
  }),
  z.object({
    mode: z.literal("LINK_EXISTING"),
    clerkSubject: z.string().trim().min(1).max(255),
    userId: z.string().trim().min(1).max(255),
  }),
]);

export type TeacherProvisioningInput = z.input<
  typeof teacherProvisioningInputSchema
>;

export type TeacherProvisioningErrorCode =
  | "NOT_AUTHORIZED"
  | "INVALID_INPUT"
  | "USER_NOT_FOUND"
  | "INVALID_ROLE"
  | "DISABLED_USER"
  | "DUPLICATE_SUBJECT"
  | "PROVIDER_CONFLICT"
  | "EMAIL_IN_USE"
  | "CONFLICT";

export class TeacherProvisioningError extends Error {
  constructor(
    public readonly code: TeacherProvisioningErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TeacherProvisioningError";
  }
}

export function authorizeTeacherProvisioningCommand(input: {
  allowFlag: string | undefined;
  confirmation: string | undefined;
}): TeacherProvisioningAuthorization {
  if (
    input.allowFlag !== "true" ||
    input.confirmation !== confirmationPhrase
  ) {
    throw new TeacherProvisioningError(
      "NOT_AUTHORIZED",
      `Teacher provisioning requires LABRIX_ALLOW_TEACHER_PROVISIONING=true and --confirm ${confirmationPhrase}.`,
    );
  }
  return { [authorizationMarker]: true };
}

type ProvisioningDb = Pick<
  PrismaClient,
  "$transaction" | "externalIdentity" | "user"
>;

function isUniqueConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function provisionTeacher(
  db: ProvisioningDb,
  authorization: TeacherProvisioningAuthorization,
  input: TeacherProvisioningInput,
) {
  if (authorization[authorizationMarker] !== true) {
    throw new TeacherProvisioningError(
      "NOT_AUTHORIZED",
      "Teacher provisioning requires administrator command authorization.",
    );
  }

  const parsed = teacherProvisioningInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new TeacherProvisioningError(
      "INVALID_INPUT",
      "Teacher provisioning input is invalid.",
    );
  }
  const request = parsed.data;

  try {
    return await db.$transaction(
      async (tx) => {
        const subjectMapping = await tx.externalIdentity.findUnique({
          where: {
            provider_providerSubject: {
              provider: "clerk",
              providerSubject: request.clerkSubject,
            },
          },
          select: { id: true },
        });
        if (subjectMapping) {
          throw new TeacherProvisioningError(
            "DUPLICATE_SUBJECT",
            "This Clerk subject is already linked.",
          );
        }

        if (request.mode === "LINK_EXISTING") {
          const user = await tx.user.findUnique({
            where: { id: request.userId },
            select: {
              id: true,
              platformRole: true,
              accountStatus: true,
            },
          });
          if (!user) {
            throw new TeacherProvisioningError(
              "USER_NOT_FOUND",
              "The explicitly selected Labrix user does not exist.",
            );
          }
          if (user.platformRole !== PlatformRole.TEACHER) {
            throw new TeacherProvisioningError(
              "INVALID_ROLE",
              "An existing student cannot be promoted or linked as a teacher.",
            );
          }
          if (user.accountStatus !== AccountStatus.ACTIVE) {
            throw new TeacherProvisioningError(
              "DISABLED_USER",
              "A disabled Labrix user cannot be provisioned.",
            );
          }

          const providerMapping = await tx.externalIdentity.findUnique({
            where: {
              userId_provider: { userId: user.id, provider: "clerk" },
            },
            select: { id: true },
          });
          if (providerMapping) {
            throw new TeacherProvisioningError(
              "PROVIDER_CONFLICT",
              "The selected Labrix teacher already has a Clerk mapping.",
            );
          }

          await tx.externalIdentity.create({
            data: {
              userId: user.id,
              provider: "clerk",
              providerSubject: request.clerkSubject,
            },
          });
          return { status: "LINKED" as const, userId: user.id };
        }

        const emailOwner = await tx.user.findFirst({
          where: {
            email: { equals: request.email, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (emailOwner) {
          throw new TeacherProvisioningError(
            "EMAIL_IN_USE",
            "A Labrix user already owns this email; accounts are never linked by email.",
          );
        }

        const user = await tx.user.create({
          data: {
            name: request.name,
            email: request.email,
            platformRole: PlatformRole.TEACHER,
            accountStatus: AccountStatus.ACTIVE,
            externalIdentities: {
              create: {
                provider: "clerk",
                providerSubject: request.clerkSubject,
              },
            },
          },
          select: { id: true },
        });
        return { status: "CREATED" as const, userId: user.id };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
  } catch (error) {
    if (error instanceof TeacherProvisioningError) throw error;
    if (!isUniqueConflict(error)) throw error;

    const subjectMapping = await db.externalIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: "clerk",
          providerSubject: request.clerkSubject,
        },
      },
      select: { id: true },
    });
    if (subjectMapping) {
      throw new TeacherProvisioningError(
        "DUPLICATE_SUBJECT",
        "This Clerk subject is already linked.",
      );
    }
    throw new TeacherProvisioningError(
      "CONFLICT",
      "Teacher provisioning conflicted with another administrative operation.",
    );
  }
}
