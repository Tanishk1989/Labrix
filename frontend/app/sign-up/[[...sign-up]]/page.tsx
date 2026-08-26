import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { PremiumAuthShell } from "@/components/premium-auth-shell";
import { getIdentityMode } from "@/server/actors/identity-mode";

export default function SignUpPage() {
  if (getIdentityMode() === "demo") redirect("/dashboard");

  return (
    <PremiumAuthShell
      eyebrow="Join TRACE"
      title="Build stronger problem solvers."
      description="Create a clear, accountable programming classroom where students can practise, submit, and improve."
    >
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </PremiumAuthShell>
  );
}
