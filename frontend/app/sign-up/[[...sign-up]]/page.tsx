import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getIdentityMode } from "@/server/actors/identity-mode";

export default function SignUpPage() {
  if (getIdentityMode() === "demo") redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12 sm:px-6">
      <SignUp />
    </main>
  );
}
