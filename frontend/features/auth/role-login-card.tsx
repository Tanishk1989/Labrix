"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronLeft,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  User,
} from "lucide-react";
import type { DemoRole } from "@/domain/tasks/models";

const demoRoleStorageKey = "trace:demo-role";
const legacyDemoRoleStorageKey = "labrix:demo-role";

export function RoleLoginCard() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customName, setCustomName] = useState("");
  const [selectedRole, setSelectedRole] = useState<DemoRole>("teacher");

  function handleSelectWorkspace(role: DemoRole) {
    setLoadingRole(role);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(demoRoleStorageKey, role);
        window.sessionStorage.setItem(legacyDemoRoleStorageKey, role);
      }
    } catch {
      // Ignore storage errors
    }
    router.push("/dashboard");
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoadingRole(selectedRole);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(demoRoleStorageKey, selectedRole);
        window.sessionStorage.setItem(legacyDemoRoleStorageKey, selectedRole);
        if (customName.trim()) {
          window.sessionStorage.setItem("trace:custom-user-name", customName.trim());
          window.sessionStorage.setItem("labrix:custom-user-name", customName.trim());
        }
      }
    } catch {
      // Ignore storage errors
    }
    router.push("/dashboard");
  }

  if (isCustomizing) {
    return (
      <div className="w-full rounded-3xl border border-white/[0.09] bg-[#0b0e17]/95 p-7 sm:p-9 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-white animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => setIsCustomizing(false)}
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-5 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Back to workspace options</span>
        </button>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Personalize Your Profile
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white/70">
            Set your display name and role for testing.
          </p>
        </div>

        <form onSubmit={handleCustomSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="custom-name-input" className="block text-xs font-semibold text-white/80 mb-1.5">
              Display Name
            </label>
            <input
              id="custom-name-input"
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={selectedRole === "teacher" ? "e.g. Professor Sharma" : "e.g. Alex Chen"}
              className="w-full rounded-2xl border border-white/10 bg-[#121624] px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">
              Workspace Role
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedRole("teacher")}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === "teacher"
                    ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-200 shadow-md shadow-indigo-500/10"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <GraduationCap size={16} />
                <span>Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("student")}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === "student"
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-md shadow-cyan-500/10"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <TerminalSquare size={16} />
                <span>Student</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingRole !== null}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {loadingRole ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <>
                <span>Enter as {selectedRole === "teacher" ? "Teacher" : "Student"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-white/[0.09] bg-[#0b0e17]/95 p-7 sm:p-9 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-white">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 mb-1">
          <Sparkles size={13} />
          <span>Choose Workspace</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Sign in to TRACE
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-white/70">
          Select which workspace you want to enter:
        </p>
      </div>

      <div className="mt-6 space-y-3.5">
        {/* OPTION 1: TEACHER WORKSPACE */}
        <button
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleSelectWorkspace("teacher")}
          className="group relative flex w-full flex-col text-left rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/[0.12] to-transparent p-4 sm:p-5 transition-all hover:border-indigo-400 hover:bg-indigo-500/[0.18] active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl border border-indigo-400/30 bg-indigo-500/20 text-indigo-300 shadow-md group-hover:scale-105 group-hover:border-indigo-400 transition-transform">
                <GraduationCap size={22} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-md border border-indigo-400/20">
                    Option 1
                  </span>
                  <p className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                    Teacher Workspace
                  </p>
                </div>
                <p className="text-xs text-white/60 mt-0.5 font-medium">
                  Instructor mode · Classrooms & grading
                </p>
              </div>
            </div>
            {loadingRole === "teacher" ? (
              <Loader2 size={18} className="animate-spin text-indigo-400 shrink-0" />
            ) : (
              <ArrowRight size={18} className="text-indigo-400 transition-transform group-hover:translate-x-1 shrink-0" />
            )}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/50 border-t border-white/[0.06] pt-2.5">
            Create practicals, manage student rosters, inspect AST diffs, and review oral defense viva questions.
          </p>
        </button>

        {/* OPTION 2: STUDENT WORKSPACE */}
        <button
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleSelectWorkspace("student")}
          className="group relative flex w-full flex-col text-left rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/[0.10] to-transparent p-4 sm:p-5 transition-all hover:border-cyan-400 hover:bg-cyan-500/[0.16] active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/20 text-cyan-300 shadow-md group-hover:scale-105 group-hover:border-cyan-400 transition-transform">
                <TerminalSquare size={22} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20">
                    Option 2
                  </span>
                  <p className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                    Student Workspace
                  </p>
                </div>
                <p className="text-xs text-white/60 mt-0.5 font-medium">
                  Learner mode · Live coding lab
                </p>
              </div>
            </div>
            {loadingRole === "student" ? (
              <Loader2 size={18} className="animate-spin text-cyan-400 shrink-0" />
            ) : (
              <ArrowRight size={18} className="text-cyan-400 transition-transform group-hover:translate-x-1 shrink-0" />
            )}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/50 border-t border-white/[0.06] pt-2.5">
            Join classrooms with a join code, write code in the live editor, execute test cases, and submit practicals.
          </p>
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50">
        <button
          type="button"
          onClick={() => setIsCustomizing(true)}
          className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
        >
          <User size={13} />
          <span>Custom display name &rarr;</span>
        </button>
        <span className="flex items-center gap-1.5 text-[11px] text-white/40">
          <ShieldCheck size={13} className="text-emerald-400" />
          Zero surveillance
        </span>
      </div>
    </div>
  );
}
