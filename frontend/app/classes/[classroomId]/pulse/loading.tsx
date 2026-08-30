import { DemoShell } from "@/components/app-shell";

export default function LiveLabPulseLoading() {
  return (
    <DemoShell>
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-elevated)]" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-elevated)]" />)}</div>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><div className="h-96 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-elevated)]" /><div className="h-96 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-elevated)]" /></div>
        <p className="text-sm text-[var(--text-muted)]">Loading live classroom activity…</p>
      </div>
    </DemoShell>
  );
}

