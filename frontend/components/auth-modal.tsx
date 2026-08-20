"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, ChevronLeft, User } from "lucide-react";
import { TraceMark } from "@/components/trace-logo";

export function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [view, setView] = useState<"main" | "google-chooser" | "custom-user">("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customRole, setCustomRole] = useState<"student" | "teacher">("teacher");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset view when opened
  useEffect(() => {
    if (isOpen) {
      setView("main");
      setSuccessMsg(null);
      setLoadingType(null);
      setCustomName("");
      setCustomEmail("");
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSelectGoogleAccount(accountName: string, role: "student" | "teacher", userEmail?: string) {
    setLoadingType(accountName);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("trace:user-name", accountName);
      window.sessionStorage.setItem("trace:demo-role", role);
      window.sessionStorage.setItem("trace:auth-provider", "google");
      if (userEmail) {
        window.sessionStorage.setItem("trace:user-email", userEmail);
      }
    }
    setSuccessMsg(`Signed in as ${accountName}!`);
    setTimeout(() => {
      setLoadingType(null);
      setSuccessMsg(null);
      onClose();
      window.location.reload();
    }, 600);
  }

  function handleCustomUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalName = customName.trim() || (customRole === "teacher" ? "Teacher" : "Student");
    const finalEmail = customEmail.trim() || `${finalName.toLowerCase().replace(/\s+/g, ".")}@university.edu`;
    handleSelectGoogleAccount(finalName, customRole, finalEmail);
  }

  function handleGitHubLogin() {
    setLoadingType("github");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("trace:user-name", "Developer");
      window.sessionStorage.setItem("trace:demo-role", "student");
      window.sessionStorage.setItem("trace:auth-provider", "github");
    }
    setSuccessMsg("Signed in with GitHub!");
    setTimeout(() => {
      setLoadingType(null);
      setSuccessMsg(null);
      onClose();
      window.location.reload();
    }, 600);
  }

  function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoadingType("email");
    
    setTimeout(() => {
      if (typeof window !== "undefined") {
        const rawName = email.split("@")[0] || "User";
        const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        const isTeacher = email.toLowerCase().includes("teacher") || email.toLowerCase().includes("prof");
        window.sessionStorage.setItem("trace:user-name", formattedName);
        window.sessionStorage.setItem("trace:demo-role", isTeacher ? "teacher" : "student");
        window.sessionStorage.setItem("trace:user-email", email);
      }
      setSuccessMsg("Logged in successfully!");
      setTimeout(() => {
        setLoadingType(null);
        setSuccessMsg(null);
        onClose();
        window.location.reload();
      }, 500);
    }, 600);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.12] bg-[#0c0e16]/95 p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.05)] backdrop-blur-2xl animate-in zoom-in-95 duration-150 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4.5 top-4.5 grid size-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={17} />
        </button>

        {/* VIEW 1: GOOGLE ACCOUNT CHOOSER */}
        {view === "google-chooser" ? (
          <div className="animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setView("main")}
              className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft size={15} />
              <span>Back</span>
            </button>

            {/* Google Header */}
            <div className="flex items-center gap-3 mb-6">
              <svg className="size-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Choose an account</h3>
                <p className="text-xs text-white/50">to continue to TRACE</p>
              </div>
            </div>

            {/* Accounts List */}
            <div className="space-y-2.5">
              {/* Account 1: Teacher Account */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => handleSelectGoogleAccount("Teacher", "teacher", "teacher@university.edu")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">
                    T
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">Teacher / Instructor</p>
                    <p className="text-[11px] text-white/50 font-mono">teacher@university.edu</p>
                  </div>
                </div>
                {loadingType === "Teacher" && <Loader2 size={16} className="animate-spin text-cyan-400" />}
              </button>

              {/* Account 2: Student Account */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => handleSelectGoogleAccount("Student", "student", "student@university.edu")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm">
                    S
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">Student</p>
                    <p className="text-[11px] text-white/50 font-mono">student@university.edu</p>
                  </div>
                </div>
                {loadingType === "Student" && <Loader2 size={16} className="animate-spin text-cyan-400" />}
              </button>

              {/* Account 3: Custom Name / Profile */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => setView("custom-user")}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-white/15 bg-transparent hover:bg-white/[0.04] transition-all text-left cursor-pointer"
              >
                <div className="grid size-9 place-items-center rounded-full border border-white/15 text-white/60">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/80">Enter your name &amp; role</p>
                  <p className="text-[11px] text-white/40">Try out with your custom profile</p>
                </div>
              </button>
            </div>
          </div>
        ) : view === "custom-user" ? (
          /* VIEW 3: CUSTOM USER PROFILE INPUT */
          <div className="animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setView("google-chooser")}
              className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft size={15} />
              <span>Back</span>
            </button>

            <div className="mb-5">
              <h3 className="text-base font-bold text-white leading-tight">Create your profile</h3>
              <p className="text-xs text-white/50">Enter your details to test TRACE</p>
            </div>

            <form onSubmit={handleCustomUserSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Professor Smith"
                  className="w-full rounded-xl border border-white/10 bg-[#161a24] px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full rounded-xl border border-white/10 bg-[#161a24] px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomRole("teacher")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      customRole === "teacher"
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-[#161a24] text-white/60 hover:text-white"
                    }`}
                  >
                    Teacher / Instructor
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomRole("student")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      customRole === "student"
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-[#161a24] text-white/60 hover:text-white"
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] cursor-pointer"
              >
                <span>Continue into Workspace</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        ) : (
          /* VIEW 2: MAIN AUTH MODAL */
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <TraceMark size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
                  Sign in to TRACE
                </h2>
                <p className="text-xs text-white/50">Continue to your workspace</p>
              </div>
            </div>

            {/* Success Alert */}
            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={15} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Social Buttons */}
            <div className="space-y-2.5">
              {/* Google Account Chooser Trigger */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => setView("google-chooser")}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <svg className="size-4.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* GitHub Login */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={handleGitHubLogin}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#161a24] px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#1f2433] hover:border-white/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loadingType === "github" ? (
                  <Loader2 size={16} className="animate-spin text-white" />
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
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-[#0c0e16] px-3 font-mono text-[10px] font-bold text-white/40 uppercase tracking-widest">
                OR
              </span>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border border-white/10 bg-[#161a24] px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-[#161a24] px-3.5 py-2.5 pr-9 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingType !== null}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loadingType === "email" ? (
                  <Loader2 size={16} className="animate-spin text-slate-900" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
