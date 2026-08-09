import { AuthStatePage } from "@/components/auth-state-page";

export default function UnlinkedAccountPage() {
  return (
    <AuthStatePage
      title="Account not linked"
      description="Your Clerk session is valid, but it is not linked to a Labrix user yet. An administrator must explicitly link the account before you can access classrooms."
    />
  );
}
