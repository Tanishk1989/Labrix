import { AuthStatePage } from "@/components/auth-state-page";

export default function DisabledAccountPage() {
  return (
    <AuthStatePage
      title="Account disabled"
      description="This TRACE account is disabled. Contact your classroom teacher or administrator for help."
    />
  );
}
