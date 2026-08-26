import { describe, expect, it } from "vitest";
import { DisabledAccountError } from "@/server/actors/account-status";
import {
  UnauthenticatedActorError,
  UnlinkedActorError,
} from "@/server/actors/current-actor";
import { InvalidExternalIdentityError } from "@/server/actors/external-identity-source";
import {
  parseSignInIntent,
  postSignInErrorDestination,
} from "@/server/actors/sign-in-intent";

describe("sign-in intent", () => {
  it("accepts only the supported workspace choices", () => {
    expect(parseSignInIntent("teacher")).toBe("teacher");
    expect(parseSignInIntent("student")).toBe("student");
    expect(parseSignInIntent("admin")).toBeNull();
    expect(parseSignInIntent(undefined)).toBeNull();
  });

  it("preserves the intent when an unauthenticated session retries", () => {
    expect(postSignInErrorDestination(new UnauthenticatedActorError(), "teacher"))
      .toBe("/sign-in?role=teacher");
  });

  it("allows student onboarding but never self-provisions a teacher", () => {
    expect(postSignInErrorDestination(new UnlinkedActorError(), "student"))
      .toBe("/unlinked-account");
    expect(postSignInErrorDestination(new UnlinkedActorError(), "teacher"))
      .toBe("/unauthorized");
  });

  it("routes unsafe and disabled identities to bounded account states", () => {
    expect(postSignInErrorDestination(new DisabledAccountError(), null))
      .toBe("/disabled-account");
    expect(postSignInErrorDestination(new InvalidExternalIdentityError(), null))
      .toBe("/unauthorized");
  });
});
