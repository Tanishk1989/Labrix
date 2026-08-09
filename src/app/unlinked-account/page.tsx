import { redirect } from "next/navigation";
import { AuthStatePage } from "@/components/auth-state-page";
import { StudentOnboardingForm } from "@/features/onboarding/student-onboarding-form";
import { DisabledAccountError } from "@/server/actors/account-status";
import {
  resolveCurrentActor,
  UnauthenticatedActorError,
  UnlinkedActorError,
} from "@/server/actors/current-actor";
import { InvalidExternalIdentityError } from "@/server/actors/external-identity-source";
import { getIdentityMode } from "@/server/actors/identity-mode";

export default async function UnlinkedAccountPage() {
  if (getIdentityMode() === "demo") {
    return (
      <AuthStatePage
        title="Account not linked"
        description="Student onboarding is disabled in the explicitly configured demo identity mode."
      />
    );
  }

  let destination: string | undefined;
  try {
    await resolveCurrentActor();
    destination = "/classes";
  } catch (error) {
    if (error instanceof UnauthenticatedActorError) destination = "/sign-in";
    else if (error instanceof DisabledAccountError) destination = "/disabled-account";
    else if (error instanceof InvalidExternalIdentityError) destination = "/unauthorized";
    else if (!(error instanceof UnlinkedActorError)) throw error;
  }
  if (destination) redirect(destination);
  return <StudentOnboardingForm />;
}
