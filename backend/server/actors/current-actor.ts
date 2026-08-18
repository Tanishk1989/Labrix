import type { PlatformRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireActiveAccount } from "./account-status";
import { clerkIdentitySource } from "./clerk-identity-source";
import {
  parseExternalIdentity,
  type ExternalIdentitySource,
} from "./external-identity-source";
import { resolveDemoStudentActor, resolveDemoTeacherActor } from "./demo-session";
import { resolveIdentityMode, type IdentityMode } from "./identity-mode";

type IdentityDb = Pick<Prisma.TransactionClient, "externalIdentity">;

export interface CurrentActor {
  id: string;
  name: string;
  role: PlatformRole;
  source: "seeded-demo-session" | "external-identity";
}

export class UnauthenticatedActorError extends Error {
  constructor() {
    super("A valid external session is required.");
    this.name = "UnauthenticatedActorError";
  }
}

export class UnlinkedActorError extends Error {
  constructor() {
    super("The external account is not linked to a TRACE user.");
    this.name = "UnlinkedActorError";
  }
}

export class ActorRoleDeniedError extends Error {
  constructor() {
    super("The local TRACE role cannot perform this operation.");
    this.name = "ActorRoleDeniedError";
  }
}

export async function resolveCurrentActor(options: {
  mode?: IdentityMode;
  demoActor?: "student" | "teacher";
  identitySource?: ExternalIdentitySource;
  db?: IdentityDb;
  nodeEnv?: string;
  allowProductionBuildDemo?: string;
} = {}): Promise<CurrentActor> {
  const mode = resolveIdentityMode({
    mode: options.mode ?? process.env.LABRIX_IDENTITY_MODE,
    nodeEnv: options.nodeEnv ?? process.env.NODE_ENV,
    allowProductionBuildDemo:
      options.allowProductionBuildDemo ??
      process.env.LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD,
  });
  if (mode === "demo") {
    return options.demoActor === "student"
      ? resolveDemoStudentActor()
      : resolveDemoTeacherActor();
  }

  const identity = parseExternalIdentity(
    await (options.identitySource ?? clerkIdentitySource).getExternalIdentity(),
  );
  if (!identity) throw new UnauthenticatedActorError();

  const mapping = await (options.db ?? prisma).externalIdentity.findUnique({
    where: {
      provider_providerSubject: {
        provider: identity.provider,
        providerSubject: identity.providerSubject,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          platformRole: true,
          accountStatus: true,
        },
      },
    },
  });
  if (!mapping) throw new UnlinkedActorError();
  requireActiveAccount(mapping.user.accountStatus);
  return {
    id: mapping.user.id,
    name: mapping.user.name,
    role: mapping.user.platformRole,
    source: "external-identity",
  };
}

export function requireActorRole(
  actor: CurrentActor,
  expectedRole: PlatformRole,
): CurrentActor {
  if (actor.role !== expectedRole) throw new ActorRoleDeniedError();
  return actor;
}
