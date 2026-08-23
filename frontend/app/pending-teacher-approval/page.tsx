import { AuthStatePage } from "@/components/auth-state-page";

export default function PendingTeacherApprovalPage() {
  return (
    <AuthStatePage
      title="Teacher verification pending"
      description="Your teacher account request has been sent to the TRACE administrator. You will be able to enter the platform after the request is verified and approved."
    />
  );
}
