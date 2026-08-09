import { Prisma, type PrismaClient } from "@prisma/client";

type LinkDb = Pick<PrismaClient, "user" | "externalIdentity">;

export class IdentityLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityLinkError";
  }
}

export async function linkExternalIdentity(
  db: LinkDb,
  input: { userId: string; provider: string; providerSubject: string },
) {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!user) throw new IdentityLinkError("The Labrix user does not exist.");

  const [subjectMapping, userProviderMapping] = await Promise.all([
    db.externalIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: input.provider,
          providerSubject: input.providerSubject,
        },
      },
    }),
    db.externalIdentity.findUnique({
      where: {
        userId_provider: { userId: input.userId, provider: input.provider },
      },
    }),
  ]);
  if (subjectMapping || userProviderMapping) {
    throw new IdentityLinkError("The requested identity mapping conflicts with an existing mapping.");
  }

  try {
    return await db.externalIdentity.create({ data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new IdentityLinkError("The requested identity mapping conflicts with an existing mapping.");
    }
    throw error;
  }
}
