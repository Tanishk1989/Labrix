"use server";

import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getIdentityMode } from "@/server/actors/identity-mode";
import {
  getClerkOnboardingProfile,
  OnboardingProfileError,
  OnboardingSessionError,
} from "@/server/onboarding/clerk-profile";
import { onboardRole } from "@/server/onboarding/role-onboarding";

export interface RoleOnboardingState {
  message?: string;
}

export async function submitRoleOnboarding(
  _previousState: RoleOnboardingState,
  formData: FormData,
): Promise<RoleOnboardingState> {
  if (getIdentityMode() !== "clerk") {
    return { message: "Account setup is available only in Clerk mode." };
  }

  const roleValue = formData.get("role");
  const role = roleValue === "teacher"
    ? PlatformRole.TEACHER
    : roleValue === "student"
      ? PlatformRole.STUDENT
      : null;
  if (!role) return { message: "Choose Student or Teacher." };

  let verifiedProfile;
  try {
    verifiedProfile = await getClerkOnboardingProfile();
  } catch (error) {
    if (error instanceof OnboardingSessionError) redirect(`/sign-in?role=${roleValue}`);
    if (error instanceof OnboardingProfileError) return { message: error.message };
    throw error;
  }

  let result;
  try {
    result = await onboardRole(prisma, { role, ...verifiedProfile });
  } catch {
    return { message: "TRACE could not complete account setup. Please try again." };
  }

  if (result.ok) redirect("/dashboard");
  if (result.code === "DISABLED_ACCOUNT") redirect("/disabled-account");

  const messages = {
    INVALID_INPUT: "Choose a valid account role.",
    EMAIL_IN_USE: "A different TRACE identity already uses this email. Sign in with the original account or contact support.",
    CONFLICT: "TRACE could not complete account setup safely. Please try again.",
  } as const;
  return { message: messages[result.code] };
}
