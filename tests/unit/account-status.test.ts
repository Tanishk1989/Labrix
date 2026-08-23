import { AccountStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  DisabledAccountError,
  PendingTeacherApprovalError,
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

  it("routes a pending teacher to the verification state", () => {
    expect(() =>
      requireActiveAccount(AccountStatus.PENDING_TEACHER_APPROVAL),
    ).toThrow(PendingTeacherApprovalError);
  });
});
