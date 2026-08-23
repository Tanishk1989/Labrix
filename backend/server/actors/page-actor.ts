import type { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { DisabledAccountError } from "./account-status";
import {
  ActorRoleDeniedError,
  requireActorRole,
  resolveCurrentActor,
  UnauthenticatedActorError,
  UnlinkedActorError,
  type CurrentActor,
} from "./current-actor";
import { InvalidExternalIdentityError } from "./external-identity-source";

export function actorErrorDestination(error: unknown): string | null {
  if (error instanceof UnauthenticatedActorError) return "/sign-in";
  if (error instanceof UnlinkedActorError) return "/unlinked-account";
  if (error instanceof DisabledAccountError) return "/disabled-account";
  if (
    error instanceof InvalidExternalIdentityError ||
    error instanceof ActorRoleDeniedError
  ) {
    return "/unauthorized";
  }
  return null;
}

export async function resolveCurrentActorForPage(options: {
  demoActor?: "student" | "teacher";
  requiredRole?: PlatformRole;
} = {}): Promise<CurrentActor> {
  try {
    const actor = await resolveCurrentActor({ demoActor: options.demoActor });
    return options.requiredRole
      ? requireActorRole(actor, options.requiredRole)
      : actor;
  } catch (error) {
    const destination = actorErrorDestination(error);
    if (destination) redirect(destination);
    throw error;
  }
}
