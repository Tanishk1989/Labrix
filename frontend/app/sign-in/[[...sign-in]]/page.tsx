import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthStatePage } from "@/components/auth-state-page";
import { getIdentityMode } from "@/server/actors/identity-mode";

export default async function SignInPage() {
  const identityMode = getIdentityMode();
  if (identityMode === "demo") {
    return (
      <AuthStatePage
        title="Demo identity mode"
        description="Clerk sign-in is disabled in the explicitly configured non-production demo mode."
        showSignOut={false}
      />
    );
  }
  const session = await auth();
  if (session.isAuthenticated) redirect("/dashboard");
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <SignIn
        appearance={{
          elements: {
            socialButtonsBlockButton: { display: "none" },
            dividerRow: { display: "none" },
          },
        }}
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/classes"
      />
    </main>
  );
}
