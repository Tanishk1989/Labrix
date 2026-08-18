import { auth, currentUser } from "@clerk/nextjs/server";

export class OnboardingSessionError extends Error {
  constructor() {
    super("A valid Clerk session is required for onboarding.");
    this.name = "OnboardingSessionError";
  }
}

export class OnboardingProfileError extends Error {
  constructor() {
    super("A verified primary email is required for onboarding.");
    this.name = "OnboardingProfileError";
  }
}

export async function getClerkOnboardingProfile() {
  const session = await auth();
  if (!session.isAuthenticated || !session.userId) {
    throw new OnboardingSessionError();
  }
  const user = await currentUser();
  if (!user) throw new OnboardingSessionError();
  if (user.id !== session.userId) throw new OnboardingSessionError();

  const primaryEmail = user.primaryEmailAddress;
  if (!primaryEmail || primaryEmail.verification?.status !== "verified") {
    throw new OnboardingProfileError();
  }

  return {
    identity: { provider: "clerk" as const, providerSubject: session.userId },
    profile: {
      name:
        user.fullName?.trim() ||
        primaryEmail.emailAddress.split("@")[0] ||
        "TRACE Student",
      email: primaryEmail.emailAddress,
    },
  };
}
