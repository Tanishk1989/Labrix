import React from "react";
import Link from "next/link";
import { ChevronRight, Inbox, Search, AlertTriangle, CheckCircle2, Circle } from "lucide-react";

export function StatusBadge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: "neutral" | "success" | "warning" | "info" | "active" | "published" | "draft" | "closed" | "passed" | "needs-review" | "danger" | "compilation-error";
  children: React.ReactNode;
  className?: string;
}) {
  const toneClassMap: Record<string, string> = {
    neutral: "status-neutral",
    success: "status-success",
    passed: "status-passed",
    active: "status-active",
    published: "status-published",
    info: "status-info",
    draft: "status-draft",
    closed: "status-neutral",
    warning: "status-warning",
    "needs-review": "status-needs-review",
    danger: "status-danger",
    "compilation-error": "status-compilation-error",
  };
  const resolvedClass = toneClassMap[tone] ?? "status-neutral";
  return <span className={`status-badge ${resolvedClass} ${className}`}>{children}</span>;
}

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  height = "h-1.5",
}: {
  value: number;
  label?: string;
  showPercentage?: boolean;
  height?: string;
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {label || showPercentage ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          {label ? <span>{label}</span> : <span />}
          {showPercentage ? <span className="font-semibold text-slate-200">{clampedValue}%</span> : null}
        </div>
      ) : null}
      <div
        className={`${height} w-full overflow-hidden rounded-full bg-[#1e2330]`}
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-[width] duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  badgeText,
  tone,
}: {
  label: string;
  value: number | string;
  detail?: string;
  badgeText?: string;
  tone?: "indigo" | "emerald" | "amber" | string;
}) {
  return (
    <div data-tone={tone} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[#2e3548]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        {badgeText ? (
          <span className="rounded bg-[#1c2234] px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-[#2a344d]">
            {badgeText}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p> : null}
    </div>
  );
}

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
}: {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumbs" className="mb-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 ? <ChevronRight size={12} className="text-[var(--text-muted)]" /> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-slate-200">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-300">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Stepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[#0f1118] p-3 text-xs">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <React.Fragment key={step}>
            {idx > 0 ? <ChevronRight size={14} className="text-slate-700" /> : null}
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : isCompleted
                  ? "text-emerald-400"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <span
                className={`grid size-5 place-items-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : isCompleted
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-[#1f2433] text-[var(--text-muted)]"
                }`}
              >
                {stepNum < 10 ? `0${stepNum}` : stepNum}
              </span>
              <span>{step}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function FilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  tabs,
  activeTab,
  onTabChange,
  filters,
  primaryAction,
}: {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  tabs?: Array<{ id: string; label: string; count?: number }>;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  filters?: React.ReactNode;
  primaryAction?: React.ReactNode;
}) {
  return (
    <div className="mb-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[280px] flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            className="input pl-9 text-xs"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {filters}
          {primaryAction}
        </div>
      </div>
      {tabs && tabs.length > 0 ? (
        <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2 text-xs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                  isActive
                    ? "bg-[#1c2234] text-white border border-[#2b344d]"
                    : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-hover)]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined ? (
                  <span className="rounded bg-[#252b3d] px-1.5 py-0.2 text-[10px] font-bold text-slate-300">
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function NeedsAttentionCard({
  title,
  subtitle,
  detail,
  actionText,
  onAction,
  priority = "medium",
}: {
  title: string;
  subtitle?: string;
  detail?: string;
  actionText?: string;
  onAction?: () => void;
  priority?: "high" | "medium" | "low";
}) {
  const priorityColor =
    priority === "high"
      ? "text-rose-400 border-rose-500/20 bg-rose-500/10"
      : priority === "low"
      ? "text-slate-400 border-slate-700 bg-slate-800/40"
      : "text-amber-400 border-amber-500/20 bg-amber-500/10";

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[#2e3548]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${priorityColor}`}>
            <AlertTriangle size={12} />
            {priority}
          </span>
        </div>
        <h4 className="mt-3 font-semibold text-white text-sm">{title}</h4>
        {subtitle ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{subtitle}</p> : null}
        {detail ? <p className="mt-2 text-[11px] text-[var(--text-muted)]">{detail}</p> : null}
      </div>
      {actionText ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
        >
          <span>{actionText}</span>
          <ChevronRight size={13} />
        </button>
      ) : null}
    </div>
  );
}

export function PublishingChecklist({
  items,
}: {
  items: Array<{ label: string; completed: boolean }>;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Publishing Checklist</h3>
      <ul className="mt-3 space-y-2 text-xs">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {item.completed ? (
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            ) : (
              <Circle size={15} className="text-slate-600 shrink-0" />
            )}
            <span className={item.completed ? "text-slate-200 font-medium" : "text-[var(--text-muted)]"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-[#1a1d29] text-[var(--text-muted)] border border-[var(--border)]">
        <Inbox size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm">{description}</p>
      {actionLabel ? (
        <button type="button" className="button button-secondary mt-4">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
