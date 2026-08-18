import type { DashboardMetric } from "./dashboard-view-model";
import { SpotlightCard } from "@/components/spotlight-card";
import { AnimatedCounter } from "@/components/animated-counter";

export function DashboardMetricStrip({ metrics }: { metrics: DashboardMetric[] }) {
  const accentColors = [
    { dot: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30", glow: "rgba(0, 240, 255, 0.12)" },
    { dot: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30", glow: "rgba(0, 245, 160, 0.12)" },
    { dot: "bg-amber-400/20 text-amber-400 border-amber-400/30", glow: "rgba(212, 168, 83, 0.12)" },
    { dot: "bg-purple-400/20 text-purple-400 border-purple-400/30", glow: "rgba(168, 85, 247, 0.12)" },
  ];

  return (
    <section aria-labelledby="dashboard-metrics-heading" className="w-full">
      <h2 id="dashboard-metrics-heading" className="sr-only">Teaching overview</h2>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => {
          const accent = accentColors[idx % accentColors.length];
          return (
            <SpotlightCard
              key={metric.label}
              spotlightColor={accent?.glow}
              className={`p-5 shadow-[var(--shadow-card)] interactive-lift animate-gpu-entry animate-stagger-${idx + 1}`}
            >
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                  {metric.label}
                </dt>
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full border ${accent?.dot}`}
                />
              </div>
              <dd className="mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">
                <AnimatedCounter value={metric.value} />
              </dd>
            </SpotlightCard>
          );
        })}
      </dl>
    </section>
  );
}
