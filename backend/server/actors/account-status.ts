import { AccountStatus } from "@prisma/client";

export class DisabledAccountError extends Error {
  constructor() {
    super("This TRACE account is disabled.");
    this.name = "DisabledAccountError";
  }
}

/**
 * Provider-neutral local account policy for a future authenticated resolver.
 * Authentication proves identity; this policy decides whether that local user
 * may continue. The fixed demo resolver intentionally does not call it yet.
 */
export function requireActiveAccount(status: AccountStatus): void {
  if (status !== AccountStatus.ACTIVE) throw new DisabledAccountError();
}
