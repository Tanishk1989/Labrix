import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Info,
  Search,
} from "lucide-react";
import React, {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: "button",
  secondary: "button-secondary",
  ghost: "button-ghost",
  danger: "button-danger",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  iconOnly?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  iconOnly = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonVariantClass[variant], iconOnly && "button-icon-only", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="button-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cx("icon-button", className)}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}

export type BadgeTone =
  | "neutral"
  | "info"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "active"
  | "published"
  | "draft"
  | "closed"
  | "passed"
  | "needs-review"
  | "compilation-error";

const toneClassMap: Record<BadgeTone, string> = {
  neutral: "status-neutral",
  info: "status-info",
  brand: "status-brand",
  success: "status-success",
  warning: "status-warning",
  danger: "status-danger",
  active: "status-active",
  published: "status-published",
  draft: "status-draft",
  closed: "status-closed",
  passed: "status-passed",
  "needs-review": "status-needs-review",
  "compilation-error": "status-compilation-error",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("status-badge", toneClassMap[tone], className)}>
      {children}
    </span>
  );
}

export const StatusBadge = Badge;

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  height = "h-1.5",
  tone = "brand",
  ariaLabel,
}: {
  value: number;
  label?: string;
  showPercentage?: boolean;
  height?: string;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
  ariaLabel?: string;
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {label || showPercentage ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          {label ? <span>{label}</span> : <span />}
          {showPercentage ? (
            <span className="font-semibold text-[var(--text-primary)]">{clampedValue}%</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cx("progress-track", height)}
        role="progressbar"
        aria-label={ariaLabel ?? label ?? "Progress"}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cx("progress-indicator", `progress-${tone}`)}
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
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  detail?: string;
  badgeText?: string;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "indigo" | "emerald" | "amber" | string;
}) {
  const resolvedTone = tone === "indigo" ? "brand" : tone === "emerald" ? "success" : tone === "amber" ? "warning" : tone;
  return (
    <div data-tone={resolvedTone} className="metric-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</p>
        {badgeText ? <Badge tone="brand">{badgeText}</Badge> : null}
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  breadcrumbs,
  title,
  description,
  subtitle,
  actions,
  compact = false,
}: {
  eyebrow?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title: string;
  description?: string;
  subtitle?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  const supportingText = description ?? subtitle;
  return (
    <header className={compact ? "mb-5" : "mb-8"}>
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumbs" className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <ChevronRight size={12} aria-hidden="true" /> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[var(--text-primary)]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[var(--text-secondary)]" aria-current="page">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className={cx("page-heading", eyebrow ? undefined : "mt-0", compact && "text-2xl")}>{title}</h1>
          {supportingText ? <p className="page-subtitle">{supportingText}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <section className={cx("panel", className)} {...props}>{children}</section>;
}

export function PanelHeader({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("panel-header", className)}>
      {children ?? (
        <div>
          {title ? <h2 className="section-heading">{title}</h2> : null}
          {description ? <p className="section-description">{description}</p> : null}
        </div>
      )}
      {actions}
    </div>
  );
}

export function PanelBody({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("panel-body", className)} {...props}>{children}</div>;
}

type ControlProps = { error?: boolean };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & ControlProps>(
  function Input({ className, error, "aria-invalid": ariaInvalid, ...props }, ref) {
    return <input ref={ref} className={cx("input", error && "control-error", className)} aria-invalid={ariaInvalid ?? (error || undefined)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & ControlProps>(
  function Select({ className, error, "aria-invalid": ariaInvalid, children, ...props }, ref) {
    return <select ref={ref} className={cx("input", "select", error && "control-error", className)} aria-invalid={ariaInvalid ?? (error || undefined)} {...props}>{children}</select>;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps>(
  function Textarea({ className, error, "aria-invalid": ariaInvalid, ...props }, ref) {
    return <textarea ref={ref} className={cx("input", "textarea", error && "control-error", className)} aria-invalid={ariaInvalid ?? (error || undefined)} {...props} />;
  },
);

export function Tabs({
  items,
  ariaLabel,
  className,
}: {
  items: Array<{ id: string; label: string; href: string; active?: boolean; count?: number }>;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cx("tabs", className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cx("tab-item", item.active && "tab-item-active")}
        >
          {item.label}
          {item.count !== undefined ? <span className="count-chip">{item.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export const SegmentedFilter = Tabs;

export function FilterToolbar({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("filter-toolbar", className)} {...props}>{children}</div>;
}

const noticeIcon = {
  neutral: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
} as const;

export function InlineNotice({
  tone = "neutral",
  title,
  children,
  className,
}: {
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const Icon = noticeIcon[tone];
  return (
    <div
      className={cx("inline-notice", tone !== "neutral" && `notice-${tone}`, className)}
      role={tone === "danger" ? "alert" : tone === "success" ? "status" : undefined}
    >
      <Icon size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div>
        {title ? <p className="font-semibold text-[var(--text-primary)]">{title}</p> : null}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  action,
  secondaryAction,
  icon,
  className,
  headingLevel = "h3",
}: {
  title: string;
  description: string;
  /** @deprecated Supply actionHref, onAction, or action with actionLabel. */
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  className?: string;
  headingLevel?: "h1" | "h2" | "h3";
}) {
  const Heading = headingLevel;
  const renderedAction = action ?? (
    actionLabel && actionHref ? <Link href={actionHref} className="button-secondary min-h-11">{actionLabel}</Link> :
    actionLabel && onAction ? <Button variant="secondary" className="min-h-11" onClick={onAction}>{actionLabel}</Button> : null
  );
  return (
    <section className={cx("border-y border-[var(--border)] py-8 sm:py-10", className)}>
      {icon ? <span className="mb-3 block text-[var(--text-muted)]">{icon}</span> : null}
      <Heading className="text-base font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{title}</Heading>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {renderedAction || secondaryAction ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {renderedAction}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("block animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-elevated)]", className)}
    />
  );
}

export function LoadingState({
  title = "Loading",
  description = "The latest information is being prepared.",
  children,
  className,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("space-y-6", className)}
      role="status"
      aria-busy="true"
      aria-label={`${title}. ${description}`}
    >
      <div aria-hidden="true">
        {children ?? (
          <div className="space-y-3 border-y border-[var(--border)] py-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full max-w-lg" />
            <Skeleton className="h-3 w-3/4 max-w-md" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this content",
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  headingLevel = "h3",
}: {
  title?: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  headingLevel?: "h1" | "h2" | "h3";
}) {
  return (
    <div role="alert">
      <EmptyState
        className={className}
        title={title}
        description={description}
        actionLabel={actionLabel}
        actionHref={actionHref}
        onAction={onAction}
        headingLevel={headingLevel}
        icon={<AlertCircle size={18} aria-hidden="true" className="text-[var(--color-danger)]" />}
      />
    </div>
  );
}

/* Existing specialized components retained for incremental compatibility. */
export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <nav aria-label="Practical authoring steps" className="flex items-center gap-1 overflow-x-auto border-y border-[var(--border)] py-3 text-sm">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        return (
          <React.Fragment key={step}>
            {index > 0 ? <ChevronRight size={14} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" /> : null}
            <span aria-current={isActive ? "step" : undefined} className={cx("flex shrink-0 items-center gap-2 border-b-2 px-3 py-1.5 font-medium", isActive ? "border-[var(--brand-accent)] text-[var(--text-primary)]" : "border-transparent", isCompleted ? "text-[var(--color-success)]" : !isActive && "text-[var(--text-muted)]")}>
              <span className={cx("grid size-5 place-items-center rounded-full border text-xs font-bold", isActive ? "border-[var(--color-brand-border)] bg-[var(--brand)] text-white" : isCompleted ? "border-[var(--color-success-border)] bg-[var(--color-success-surface)] text-[var(--color-success)]" : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)]")}>
                {String(stepNumber).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </span>
          </React.Fragment>
        );
      })}
    </nav>
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
  onSearchChange?: (value: string) => void;
  tabs?: Array<{ id: string; label: string; count?: number }>;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  filters?: ReactNode;
  primaryAction?: ReactNode;
}) {
  return (
    <div className="mb-5 space-y-4">
      <FilterToolbar>
        <label className="relative min-w-64 flex-1 sm:max-w-md">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
          <Input className="pl-9" placeholder={searchPlaceholder} value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} />
        </label>
        {filters}
        {primaryAction}
      </FilterToolbar>
      {tabs?.length ? (
        <div className="tabs" role="tablist">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={tab.id === activeTab} onClick={() => onTabChange?.(tab.id)} className={cx("tab-item", tab.id === activeTab && "tab-item-active")}>
              {tab.label}
              {tab.count !== undefined ? <span className="count-chip">{tab.count}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PublishingChecklist({ items }: { items: Array<{ label: string; completed: boolean }> }) {
  return (
    <section aria-labelledby="publishing-checklist-heading" className="border-y border-[var(--border)] py-5">
      <h3 id="publishing-checklist-heading" className="text-sm font-semibold text-[var(--text-primary)]">Publishing checklist</h3>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.completed ? <CheckCircle2 size={15} className="shrink-0 text-[var(--color-success)]" aria-hidden="true" /> : <Circle size={15} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />}
            <span className={item.completed ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
