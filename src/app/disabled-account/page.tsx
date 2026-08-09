import { AuthStatePage } from "@/components/auth-state-page";

export default function DisabledAccountPage() {
  return (
    <AuthStatePage
      title="Account disabled"
      description="Your external session is valid, but this local Labrix account is disabled. Contact the Labrix administrator for help."
    />
  );
}
