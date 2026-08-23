import { AuthVisualSide } from "@/features/auth/auth-visual-side";
import { RoleLoginCard } from "@/features/auth/role-login-card";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#050609] text-white flex items-center justify-center p-5 sm:p-8 lg:p-12 selection:bg-indigo-500/30 selection:text-white">
      <div className="w-full max-w-[1480px] mx-auto grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side (Desktop) / Bottom Side (Mobile): Brand Visual Side */}
        <div className="order-2 lg:order-1 lg:col-span-7">
          <AuthVisualSide />
        </div>

        {/* Right Side (Desktop) / Top Side (Mobile): Workspace Selection Form */}
        <div className="order-1 lg:order-2 lg:col-span-5 flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[460px]">
            <RoleLoginCard />
          </div>
        </div>
      </div>
    </main>
  );
}
