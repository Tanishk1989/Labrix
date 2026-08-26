import { DisabledAccountError } from "./account-status";
import {
  UnauthenticatedActorError,
  UnlinkedActorError,
} from "./current-actor";
import { InvalidExternalIdentityError } from "./external-identity-source";

export type SignInIntent = "student" | "teacher";

export function parseSignInIntent(value: string | string[] | undefined): SignInIntent | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "student" || candidate === "teacher" ? candidate : null;
}

export function postSignInErrorDestination(
  error: unknown,
  intent: SignInIntent | null,
): string | null {
  if (error instanceof UnauthenticatedActorError) {
    return intent ? `/sign-in?role=${intent}` : "/sign-in";
  }
  if (error instanceof UnlinkedActorError) {
    return intent === "teacher" ? "/unauthorized" : "/unlinked-account";
  }
  if (error instanceof DisabledAccountError) return "/disabled-account";
  if (error instanceof InvalidExternalIdentityError) return "/unauthorized";
  return null;
}
