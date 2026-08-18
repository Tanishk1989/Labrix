import { SignUp } from "@clerk/nextjs";
import { AuthStatePage } from "@/components/auth-state-page";
import { getIdentityMode } from "@/server/actors/identity-mode";

export default function SignUpPage() {
  if (getIdentityMode() === "demo") {
    return (
      <AuthStatePage
        title="Demo identity mode"
        description="Clerk sign-up is disabled in the explicitly configured non-production demo mode."
        showSignOut={false}
      />
    );
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <SignUp
        appearance={{
          elements: {
            socialButtonsBlockButton: { display: "none" },
            dividerRow: { display: "none" },
          },
        }}
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/classes"
      />
    </main>
  );
}
