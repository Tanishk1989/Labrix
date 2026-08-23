import type { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  DisabledAccountError,
  PendingTeacherApprovalError,
} from "./account-status";
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
    if (
      error instanceof UnauthenticatedActorError ||
      error instanceof UnlinkedActorError
    ) {
      const fallbackActor =
        options.demoActor === "student"
          ? await resolveDemoStudentActor()
          : await resolveDemoTeacherActor();
      return options.requiredRole
        ? requireActorRole(fallbackActor, options.requiredRole)
        : fallbackActor;
    }
    if (error instanceof PendingTeacherApprovalError) {
      redirect("/pending-teacher-approval");
    }
    if (error instanceof DisabledAccountError) redirect("/disabled-account");
    if (
      error instanceof InvalidExternalIdentityError ||
      error instanceof ActorRoleDeniedError
    ) {
      redirect("/unauthorized");
    }
    throw error;
  }
}
