import { redirect } from "next/navigation";
import { PremiumAuthShell } from "@/components/premium-auth-shell";
import { RoleAwareSignUp } from "@/components/role-aware-sign-up";
import { getIdentityMode } from "@/server/actors/identity-mode";

import { parseSignInIntent } from "@/server/actors/sign-in-intent";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  if (getIdentityMode() === "demo") redirect("/dashboard");
  const intent = parseSignInIntent((await searchParams).role);

  return (
    <PremiumAuthShell
      eyebrow="Join TRACE"
      title="Build stronger problem solvers."
      description="Create a clear, accountable programming classroom where students can practise, submit, and improve."
    >
      <RoleAwareSignUp intent={intent} />
    </PremiumAuthShell>
  );
}
