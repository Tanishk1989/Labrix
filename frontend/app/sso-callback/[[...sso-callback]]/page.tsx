import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#070911] text-white">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
