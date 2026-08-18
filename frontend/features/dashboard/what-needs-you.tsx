import Link from "next/link";
import { ArrowRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";
import type { DashboardAttentionRow } from "./dashboard-view-model";

function getSignalBadge(tone: DashboardAttentionRow["tone"]) {
  if (tone === "danger") {
    return {
      dot: "bg-red-500/20 text-red-400 border-red-500/30",
      glow: "rgba(239, 68, 68, 0.12)",
    };
  }
  if (tone === "warning") {
    return {
      dot: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      glow: "rgba(212, 168, 83, 0.12)",
    };
  }
  return {
    dot: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    glow: "rgba(0, 240, 255, 0.12)",
  };
}

export function WhatNeedsYou({ items }: { items: DashboardAttentionRow[] }) {
  return (
    <section aria-labelledby="what-needs-you-heading">
      <div className="mb-4">
        <p className="eyebrow">Teacher actions</p>
        <h2 id="what-needs-you-heading" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Needs your attention
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          Review work and follow up on current practical signals.
        </p>
      </div>

      {items.length ? (
        <SpotlightCard spotlightColor="rgba(var(--spotlight-rgb), 0.08)" className="p-2 divide-y divide-[var(--border)] shadow-[var(--shadow-card)]">
          {items.map((item) => {
            const badge = getSignalBadge(item.tone);
            return (
              <div key={item.id} className="first:pt-0 last:pb-0">
                <Link
                  href={item.href}
                  aria-label={`${item.action}: ${item.title}`}
                  className="group grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 rounded-[var(--radius-md)] text-left transition-all hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] sm:gap-4"
                >
                  <span className={`size-2 rounded-full border ${badge.dot}`} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                      {item.kind === "review" ? "Review queue" : "Practical attention"}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-brand)] transition-colors">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{item.detail}</span>
                  </span>
                  <span className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--color-brand)] group-hover:translate-x-0.5 transition-transform">
                    <span className="hidden sm:inline">{item.action}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </Link>
              </div>
            );
          })}
        </SpotlightCard>
      ) : (
        <SpotlightCard className="p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Nothing needs your attention</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            No current review or submission items require action.
          </p>
          <Link href="/practicals" className="button-secondary mt-5 min-h-11 inline-flex items-center gap-2">
            View practicals <ArrowRight size={14} />
          </Link>
        </SpotlightCard>
      )}
    </section>
  );
}
