"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  BookOpen,
  User,
  Sparkles,
  Zap,
} from "lucide-react";
import { TraceMark } from "@/components/trace-logo";

export function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [view, setView] = useState<"choose-role" | "role-auth" | "custom-profile">("choose-role");
  const [selectedRole, setSelectedRole] = useState<"teacher" | "student">("teacher");
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset view when opened
  useEffect(() => {
    if (isOpen) {
      setView("choose-role");
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

  function handleRoleCardClick(role: "teacher" | "student") {
    setSelectedRole(role);
    setView("role-auth");
  }

  function handleCompleteAuth(provider: "google" | "github" | "direct", customDisplayName?: string, customUserEmail?: string) {
    setLoadingType(provider);
    const roleTitle = selectedRole === "teacher" ? "Teacher" : "Student";
    const displayName = customDisplayName || (provider === "google" ? `${roleTitle} (Google)` : provider === "github" ? `${roleTitle} (GitHub)` : roleTitle);
    const displayEmail = customUserEmail || (provider === "google" ? `${selectedRole}@google.com` : provider === "github" ? `${selectedRole}@github.com` : `${selectedRole}@university.edu`);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("trace:user-name", displayName);
      window.sessionStorage.setItem("trace:demo-role", selectedRole);
      window.sessionStorage.setItem("trace:user-email", displayEmail);
      window.sessionStorage.setItem("trace:auth-provider", provider);
    }

    setSuccessMsg(`Signed in as ${roleTitle} (${displayName})!`);
    setTimeout(() => {
      setLoadingType(null);
      setSuccessMsg(null);
      onClose();
      window.location.reload();
    }, 500);
  }

  function handleCustomProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalName = customName.trim() || (selectedRole === "teacher" ? "Teacher" : "Student");
    const finalEmail = customEmail.trim() || `${finalName.toLowerCase().replace(/\s+/g, ".")}@university.edu`;
    handleCompleteAuth("direct", finalName, finalEmail);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.14] bg-[#0c0e16]/95 p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.05)] backdrop-blur-2xl animate-in zoom-in-95 duration-150 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4.5 top-4.5 grid size-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={17} />
        </button>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
            <CheckCircle2 size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: CHOOSE ROLE (Teacher vs Student) */}
        {view === "choose-role" && (
          <div className="animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-inner">
                <TraceMark size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
                  Sign In to TRACE
                </h2>
                <p className="text-xs text-white/50">Select your role to continue</p>
              </div>
            </div>

            {/* Two Primary Options */}
            <div className="space-y-3">
              {/* Option 1: Teacher Card */}
              <button
                type="button"
                onClick={() => handleRoleCardClick("teacher")}
                className="group relative w-full flex items-start gap-3.5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent p-4 text-left shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-950/60 hover:shadow-[0_0_25px_rgba(99,102,241,0.25)] active:scale-[0.99] cursor-pointer"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <GraduationCap size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                      Teacher / Instructor
                    </span>
                    <ArrowRight size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Create classrooms, author practicals, review student code &amp; grade viva defense.
                  </p>
                </div>
              </button>

              {/* Option 2: Student Card */}
              <button
                type="button"
                onClick={() => handleRoleCardClick("student")}
                className="group relative w-full flex items-start gap-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-transparent p-4 text-left shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-950/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:scale-[0.99] cursor-pointer"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                      Student
                    </span>
                    <ArrowRight size={14} className="text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Browse assigned practicals, code in Monaco IDE, run tests &amp; submit solutions.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SOCIAL & DIRECT AUTH FOR CHOSEN ROLE */}
        {view === "role-auth" && (
          <div className="animate-in fade-in zoom-in-95 duration-150">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setView("choose-role")}
              className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Back to role choices</span>
            </button>

            {/* Role Header Badge */}
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  Sign in as {selectedRole === "teacher" ? "Teacher" : "Student"}
                </h3>
                <p className="text-xs text-white/50">Continue with your account</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${
                  selectedRole === "teacher"
                    ? "border border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                    : "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {selectedRole === "teacher" ? "Teacher Workspace" : "Student Workspace"}
              </span>
            </div>

            {/* Google & GitHub Buttons */}
            <div className="space-y-2.5">
              {/* Continue with Google */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => handleCompleteAuth("google")}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loadingType === "google" ? (
                  <Loader2 size={16} className="animate-spin text-slate-900" />
                ) : (
                  <>
                    <svg className="size-4.5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                      <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Continue with GitHub */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => handleCompleteAuth("github")}
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

              {/* Instant Direct Entry */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => handleCompleteAuth("direct")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
              >
                <Zap size={14} className="text-amber-400" />
                <span>Instant Demo Access as {selectedRole === "teacher" ? "Teacher" : "Student"}</span>
              </button>
            </div>

            {/* Custom Name / Profile Link */}
            <div className="mt-4 border-t border-white/[0.08] pt-3 text-center">
              <button
                type="button"
                onClick={() => setView("custom-profile")}
                className="inline-flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <User size={12} />
                <span>Or customize your display name &amp; email &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CUSTOM USER PROFILE INPUT */}
        {view === "custom-profile" && (
          <div className="animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setView("role-auth")}
              className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Back</span>
            </button>

            <div className="mb-5">
              <h3 className="text-base font-bold text-white leading-tight">Personalize Your {selectedRole === "teacher" ? "Teacher" : "Student"} Profile</h3>
              <p className="text-xs text-white/50">Enter your name to personalize your presentation</p>
            </div>

            <form onSubmit={handleCustomProfileSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={selectedRole === "teacher" ? "e.g. Professor Sharma" : "e.g. Alex Chen"}
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

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition-all hover:bg-slate-100 active:scale-[0.99] cursor-pointer"
              >
                <span>Enter as {selectedRole === "teacher" ? "Teacher" : "Student"}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
