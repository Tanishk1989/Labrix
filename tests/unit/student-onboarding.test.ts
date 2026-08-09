import { describe, expect, it } from "vitest";
import { parseStudentOnboardingInput } from "@/server/onboarding/student-onboarding";

const validInput = {
  joinCode: "  class-abcde  ",
  identity: { provider: "clerk", providerSubject: "user_clerk_123" },
  profile: { name: "  Student One  ", email: "  STUDENT@EXAMPLE.COM  " },
};

describe("student onboarding input", () => {
  it("normalizes the join code and profile without changing identity semantics", () => {
    const parsed = parseStudentOnboardingInput(validInput);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({
      joinCode: "CLASS-ABCDE",
      identity: { provider: "clerk", providerSubject: "user_clerk_123" },
      profile: { name: "Student One", email: "student@example.com" },
    });
  });

  it("rejects empty codes and non-Clerk onboarding identities", () => {
    expect(
      parseStudentOnboardingInput({ ...validInput, joinCode: " " }).success,
    ).toBe(false);
    expect(
      parseStudentOnboardingInput({
        ...validInput,
        identity: { provider: "browser", providerSubject: "forged" },
      }).success,
    ).toBe(false);
  });
});
