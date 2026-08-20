"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export function LandingAuthCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  function handleGoogleLogin() {
    setSocialLoading("google");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("trace:user-name", "Google User");
      window.sessionStorage.setItem("trace:demo-role", "student");
      window.sessionStorage.setItem("trace:user-email", "user@google.com");
      window.sessionStorage.setItem("trace:auth-provider", "google");
    }
    setTimeout(() => {
      router.push("/dashboard");
    }, 450);
  }

  function handleGitHubLogin() {
    setSocialLoading("github");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("trace:user-name", "Developer");
      window.sessionStorage.setItem("trace:demo-role", "student");
      window.sessionStorage.setItem("trace:user-email", "developer@github.com");
      window.sessionStorage.setItem("trace:auth-provider", "github");
    }
    setTimeout(() => {
      router.push("/dashboard");
    }, 450);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (typeof window !== "undefined") {
      const rawName = email.split("@")[0] || "User";
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const isTeacher = email.toLowerCase().includes("teacher") || email.toLowerCase().includes("prof");
      window.sessionStorage.setItem("trace:user-name", formattedName);
      window.sessionStorage.setItem("trace:demo-role", isTeacher ? "teacher" : "student");
      window.sessionStorage.setItem("trace:user-email", email || "user@university.edu");
      window.sessionStorage.setItem("trace:auth-provider", "email");
    }
    // Smooth transition to dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 450);
  }

  return (
    <div className="w-full max-w-[460px] rounded-[32px] border border-white/10 bg-[#0d1017]/95 p-8 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl transition-all">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome back
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-white/60">
          Continue your learning journey.
        </p>
      </div>

      {/* Social Logins */}
      <div className="mt-6 space-y-3">
        {/* Google Button */}
        <button
          type="button"
          disabled={socialLoading !== null || loading}
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-xs sm:text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {socialLoading === "google" ? (
            <Loader2 size={18} className="animate-spin text-slate-900" />
          ) : (
            <>
              <svg className="size-4.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* GitHub Button */}
        <button
          type="button"
          disabled={socialLoading !== null || loading}
          onClick={handleGitHubLogin}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#161a24] px-4 py-3.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#1f2433] hover:border-white/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {socialLoading === "github" ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <>
              <svg className="size-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-white/10" />
        <span className="absolute bg-[#0d1017] px-3 font-mono text-[11px] font-bold text-white/40 uppercase tracking-widest">
          OR
        </span>
      </div>

      {/* Form Credentials */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.edu"
            className="w-full rounded-2xl border border-white/10 bg-[#161a24] px-4 py-3.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-white/70">
              Password
            </label>
            <Link
              href="/sign-in"
              className="text-[11px] font-medium text-white/50 hover:text-lime-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/10 bg-[#161a24] px-4 py-3.5 pr-10 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* BRIGHT NEON LIME LOG IN BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#a3e635] px-4 py-3.5 text-xs sm:text-sm font-bold text-black shadow-[0_0_25px_rgba(163,230,53,0.4)] transition-all hover:bg-[#bef264] hover:shadow-[0_0_35px_rgba(163,230,53,0.6)] active:scale-[0.99] cursor-pointer"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-black" />
          ) : (
            <>
              <span>Log In</span>
              <ArrowRight size={16} className="text-black" />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-white/60">
        <div>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-bold text-lime-400 hover:text-lime-300 transition-colors ml-1"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
