import Link from "next/link";
import { EmptyState } from "@/components/design-system";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12 sm:px-6">
      <EmptyState
        className="w-full"
        title="We couldn’t open this page"
        description="The link may be incorrect, or you may not have access."
        action={<Link href="/dashboard" className="button-secondary min-h-11">Return to dashboard</Link>}
        headingLevel="h1"
      />
    </main>
  );
}
