"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getIdentityMode } from "@/server/actors/identity-mode";
import {
  getClerkOnboardingProfile,
  OnboardingProfileError,
  OnboardingSessionError,
} from "@/server/onboarding/clerk-profile";
import { onboardStudent } from "@/server/onboarding/student-onboarding";
import { CLASSROOM_MANAGEMENT_CACHE_TAG } from "@/server/teacher/cache-tags";

export interface OnboardingFormState {
  message?: string;
}

export async function submitStudentOnboarding(
  _previousState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  if (getIdentityMode() !== "clerk") {
    return { message: "Student onboarding is available only in Clerk mode." };
  }

  let verifiedProfile;
  try {
    verifiedProfile = await getClerkOnboardingProfile();
  } catch (error) {
    if (error instanceof OnboardingSessionError) redirect("/sign-in");
    if (error instanceof OnboardingProfileError) {
      return { message: error.message };
    }
    throw error;
  }

  let result;
  try {
    result = await onboardStudent(prisma, {
      joinCode: formData.get("joinCode"),
      ...verifiedProfile,
    });
  } catch {
    return { message: "TRACE could not complete onboarding. Please try again." };
  }

  if (result.ok) {
    updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);
    redirect("/classes");
  }
  if (result.code === "DISABLED_ACCOUNT") redirect("/disabled-account");

  const messages = {
    INVALID_INPUT: "Enter a valid classroom join code.",
    INVALID_JOIN_CODE: "We could not find an active classroom with that join code.",
    EMAIL_IN_USE:
      "A TRACE account already uses this email. Ask an administrator to resolve it; TRACE will not link accounts by email.",
    CONFLICT: "TRACE could not complete onboarding safely. Please try again.",
  } as const;
  return { message: messages[result.code] };
}
