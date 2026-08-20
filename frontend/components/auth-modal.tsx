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
} from "lucide-react";
import { TraceMark } from "@/components/trace-logo";

export function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [view, setView] = useState<"choose-role" | "custom-profile">("choose-role");
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customRole, setCustomRole] = useState<"student" | "teacher">("teacher");
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

  function handleSelectRole(role: "student" | "teacher", customDisplayName?: string, customUserEmail?: string) {
    const displayName = customDisplayName || (role === "teacher" ? "Teacher" : "Student");
    const displayEmail = customUserEmail || `${role}@university.edu`;
    setLoadingType(role);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("trace:user-name", displayName);
      window.sessionStorage.setItem("trace:demo-role", role);
      window.sessionStorage.setItem("trace:user-email", displayEmail);
      window.sessionStorage.setItem("trace:auth-provider", "direct");
    }

    setSuccessMsg(`Signed in as ${role === "teacher" ? "Teacher" : "Student"} (${displayName})!`);
    setTimeout(() => {
      setLoadingType(null);
      setSuccessMsg(null);
      onClose();
      window.location.reload();
    }, 500);
  }

  function handleCustomProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalName = customName.trim() || (customRole === "teacher" ? "Teacher" : "Student");
    const finalEmail = customEmail.trim() || `${finalName.toLowerCase().replace(/\s+/g, ".")}@university.edu`;
    handleSelectRole(customRole, finalName, finalEmail);
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

        {view === "choose-role" ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-inner">
                <TraceMark size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
                  Sign In to TRACE
                </h2>
                <p className="text-xs text-white/50">Select your workspace role to begin</p>
              </div>
            </div>

            {/* Success Alert */}
            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={15} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Two Primary Options */}
            <div className="space-y-3">
              {/* Option 1: Continue as Teacher */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => handleSelectRole("teacher")}
                className="group relative w-full flex items-start gap-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent p-4 text-left shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-950/60 hover:shadow-[0_0_25px_rgba(99,102,241,0.25)] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  {loadingType === "teacher" ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <GraduationCap size={22} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                      Continue as Teacher / Instructor
                    </span>
                    <ArrowRight size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Create classrooms, author practicals, review student code &amp; grade viva defense.
                  </p>
                </div>
              </button>

              {/* Option 2: Continue as Student */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={() => handleSelectRole("student")}
                className="group relative w-full flex items-start gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-transparent p-4 text-left shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-950/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  {loadingType === "student" ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <BookOpen size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                      Continue as Student
                    </span>
                    <ArrowRight size={14} className="text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Browse assigned practicals, code in Monaco IDE, run tests &amp; submit solutions.
                  </p>
                </div>
              </button>
            </div>

            {/* Custom Name / Profile Link */}
            <div className="mt-5 border-t border-white/[0.08] pt-4 text-center">
              <button
                type="button"
                onClick={() => setView("custom-profile")}
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <User size={13} />
                <span>Want to test with your custom name? Click here</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: CUSTOM USER PROFILE INPUT */
          <div className="animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setView("choose-role")}
              className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Back to role choices</span>
            </button>

            <div className="mb-5">
              <h3 className="text-base font-bold text-white leading-tight">Test with Custom Name</h3>
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
                  placeholder="e.g. Professor Sharma"
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
                  Choose Workspace Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomRole("teacher")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      customRole === "teacher"
                        ? "border-indigo-400 bg-indigo-500/20 text-indigo-300 shadow-sm"
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
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-sm"
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
                <span>Enter Workspace</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
