import { redirect } from "next/navigation";
import { RoleOnboardingForm } from "@/features/onboarding/role-onboarding-form";
import { getIdentityMode } from "@/server/actors/identity-mode";
import { parseSignInIntent } from "@/server/actors/sign-in-intent";

export default async function AccountSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  if (getIdentityMode() === "demo") redirect("/dashboard");
  const role = parseSignInIntent((await searchParams).role);
  return <RoleOnboardingForm role={role} />;
}
