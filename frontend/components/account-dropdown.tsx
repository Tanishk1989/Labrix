"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Shield,
} from "lucide-react";
import type { DemoRole } from "@/domain/tasks/models";

interface AccountDropdownProps {
  name: string;
  roleLabel: string;
  avatar: string;
  currentRole: DemoRole;
  setRole: (role: DemoRole) => void;
  identityMode: "demo" | "clerk";
}

export function AccountDropdown({
  name,
  roleLabel,
  avatar,
  currentRole,
  setRole,
  identityMode,
}: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const displayEmail =
    identityMode === "demo" ? `${currentRole.toLowerCase()}@university.edu` : "";

  function handleLogout() {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.localStorage.clear();
      // Redirect to sign in or landing
      window.location.href = "/sign-in";
    }
  }

  function handleRoleSwitch(newRole: DemoRole) {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("trace:demo-role", newRole);
    }
    setRole(newRole);
    setIsOpen(false);
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.04] py-1.5 pl-3 pr-2.5 text-xs font-medium text-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all hover:border-white/[0.24] hover:bg-white/[0.08] hover:text-white cursor-pointer group focus:outline-none focus:ring-2 focus:ring-lime-400/40"
      >
        {/* User Info on Medium/Large Screens */}
        <div className="hidden sm:flex flex-col items-end text-right leading-none gap-0.5 mr-0.5">
          <span className="truncate max-w-[130px] text-xs font-semibold text-white group-hover:text-lime-300 transition-colors">
            {name}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-lime-400 font-bold">
            {roleLabel}
          </span>
        </div>

        {/* Avatar Bubble */}
        <span className="grid size-7 place-items-center rounded-full border border-lime-400/40 bg-gradient-to-tr from-lime-600/30 to-emerald-500/20 text-xs font-bold text-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.2)]">
          {avatar}
        </span>

        {/* Subtle Chevron */}
        <ChevronDown
          size={14}
          className={`text-white/50 transition-transform duration-200 group-hover:text-white ${
            isOpen ? "rotate-180 text-lime-400" : ""
          }`}
        />
      </button>

      {/* Floating Glassmorphism Popup Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-2xl border border-white/10 bg-[#0d1017]/95 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-black/50 divide-y divide-white/[0.08] z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Profile Section */}
          <div className="p-2.5">
            <p className="text-xs font-bold text-white truncate">{name}</p>
            {displayEmail && (
              <p className="text-[11px] font-mono text-white/50 truncate mt-0.5">
                {displayEmail}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-md border border-lime-500/30 bg-lime-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-lime-300 uppercase tracking-wider">
                <Shield size={10} />
                {roleLabel} Active
              </span>
              <span className="text-[10px] font-mono text-white/40">
                {identityMode === "demo" ? "Demo Mode" : "Verified"}
              </span>
            </div>
          </div>

          {/* Role Switching / Perspective View */}
          <div className="py-1.5">
            <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">
              Perspective View
            </div>
            <button
              type="button"
              onClick={() => handleRoleSwitch("teacher")}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer ${
                currentRole === "teacher"
                  ? "bg-lime-400/10 font-bold text-lime-300"
                  : "text-white/70 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap size={15} className="text-lime-400" />
                <span>Teacher Workspace</span>
              </div>
              {currentRole === "teacher" && <Check size={14} className="text-lime-400" />}
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch("student")}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer ${
                currentRole === "student"
                  ? "bg-lime-400/10 font-bold text-lime-300"
                  : "text-white/70 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-lime-400" />
                <span>Student Workspace</span>
              </div>
              {currentRole === "student" && <Check size={14} className="text-lime-400" />}
            </button>
          </div>

          {/* Quick Links */}
          <div className="py-1.5">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <LayoutDashboard size={14} />
              <span>Lab Overview</span>
            </Link>

            <Link
              href="/classes"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <GraduationCap size={14} />
              <span>My Classrooms</span>
            </Link>
          </div>

          {/* Log Out Action */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
