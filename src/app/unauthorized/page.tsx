import { AuthStatePage } from "@/components/auth-state-page";

export default function UnauthorizedPage() {
  return (
    <AuthStatePage
      title="Access denied"
      description="Your authenticated Labrix account does not have permission to access this resource. Roles and classroom permissions are enforced from Labrix PostgreSQL."
    />
  );
}
