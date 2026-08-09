import { AccountStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  DisabledAccountError,
  requireActiveAccount,
} from "@/server/actors/account-status";

describe("local account-status policy", () => {
  it("allows an ACTIVE account", () => {
    expect(() => requireActiveAccount(AccountStatus.ACTIVE)).not.toThrow();
  });

  it("denies a DISABLED account", () => {
    expect(() => requireActiveAccount(AccountStatus.DISABLED)).toThrow(
      DisabledAccountError,
    );
  });
});
