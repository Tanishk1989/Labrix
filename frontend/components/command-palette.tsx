"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  GraduationCap,
  Beaker,
  CheckSquare,
  TrendingUp,
  Palette,
  ArrowRight,
  X,
  Code2,
  Sparkles,
  Command,
  CornerDownLeft,
  SlidersHorizontal,
} from "lucide-react";
import { useColorTheme, themePresets, type ColorTheme } from "./theme-provider";

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Practicals" | "Themes" | "Actions";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { theme, setTheme } = useColorTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setActiveTab("All");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const allItems: PaletteItem[] = useMemo(() => [
    // Navigation
    { id: "nav-dashboard", title: "Teacher Dashboard", subtitle: "Overview metrics & active submissions", category: "Navigation", icon: LayoutDashboard, shortcut: "G D", action: () => router.push("/dashboard") },
    { id: "nav-classes", title: "Classrooms & Batches", subtitle: "Manage student rosters & lab practicals", category: "Navigation", icon: GraduationCap, shortcut: "G C", action: () => router.push("/classes") },
    { id: "nav-practicals", title: "Lab Practicals Catalog", subtitle: "Browse, create, and author assignments", category: "Navigation", icon: Beaker, shortcut: "G P", action: () => router.push("/practicals") },
    { id: "nav-reviews", title: "Submissions & Viva Defense", subtitle: "Review code, test passes & oral defense", category: "Navigation", icon: CheckSquare, shortcut: "G R", action: () => router.push("/submissions") },
    { id: "nav-progress", title: "Student Progress & Analytics", subtitle: "Class performance & cognitive weakness heatmap", category: "Navigation", icon: TrendingUp, shortcut: "G S", action: () => router.push("/progress") },

    // Actions
    { id: "action-practicals", title: "Browse All Practicals", subtitle: "View and solve available lab practical problems", category: "Actions", icon: Code2, shortcut: "↵", action: () => router.push("/practicals") },
    { id: "action-classes", title: "Manage Classrooms", subtitle: "View enrollments and active laboratory batches", category: "Actions", icon: GraduationCap, shortcut: "↵", action: () => router.push("/classes") },
    { id: "action-reviews", title: "Code Reviews & Grading", subtitle: "Grade student attempts and leave rubric feedback", category: "Actions", icon: CheckSquare, shortcut: "↵", action: () => router.push("/submissions") },

    // Themes
    ...((Object.keys(themePresets) as ColorTheme[]).map((key) => {
      const preset = themePresets[key];
      return {
        id: `theme-${key}`,
        title: preset.name,
        subtitle: preset.description,
        category: "Themes" as const,
        icon: Palette,
        badge: preset.accentColor,
        shortcut: "Theme",
        action: () => setTheme(key),
      };
    })),
  ], [router, setTheme]);

  const categories = ["All", "Navigation", "Actions", "Themes"];

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeTab !== "All") {
      items = items.filter((item) => item.category === activeTab);
    }
    if (query.trim() !== "") {
      const q = query.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      );
    }
    return items;
  }, [allItems, activeTab, query]);

  // Arrow key navigation
  useEffect(() => {
    function handleNavigation(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          selected.action();
          setIsOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [isOpen, filteredItems, selectedIndex]);

  // Group items by category when showing "All"
  const groupedSections = useMemo(() => {
    if (activeTab !== "All" || query.trim() !== "") {
      return [{ category: activeTab === "All" ? "Results" : activeTab, items: filteredItems }];
    }
    const order: Array<PaletteItem["category"]> = ["Navigation", "Practicals", "Themes"];
    return order
      .map((cat) => ({
        category: cat,
        items: filteredItems.filter((i) => i.category === cat),
      }))
      .filter((section) => section.items.length > 0);
  }, [activeTab, query, filteredItems]);

  return (
    <>
      {/* Compact Search Logo Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex size-7 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
        aria-label="Open Command Search"
        title="Search (⌘K)"
      >
        <Search size={15} />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] sm:pt-[14vh] backdrop-blur-xl bg-black/75 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.14] bg-[#0c0d12]/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),0_0_30px_rgba(var(--spotlight-rgb),0.12)] backdrop-blur-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Input Row */}
            <div className="relative flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
              <div className="grid size-8 place-items-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 shadow-[0_0_12px_rgba(var(--spotlight-rgb),0.2)]">
                <Search size={16} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command, jump to a practical, or change theme..."
                className="w-full bg-transparent text-sm font-medium text-white placeholder-white/40 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded p-1 text-white/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-black/20 px-4 py-2 text-xs">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Filter:</span>
              {categories.map((cat) => {
                const isActive = activeTab === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveTab(cat);
                      setSelectedIndex(0);
                    }}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                      isActive
                        ? "bg-white/[0.12] text-white shadow-sm border border-white/20 font-semibold"
                        : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Results Container */}
            <div className="max-h-[380px] overflow-y-auto p-2 scroll-smooth">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-white/70">No results found for &ldquo;{query}&rdquo;</p>
                  <p className="mt-1 text-xs text-white/40">Try searching for a practical name or navigation page.</p>
                </div>
              ) : (
                (() => {
                  let flatIndex = 0;
                  return groupedSections.map((section) => (
                    <div key={section.category} className="mb-2">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">
                        {section.category}
                      </div>

                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const currentIndex = flatIndex++;
                          const isSelected = selectedIndex === currentIndex;
                          const Icon = item.icon;

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                item.action();
                                setIsOpen(false);
                              }}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              className={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-all duration-100 ${
                                isSelected
                                  ? "bg-gradient-to-r from-white/[0.12] to-white/[0.06] text-white shadow-sm border border-white/[0.18]"
                                  : "text-white/70 hover:bg-white/[0.04] hover:text-white border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`grid size-7 place-items-center rounded-lg border transition-all ${
                                    isSelected
                                      ? "border-[var(--color-brand)] bg-[var(--color-brand)]/20 text-white shadow-[0_0_10px_rgba(var(--spotlight-rgb),0.3)]"
                                      : "border-white/[0.08] bg-white/[0.04] text-white/50 group-hover:text-white/80"
                                  }`}
                                >
                                  <Icon size={14} />
                                </div>
                                <div className="min-w-0 truncate">
                                  <p className={`text-xs truncate ${isSelected ? "font-semibold text-white" : "font-medium"}`}>
                                    {item.title}
                                  </p>
                                  {item.subtitle && (
                                    <p className="text-[11px] text-white/40 truncate mt-0.5 group-hover:text-white/60">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {item.badge && (
                                  <span
                                    className="size-3 rounded-full border border-white/30 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                    style={{ backgroundColor: item.badge }}
                                  />
                                )}
                                {item.shortcut && (
                                  <span className="hidden sm:inline-flex items-center gap-1 rounded border border-white/[0.10] bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
                                    {item.shortcut}
                                  </span>
                                )}
                                {isSelected && (
                                  <CornerDownLeft size={13} className="text-[var(--color-brand)] animate-pulse" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between border-t border-white/[0.08] bg-black/40 px-4 py-2.5 text-[11px] text-white/50 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/[0.06] px-1 py-0.2 text-[9px] text-white/70">↑</kbd>
                  <kbd className="rounded border border-white/10 bg-white/[0.06] px-1 py-0.2 text-[9px] text-white/70">↓</kbd>
                  <span className="ml-0.5 text-white/40">navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.2 text-[9px] text-white/70">↵</kbd>
                  <span className="ml-0.5 text-white/40">select</span>
                </span>
              </div>
              <span className="text-white/40">ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
