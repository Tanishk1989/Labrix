import { AccountStatus, PlatformRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  DisabledAccountError,
  PendingTeacherApprovalError,
} from "@/server/actors/account-status";
import {
  resolveCurrentActor,
  UnauthenticatedActorError,
  UnlinkedActorError,
} from "@/server/actors/current-actor";
import { InvalidExternalIdentityError } from "@/server/actors/external-identity-source";
import {
  IdentityConfigurationError,
  resolveIdentityMode,
} from "@/server/actors/identity-mode";
import { actorErrorDestination } from "@/server/actors/page-actor";

function fakeSource(value: unknown) {
  return { getExternalIdentity: vi.fn(async () => value) };
}

function fakeDb(
  user:
    | {
        id: string;
        name: string;
        platformRole: PlatformRole;
        accountStatus: AccountStatus;
      }
    | null,
) {
  return {
    externalIdentity: {
      findUnique: vi.fn(async () => (user ? { user } : null)),
    },
  } as never;
}

describe("authenticated current actor resolution", () => {
  it("defaults to Clerk when identity mode is omitted", () => {
    expect(resolveIdentityMode({ nodeEnv: "development" })).toBe("clerk");
  });

  it("rejects a missing Clerk session", async () => {
    await expect(
      resolveCurrentActor({
        mode: "clerk",
        identitySource: fakeSource(null),
        db: fakeDb(null),
      }),
    ).rejects.toBeInstanceOf(UnauthenticatedActorError);
  });

  it("rejects a malformed external identity", async () => {
    await expect(
      resolveCurrentActor({
        mode: "clerk",
        identitySource: fakeSource({ provider: "clerk", providerSubject: "" }),
        db: fakeDb(null),
      }),
    ).rejects.toBeInstanceOf(InvalidExternalIdentityError);
  });

  it.each([
    [PlatformRole.STUDENT, "linked-student"],
    [PlatformRole.TEACHER, "linked-teacher"],
  ])("returns a linked ACTIVE %s from local data", async (role, id) => {
    const actor = await resolveCurrentActor({
      mode: "clerk",
      identitySource: fakeSource({
        provider: "clerk",
        providerSubject: `subject-${id}`,
      }),
      db: fakeDb({
        id,
        name: "Linked User",
        platformRole: role,
        accountStatus: AccountStatus.ACTIVE,
      }),
    });
    expect(actor).toEqual({
      id,
      name: "Linked User",
      role,
      source: "external-identity",
    });
  });

  it("routes a valid but unlinked identity to the unlinked state", async () => {
    await expect(
      resolveCurrentActor({
        mode: "clerk",
        identitySource: fakeSource({
          provider: "clerk",
          providerSubject: "unlinked-subject",
        }),
        db: fakeDb(null),
      }),
    ).rejects.toBeInstanceOf(UnlinkedActorError);
  });

  it("denies a linked DISABLED local user", async () => {
    await expect(
      resolveCurrentActor({
        mode: "clerk",
        identitySource: fakeSource({
          provider: "clerk",
          providerSubject: "disabled-subject",
        }),
        db: fakeDb({
          id: "disabled-user",
          name: "Disabled User",
          platformRole: PlatformRole.STUDENT,
          accountStatus: AccountStatus.DISABLED,
        }),
      }),
    ).rejects.toBeInstanceOf(DisabledAccountError);
  });

  it("denies teacher access while administrator verification is pending", async () => {
    await expect(
      resolveCurrentActor({
        mode: "clerk",
        identitySource: fakeSource({
          provider: "clerk",
          providerSubject: "pending-teacher-subject",
        }),
        db: fakeDb({
          id: "pending-teacher",
          name: "Pending Teacher",
          platformRole: PlatformRole.TEACHER,
          accountStatus: AccountStatus.PENDING_TEACHER_APPROVAL,
        }),
      }),
    ).rejects.toBeInstanceOf(PendingTeacherApprovalError);
  });

  it.each([
    ["browserUserId", "demo-teacher"],
    ["browserRole", "TEACHER"],
  ])("ignores forged browser field %s", async (field, value) => {
    const actor = await resolveCurrentActor({
      mode: "clerk",
      identitySource: fakeSource({
        provider: "clerk",
        providerSubject: "real-student-subject",
      }),
      db: fakeDb({
        id: "real-student",
        name: "Real Student",
        platformRole: PlatformRole.STUDENT,
        accountStatus: AccountStatus.ACTIVE,
      }),
      ...({ [field]: value } as object),
    });
    expect(actor.id).toBe("real-student");
    expect(actor.role).toBe(PlatformRole.STUDENT);
  });

  it("never falls back from Clerk mode to a demo actor", async () => {
    await expect(
      resolveCurrentActor({
        mode: "clerk",
        identitySource: fakeSource(null),
        db: fakeDb(null),
        demoActor: "teacher",
      }),
    ).rejects.toBeInstanceOf(UnauthenticatedActorError);
  });

  it("routes unauthenticated and unlinked page actors without demo fallback", () => {
    expect(actorErrorDestination(new UnauthenticatedActorError())).toBe("/sign-in");
    expect(actorErrorDestination(new UnlinkedActorError())).toBe("/unlinked-account");
  });

  it("fails closed when the Clerk identity source is unavailable", async () => {
    const outage = new Error("identity provider unavailable");
    await expect(
      resolveCurrentActor({
        mode: "clerk",
        identitySource: {
          getExternalIdentity: vi.fn(async () => {
            throw outage;
          }),
        },
        db: fakeDb(null),
        demoActor: "teacher",
      }),
    ).rejects.toBe(outage);
  });

  it("rejects demo mode in production", async () => {
    expect(() =>
      resolveIdentityMode({ mode: "demo", nodeEnv: "production" }),
    ).toThrow(IdentityConfigurationError);
    await expect(
      resolveCurrentActor({
        mode: "demo",
        nodeEnv: "production",
        demoActor: "teacher",
      }),
    ).rejects.toBeInstanceOf(IdentityConfigurationError);
  });

  it("permits the exact supervised local production-build demo acknowledgement", async () => {
    expect(
      resolveIdentityMode({
        mode: "demo",
        nodeEnv: "production",
        allowProductionBuildDemo: "true",
      }),
    ).toBe("demo");
    expect(() =>
      resolveIdentityMode({
        mode: "demo",
        nodeEnv: "production",
        allowProductionBuildDemo: "TRUE",
      }),
    ).toThrow(IdentityConfigurationError);
  });
});
