"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Beaker,
  BookOpen,
  CheckSquare,
  Code2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  TrendingUp,
  X,
} from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useIdentityMode } from "@/components/identity-mode-provider";
import type { DemoRole } from "@/domain/tasks/models";

type ShellActor = {
  name: string;
  role: "TEACHER" | "STUDENT";
};

const DemoRoleContext = createContext<DemoRole>("teacher");
const demoRoleStorageKey = "labrix:demo-role";

export function getStoredDemoRole(): DemoRole {
  if (typeof window === "undefined") return "teacher";
  return window.sessionStorage.getItem(demoRoleStorageKey) === "student" ? "student" : "teacher";
}

export function useDemoRole() {
  return useContext(DemoRoleContext);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LX";
}

export function DemoRoleControl({ role, setRole }: { role: DemoRole; setRole: (role: DemoRole) => void }) {
  return (
    <label className="block border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">
      Demo preview
      <select
        aria-label="Demo role"
        className="input mt-2"
        value={role}
        onChange={(event) => {
          const nextRole = event.target.value as DemoRole;
          window.sessionStorage.setItem(demoRoleStorageKey, nextRole);
          setRole(nextRole);
        }}
      >
        <option value="teacher">Teacher view</option>
        <option value="student">Student view</option>
      </select>
    </label>
  );
}

const teacherNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/practicals", label: "Practicals", icon: Beaker },
  { href: "/submissions", label: "Submissions", icon: CheckSquare },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

const studentNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/practicals", label: "Practicals", icon: Beaker },
  { href: "/submissions", label: "Submissions", icon: CheckSquare },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

function SidebarNavigation({ role, onNavigate }: { role: DemoRole; onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/";
  const navigation = role === "teacher" ? teacherNavigation : studentNavigation;
  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navigation.map((item) => {
        const active = item.href === "/dashboard"
          ? pathname === "/" || pathname === "/dashboard"
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`nav-item ${active ? "nav-item-active" : ""}`}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  role,
  setRole,
  actor,
  children,
}: {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  actor?: ShellActor;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const identityMode = useIdentityMode();
  const effectiveRole: DemoRole = identityMode === "clerk"
    ? actor?.role === "STUDENT" ? "student" : "teacher"
    : role;
  const profileName = identityMode === "demo"
    ? effectiveRole === "teacher" ? actor?.name ?? "Demo teacher" : "Demo student"
    : actor?.name ?? (effectiveRole === "teacher" ? "Teacher" : "Student");
  const profileLabel = effectiveRole === "teacher" ? "Teacher" : "Student";
  const avatar = useMemo(() => initials(profileName), [profileName]);

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
        <Link href={effectiveRole === "teacher" ? "/dashboard" : "/classes"} className="flex items-center gap-2.5 font-semibold text-white">
          <span className="grid size-8 place-items-center rounded-md bg-white text-[#0a0b0e]">
            <Code2 size={17} aria-hidden="true" />
          </span>
          <span className="tracking-tight">Labrix</span>
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between p-3">
        <div>
          <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Workspace</p>
          <SidebarNavigation role={effectiveRole} onNavigate={() => setDrawerOpen(false)} />
        </div>
        <div className="space-y-3">
          {identityMode === "demo" ? <DemoRoleControl role={role} setRole={setRole} /> : null}
          <div className="flex items-center gap-3 border-t border-[var(--border)] px-2 pt-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-elevated)] text-[11px] font-semibold text-white">{avatar}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{profileName}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{profileLabel}</p>
            </div>
            {identityMode === "clerk" ? <UserButton /> : null}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <DemoRoleContext.Provider value={role}>
      <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] lg:flex">
          {sidebarContent}
        </aside>
        <div className="lg:pl-[var(--sidebar-width)]">
          <header className="sticky top-0 z-20 flex h-[var(--topbar-height)] items-center justify-between border-b border-[var(--border)] bg-[rgba(10,11,14,0.94)] px-4 backdrop-blur sm:px-6">
            <button type="button" aria-label="Open navigation" className="icon-button mobile-only" onClick={() => setDrawerOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="hidden text-xs text-[var(--text-muted)] sm:block">
              {profileLabel} workspace
            </div>
            <div className="ml-auto flex items-center gap-2 lg:hidden">
              {identityMode === "clerk" ? <UserButton /> : <span className="grid size-8 place-items-center rounded-full bg-[var(--surface-elevated)] text-[11px] font-semibold">{avatar}</span>}
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-7">{children}</main>
        </div>
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button aria-label="Close navigation" className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
            <aside className="relative flex h-full w-[min(86vw,280px)] flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)]">
              {sidebarContent}
              <button type="button" className="icon-button absolute right-3 top-3" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}><X size={17} /></button>
            </aside>
          </div>
        ) : null}
      </div>
    </DemoRoleContext.Provider>
  );
}

export function DemoShell({ children, actor }: { children: React.ReactNode; actor?: ShellActor }) {
  const [role, setRole] = useState<DemoRole>(actor?.role === "STUDENT" ? "student" : "teacher");
  useEffect(() => {
    const timer = window.setTimeout(() => setRole(getStoredDemoRole()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <AppShell role={role} setRole={setRole} actor={actor}>{children}</AppShell>;
}
