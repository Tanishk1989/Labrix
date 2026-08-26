import { redirect } from "next/navigation";
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
    <main className="grid min-h-screen place-items-center bg-[#050609] px-4 py-12 sm:px-6">
      <RoleAwareSignIn intent={intent} />
    </main>
  );
}
