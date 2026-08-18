"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Sparkles, X, Zap } from "lucide-react";
import type { StudentDashboardPractical } from "./student-dashboard-view-model";

export function PriorityPracticalBanner({
  practical,
}: {
  practical: StudentDashboardPractical;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !practical) return null;

  return (
    <div
      role="region"
      aria-label="High Priority Practical Announcement"
      className="relative overflow-hidden rounded-2xl border border-[var(--color-brand)]/40 bg-gradient-to-r from-[var(--color-brand)]/15 via-white/[0.04] to-black/40 p-5 shadow-[0_0_25px_rgba(var(--spotlight-rgb),0.15)] backdrop-blur-2xl transition-all"
    >
      {/* Decorative ambient background radial light */}
      <div
        className="pointer-events-none absolute -top-10 -left-10 size-48 rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--color-brand) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0 max-w-2xl">
          <div className="grid size-10 place-items-center rounded-xl border border-[var(--color-brand)]/50 bg-[var(--color-brand)]/20 text-[var(--color-brand)] shadow-[0_0_15px_rgba(var(--spotlight-rgb),0.3)] shrink-0 mt-0.5">
            <Zap size={20} className="animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-sm">
                <Sparkles size={11} />
                New Practical Assigned
              </span>
              <span className="text-xs font-semibold text-white/50">
                {practical.classroomName}
              </span>
            </div>

            <h3 className="mt-1.5 text-base font-bold text-white tracking-tight sm:text-lg">
              {practical.title}
            </h3>

            <p className="mt-1 text-xs text-white/60 flex items-center gap-2">
              <Clock size={12} className="text-white/40" />
              <span>
                {practical.deadline ? `Due ${new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(practical.deadline))}` : "No strict deadline"}
              </span>
              <span>·</span>
              <span className="text-[var(--color-brand)] font-medium">Auto-Graded Test Cases Configured</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <Link
            href={practical.href}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand)]/50 bg-[var(--color-brand)] px-4 py-2.5 text-xs font-bold text-black shadow-[0_0_20px_rgba(var(--spotlight-rgb),0.35)] transition-all hover:scale-105 hover:bg-white hover:border-white active:scale-95"
          >
            <span>Open Lab Workspace</span>
            <ArrowRight size={14} />
          </Link>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            title="Dismiss Announcement"
            className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
