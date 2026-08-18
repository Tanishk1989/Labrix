import { AuthStatePage } from "@/components/auth-state-page";

export default function UnauthorizedPage() {
  return (
    <AuthStatePage
      title="Access denied"
      description="Your TRACE account does not have permission to open this page."
    />
  );
}
