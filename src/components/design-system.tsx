import { Inbox } from "lucide-react";

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "info";
  children: React.ReactNode;
}) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{value}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
export function MetricCard({
  label,
  value,
  detail,
  tone = "indigo",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "indigo" | "emerald" | "amber";
}) {
  return (
    <div className="metric-card">
      <span className={`metric-mark metric-${tone}`} aria-hidden="true" />
      <div>
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p>
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-sm">
        <Inbox size={19} aria-hidden="true" />
      </span>
      <div>
        <p className="font-medium text-slate-800">{title}</p>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          {description}
        </p>
        {actionLabel && (
          <span className="mt-3 block text-sm font-semibold text-indigo-700">
            {actionLabel}
          </span>
        )}
      </div>
    </div>
  );
}
