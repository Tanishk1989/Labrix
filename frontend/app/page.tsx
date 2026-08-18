import { AuthVisualSide } from "@/features/auth/auth-visual-side";
import { LandingAuthCard } from "@/features/auth/landing-auth-card";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-[#070911] text-white flex items-center justify-center p-6 sm:p-10 lg:p-14 xl:p-20 selection:bg-lime-400 selection:text-black">
      <div className="w-full max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
        {/* Left Column: Hero Value Props & 3 Floating Visual Cards */}
        <div className="lg:col-span-7 xl:col-span-7">
          <AuthVisualSide />
        </div>

        {/* Right Column: Exact Reference Authentication Card */}
        <div className="lg:col-span-5 xl:col-span-5 flex items-center justify-center lg:justify-end">
          <LandingAuthCard />
        </div>
      </div>
    </main>
  );
}
