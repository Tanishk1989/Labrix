import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getIdentityMode } from "@/server/actors/identity-mode";

export default function SignInPage() {
  if (getIdentityMode() === "demo") redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center bg-[#050609] px-4 py-12 sm:px-6">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
