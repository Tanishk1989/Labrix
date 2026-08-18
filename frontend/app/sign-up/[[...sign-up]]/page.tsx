import { SignUp } from "@clerk/nextjs";
import { getIdentityMode } from "@/server/actors/identity-mode";
import { AuthVisualSide } from "@/features/auth/auth-visual-side";
import { LandingAuthCard } from "@/features/auth/landing-auth-card";

export default function SignUpPage() {
  const mode = getIdentityMode();

  return (
    <main className="min-h-screen bg-[#070911] text-white flex items-center justify-center p-6 sm:p-10 lg:p-14 selection:bg-cyan-400 selection:text-black">
      <div className="w-full max-w-[1500px] mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Side: Brand Value Props & Floating Visual Cards */}
        <div className="lg:col-span-7">
          <AuthVisualSide />
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
          {mode === "clerk" ? (
            <SignUp
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
                },
              }}
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/dashboard"
            />
          ) : (
            <LandingAuthCard />
          )}
        </div>
      </div>
    </main>
  );
}
