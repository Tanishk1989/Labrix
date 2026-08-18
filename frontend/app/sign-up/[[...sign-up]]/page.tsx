import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#070913] px-4 py-12">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              card: "bg-[#111424] border border-white/10 shadow-2xl rounded-2xl text-white",
              headerTitle: "text-white font-bold text-xl",
              headerSubtitle: "text-white/60 text-xs",
              socialButtonsBlockButton:
                "border border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs rounded-xl",
              socialButtonsBlockButtonText: "text-white font-semibold",
              dividerLine: "bg-white/10",
              dividerText: "text-white/40 text-xs",
              formFieldLabel: "text-white/80 text-xs font-semibold",
              formFieldInput:
                "bg-black/40 border border-white/10 text-white rounded-xl focus:border-cyan-500/50",
              formButtonPrimary:
                "bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20",
              footerActionLink: "text-cyan-400 hover:text-cyan-300 font-semibold",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-cyan-400",
            },
          }}
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </main>
  );
}
