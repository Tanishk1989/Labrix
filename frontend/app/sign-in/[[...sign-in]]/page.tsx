import { redirect } from "next/navigation";
import { PremiumAuthShell } from "@/components/premium-auth-shell";
import { RoleAwareSignIn } from "@/components/role-aware-sign-in";
import { getIdentityMode } from "@/server/actors/identity-mode";
import { parseSignInIntent } from "@/server/actors/sign-in-intent";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  if (getIdentityMode() === "demo") redirect("/dashboard");
  const intent = parseSignInIntent((await searchParams).role);

  return (
    <PremiumAuthShell
      eyebrow="Welcome back"
      title="Return to the work that matters."
      description="Open your classes, run rigorous practicals, and understand how every student is progressing."
    >
      <RoleAwareSignIn intent={intent} />
    </PremiumAuthShell>
  );
}
