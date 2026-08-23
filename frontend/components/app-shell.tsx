"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Beaker, BookOpen, CheckSquare, GraduationCap, LayoutDashboard, Menu, TrendingUp, X, type LucideIcon } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { useIdentityMode } from "@/components/identity-mode-provider";
import { ThemeSelector } from "@/components/theme-selector";
import { CommandPalette } from "@/components/command-palette";
import { TraceMark } from "@/components/trace-logo";
import { AccountDropdown } from "@/components/account-dropdown";
import type { DemoRole } from "@/domain/tasks/models";

type ShellActor = { name: string; role: "TEACHER" | "STUDENT" };
type NavigationItem = { href: string; label: string; mobileLabel?: string; icon: LucideIcon };

const DemoRoleContext = createContext<DemoRole>("teacher");
const demoRoleStorageKey = "trace:demo-role";
const legacyDemoRoleStorageKey = "labrix:demo-role";
const isLocalRealExecutionDemo =
  process.env.NEXT_PUBLIC_LABRIX_DEMO_RUNTIME === "local-real";

export function getStoredDemoRole(): DemoRole {
  if (typeof window === "undefined") return "teacher";
  const stored =
    window.sessionStorage.getItem(demoRoleStorageKey) ??
    window.sessionStorage.getItem(legacyDemoRoleStorageKey);
  return stored === "student" ? "student" : "teacher";
}

export function useDemoRole() { return useContext(DemoRoleContext); }

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "TR";
}

const teacherNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/practicals", label: "Practicals", icon: Beaker },
  { href: "/submissions", label: "Reviews", icon: CheckSquare },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

const studentNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/practicals", label: "Practicals", icon: Beaker },
  { href: "/submissions", label: "Submissions", icon: CheckSquare },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

function isActivePath(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/" || pathname === "/dashboard" : pathname.startsWith(href);
}

function supportsDemoRolePreview(pathname: string) {
  if (["/", "/dashboard", "/classes", "/practicals", "/submissions", "/progress"].includes(pathname)) return true;
  return /^\/classes\/[^/]+\/?$/.test(pathname);
}

export function DemoRoleControl({ role, setRole }: { role: DemoRole; setRole: (role: DemoRole) => void }) {
  return (
    <div className="inline-flex items-center shrink-0">
      <select
        aria-label="Preview as"
        className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all hover:border-white/[0.24] hover:bg-white/[0.08] hover:text-white cursor-pointer outline-none"
        value={role}
        onChange={(event) => {
          const nextRole = event.target.value as DemoRole;
          window.sessionStorage.setItem(demoRoleStorageKey, nextRole);
          setRole(nextRole);
        }}
      >
        <option value="teacher" className="bg-[#121420] text-white">Preview: Teacher</option>
        <option value="student" className="bg-[#121420] text-white">Preview: Student</option>
      </select>
    </div>
  );
}

function Wordmark({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="inline-flex items-center gap-2.5 shrink-0 group focus:outline-none"
      aria-label="TRACE home"
    >
      <div className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] shadow-sm transition-all group-hover:scale-105 group-hover:border-white/25">
        <TraceMark size={18} />
      </div>
      <span className="text-sm font-bold tracking-tight text-white">
        TRACE<span className="text-white/40 font-mono text-[11px] font-normal ml-1">OS</span>
      </span>
    </Link>
  );
}

function DesktopNavigation({ role }: { role: DemoRole }) {
  const pathname = usePathname() ?? "/";
  const navigation = role === "teacher" ? teacherNavigation : studentNavigation;
  return (
    <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
      {navigation.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
              active
                ? "bg-white/[0.10] text-white font-semibold shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavigation({ role, onNavigate }: { role: DemoRole; onNavigate: () => void }) {
  const pathname = usePathname() ?? "/";
  const navigation = role === "teacher" ? teacherNavigation : studentNavigation;
  return (
    <nav aria-label="Primary navigation" className="editorial-mobile-nav">
      {navigation.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`editorial-mobile-link ${active ? "editorial-mobile-link-active" : ""}`}>
            <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
            <span>{item.mobileLabel ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DemoRuntimeBadge() {
  if (!isLocalRealExecutionDemo) return null;
  return (
    <span
      className="hidden 2xl:inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 whitespace-nowrap shrink-0"
      aria-label="Local demo with real Java and C++ Docker runners; not a production execution service"
      title="Java and C++ runs use the supervised local Docker workers. This is not a production execution service."
    >
      Local demo · Real runners
    </span>
  );
}

export function AppShell({ role, setRole, actor, children }: { role: DemoRole; setRole: (role: DemoRole) => void; actor?: ShellActor; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customUser, setCustomUser] = useState<string | null>(null);
  const [navigationPending, setNavigationPending] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const pathname = usePathname() ?? "/";
  const isCodingWorkspace = pathname.startsWith("/tasks/");
  const identityMode = useIdentityMode();
  const rolePreviewAvailable = supportsDemoRolePreview(pathname);
  const actorRole: DemoRole = actor?.role === "STUDENT" ? "student" : "teacher";
  const effectiveRole: DemoRole = identityMode === "demo" && rolePreviewAvailable
    ? role
    : actorRole;
  const profileName = customUser ?? (actor?.name ?? (effectiveRole === "teacher" ? "Teacher" : "Student"));
  const profileLabel = effectiveRole === "teacher" ? "Teacher" : "Student";
  const avatar = useMemo(() => initials(profileName), [profileName]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCustomUser(window.sessionStorage.getItem("trace:user-name"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setNavigationPending(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!navigationPending) return;
    const timer = window.setTimeout(() => setNavigationPending(false), 15_000);
    return () => window.clearTimeout(timer);
  }, [navigationPending]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button, select")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a, button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [drawerOpen]);

  function showPendingForInternalLink(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
    setNavigationPending(true);
  }

  function showPendingForGetForm(event: FormEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLFormElement && event.target.method.toLowerCase() === "get") setNavigationPending(true);
  }

  return (
    <DemoRoleContext.Provider value={role}>
      <div className="editorial-shell" onClickCapture={showPendingForInternalLink} onSubmitCapture={showPendingForGetForm}>
        {navigationPending ? <div className="shell-navigation-progress" role="status" aria-label="Opening page"><span /></div> : null}
        <header className="editorial-app-header">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-10">
            {/* Unified Left Navigation Cluster */}
            <div className="flex items-center gap-5">
              <Wordmark />
              
              <div className="hidden lg:flex items-center gap-4">
                <div className="h-4 w-px bg-white/10" />
                <DesktopNavigation role={effectiveRole} />
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                  <CommandPalette />
                  <ThemeSelector />
                  <DemoRuntimeBadge />
                  {identityMode === "demo" && rolePreviewAvailable
                    ? <DemoRoleControl role={role} setRole={setRole} />
                    : null}
                  <AccountDropdown
                    name={profileName}
                    roleLabel={profileLabel}
                    avatar={avatar}
                    currentRole={effectiveRole}
                    setRole={setRole}
                    identityMode={identityMode}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Only Hamburger */}
            <button
              type="button"
              aria-label="Open navigation"
              className="icon-button editorial-menu-button lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </header>
        <main className={`editorial-page-canvas ${isCodingWorkspace ? "editorial-page-canvas-workspace" : ""}`}>{children}</main>
        {drawerOpen ? (
          <div className="shell-drawer-layer">
            <button aria-label="Close navigation" className="shell-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
            <aside ref={drawerRef} className="editorial-mobile-drawer" aria-label="Mobile navigation">
              <div className="editorial-drawer-header"><Wordmark onNavigate={() => setDrawerOpen(false)} /><button type="button" className="icon-button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}><X size={17} strokeWidth={1.75} aria-hidden="true" /></button></div>
              <MobileNavigation role={effectiveRole} onNavigate={() => setDrawerOpen(false)} />
              <div className="editorial-drawer-footer">
                <ThemeSelector />
                <DemoRuntimeBadge />
                {identityMode === "demo" && rolePreviewAvailable
                  ? <DemoRoleControl role={role} setRole={setRole} />
                  : null}
                <AccountDropdown
                  name={profileName}
                  roleLabel={profileLabel}
                  avatar={avatar}
                  currentRole={effectiveRole}
                  setRole={setRole}
                  identityMode={identityMode}
                />
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </DemoRoleContext.Provider>
  );
}

export function DemoShell({ children, actor }: { children: ReactNode; actor?: ShellActor }) {
  const identityMode = useIdentityMode();
  const [role, setRole] = useState<DemoRole>(actor?.role === "STUDENT" ? "student" : "teacher");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const actorRole = actor?.role === "STUDENT" ? "student" : "teacher";
      setRole(identityMode === "demo" ? getStoredDemoRole() : actorRole);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [actor?.role, identityMode]);
  return <AppShell role={role} setRole={setRole} actor={actor}>{children}</AppShell>;
}
