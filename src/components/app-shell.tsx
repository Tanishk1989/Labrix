"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Code2, ChevronRight, LayoutGrid, Menu, X } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import type { DemoRole } from "@/domain/tasks/models";

const DemoRoleContext = createContext<DemoRole>("teacher");
const demoRoleStorageKey = "labrix:demo-role";

export function getStoredDemoRole(): DemoRole {
  if (typeof window === "undefined") return "teacher";
  return window.sessionStorage.getItem(demoRoleStorageKey) === "student"
    ? "student"
    : "teacher";
}

export function useDemoRole() {
  return useContext(DemoRoleContext);
}

export function DemoRoleControl({
  role,
  setRole,
}: {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
}) {
  return (
    <section
      aria-label="Demo preview controls"
      className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
          Demo
        </span>
        <details className="relative text-xs text-slate-500">
          <summary className="flex cursor-help list-none items-center gap-0.5 hover:text-slate-700">
            <ChevronRight size={12} aria-hidden="true" /> About
          </summary>
          <p className="absolute bottom-6 right-0 z-10 w-52 rounded-lg border border-slate-200 bg-white p-2 text-xs leading-5 text-slate-600 shadow-lg">
            Prototype-only role preview. This is not sign-in.
          </p>
        </details>
      </div>
      <label className="mt-2 block text-xs font-medium text-slate-600">
        Preview role
        <select
          aria-label="Demo role"
          className="mt-1 min-h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          value={role}
          onChange={(event) => {
            const nextRole = event.target.value as DemoRole;
            window.sessionStorage.setItem(demoRoleStorageKey, nextRole);
            setRole(nextRole);
          }}
        >
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </label>
    </section>
  );
}

function Navigation({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const classesActive = pathname === "/" || pathname.startsWith("/classes");
  return (
    <nav
      aria-label="Primary navigation"
      className={compact ? "flex gap-2" : "space-y-1"}
    >
      <Link
        href="/classes"
        className={`nav-item ${classesActive ? "nav-item-active" : ""}`}
      >
        <LayoutGrid size={18} aria-hidden="true" /> <span>My Classes</span>
      </Link>
    </nav>
  );
}

export function AppShell({
  role,
  setRole,
  children,
}: {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <DemoRoleContext.Provider value={role}>
      <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:flex">
        <Link
          href="/classes"
          className="flex items-center gap-2 px-2 py-2 text-lg font-semibold tracking-tight text-slate-950"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <Code2 size={18} aria-hidden="true" />
          </span>
          Labrix
        </Link>
        <p className="mt-1 px-2 text-xs text-[var(--text-muted)]">
          Programming practicals
        </p>
        <div className="mt-8 border-t border-transparent pt-0">
          <Navigation />
        </div>
        <div className="mt-auto">
          <DemoRoleControl role={role} setRole={setRole} />
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            className="icon-button top-menu lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="grid size-7 place-items-center rounded-full bg-slate-200 text-xs">
              TM
            </span>
            <span className="hidden sm:block">Tanis M.</span>
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1280px] px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-[min(85vw,320px)] flex-col bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link
                href="/classes"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
                  <Code2 size={18} />
                </span>
                Labrix
              </Link>
              <button
                className="icon-button"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-8">
              <Navigation />
            </div>
            <div className="mt-auto">
              <DemoRoleControl role={role} setRole={setRole} />
            </div>
          </aside>
        </div>
      )}
      </div>
    </DemoRoleContext.Provider>
  );
}

export function DemoShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<DemoRole>("teacher");
  useEffect(() => {
    const timer = window.setTimeout(() => setRole(getStoredDemoRole()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <AppShell role={role} setRole={setRole}>
      {children}
    </AppShell>
  );
}
