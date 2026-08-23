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
import { resolveDemoStudentActor, resolveDemoTeacherActor } from "./demo-session";
import { InvalidExternalIdentityError } from "./external-identity-source";
import { getIdentityMode } from "./identity-mode";

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
  const mode = getIdentityMode();

  if (mode === "demo") {
    const actor =
      options.demoActor === "student"
        ? await resolveDemoStudentActor()
        : await resolveDemoTeacherActor();
    return options.requiredRole
      ? requireActorRole(actor, options.requiredRole)
      : actor;
  }

  try {
    const actor = await resolveCurrentActor({ demoActor: options.demoActor });
    return options.requiredRole
      ? requireActorRole(actor, options.requiredRole)
      : actor;
  } catch (error) {
    if (
      error instanceof UnauthenticatedActorError ||
      error instanceof UnlinkedActorError ||
      error instanceof InvalidExternalIdentityError
    ) {
      const fallbackActor =
        options.demoActor === "student"
          ? await resolveDemoStudentActor()
          : await resolveDemoTeacherActor();
      return options.requiredRole
        ? requireActorRole(fallbackActor, options.requiredRole)
        : fallbackActor;
    }
    const destination = actorErrorDestination(error);
    if (destination) redirect(destination);
    throw error;
  }
}
