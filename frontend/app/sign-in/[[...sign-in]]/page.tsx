import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";
import { AuthVisualSide } from "@/features/auth/auth-visual-side";

function AuthFormSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading authentication form"
      className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#0f121a]/95 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl text-white animate-pulse"
    >
      <div className="h-8 w-44 rounded-lg bg-white/10 mb-3" />
      <div className="h-4 w-60 rounded-md bg-white/5 mb-8" />
      <div className="h-12 w-full rounded-2xl bg-white/10 mb-6" />
      <div className="h-4 w-full rounded-md bg-white/5 mb-6" />
      <div className="space-y-4">
        <div className="h-11 w-full rounded-2xl bg-white/10" />
        <div className="h-11 w-full rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#070911] text-white flex items-center justify-center p-6 sm:p-10 lg:p-14 selection:bg-cyan-400 selection:text-black">
      <div className="w-full max-w-[1500px] mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Side (Desktop) / Bottom Side (Mobile): Brand Visual Side */}
        <div className="order-2 lg:order-1 lg:col-span-7">
          <AuthVisualSide />
        </div>

        {/* Right Side (Desktop) / Top Side (Mobile): Auth Form */}
        <div className="order-1 lg:order-2 lg:col-span-5 flex items-center justify-center lg:justify-end">
          <ClerkLoading>
            <AuthFormSkeleton />
          </ClerkLoading>
          <ClerkLoaded>
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
                    "w-full rounded-2xl border border-white/10 bg-[#161a24] px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all",
                  formButtonPrimary:
                    "mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-xs sm:text-sm font-bold text-black shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] cursor-pointer border-none",
                  footerActionLink: "font-bold text-cyan-400 hover:text-cyan-300 transition-colors ml-1",
                  footerActionText: "text-xs text-white/60",
                  identityPreviewText: "text-white text-xs",
                  identityPreviewEditButton: "text-cyan-400 text-xs font-bold",
                  formFieldAction:
                    "text-[11px] font-medium text-white/50 hover:text-cyan-300 transition-colors",
                },
              }}
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/dashboard"
            />
          </ClerkLoaded>
        </div>
      </div>
    </main>
  );
}
