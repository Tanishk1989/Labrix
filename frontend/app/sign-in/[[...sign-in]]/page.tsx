import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthVisualSide } from "@/features/auth/auth-visual-side";

export default async function SignInPage() {
  const session = await auth();
  if (session.isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#070911] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-lime-400 selection:text-black">
      <div className="w-full max-w-7xl rounded-3xl border border-white/[0.08] bg-[#0a0d16]/90 shadow-2xl backdrop-blur-3xl overflow-hidden grid lg:grid-cols-2 items-center">
        {/* Left Side: Brand Value Props & Floating Visual Cards */}
        <AuthVisualSide />

        {/* Right Side: Modern Glassmorphism Login Card */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14 border-t lg:border-t-0 lg:border-l border-white/[0.08]">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full max-w-[440px]",
                card: "w-full rounded-3xl border border-white/10 bg-[#0f121a]/95 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl text-white",
                headerTitle: "text-2xl sm:text-3xl font-bold tracking-tight text-white",
                headerSubtitle: "text-xs sm:text-sm text-white/60",
                socialButtonsBlockButton:
                  "flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] cursor-pointer border-none",
                socialButtonsBlockButtonText: "text-slate-900 font-bold",
                dividerRow: "relative my-6 flex items-center justify-center",
                dividerLine: "w-full border-t border-white/10",
                dividerText:
                  "absolute bg-[#0f121a] px-3 font-mono text-[11px] font-bold text-white/40 uppercase tracking-widest",
                formFieldLabel: "block text-xs font-semibold text-white/70 mb-1.5",
                formFieldInput:
                  "w-full rounded-2xl border border-white/10 bg-[#161a24] px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/50 transition-all",
                formButtonPrimary:
                  "mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#a3e635] px-4 py-3.5 text-xs sm:text-sm font-bold text-black shadow-[0_0_25px_rgba(163,230,53,0.4)] transition-all hover:bg-[#bef264] hover:shadow-[0_0_35px_rgba(163,230,53,0.6)] active:scale-[0.99] cursor-pointer border-none",
                footerActionLink: "font-bold text-lime-400 hover:text-lime-300 transition-colors ml-1",
                footerActionText: "text-xs text-white/60",
                identityPreviewText: "text-white text-xs",
                identityPreviewEditButton: "text-lime-400 text-xs font-bold",
                formFieldAction:
                  "text-[11px] font-medium text-white/50 hover:text-lime-300 transition-colors",
              },
            }}
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </main>
  );
}
