import React from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  FileCheck2,
  GraduationCap,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export type JourneyEvent = {
  id: string;
  sequence: number;
  type: "SESSION_STARTED" | "DRAFT_SAVED" | "RUN_REQUESTED" | "RUN_COMPLETED" | "SUBMISSION_CREATED" | string;
  occurredAt: string | Date;
  metadata?: Record<string, unknown> | null;
};

export type StudentJourneyTimelineProps = {
  events: JourneyEvent[];
  attemptNumber: number;
  submittedAt: string | Date;
  reviewStatus?: "NEEDS_REVIEW" | "DRAFT_SAVED" | "PUBLISHED_FEEDBACK" | "PENDING" | string;
  marksAwarded?: number | null;
  marksOutOf?: number | null;
  runCount?: number;
  passedTests?: number;
  totalTests?: number;
  studentName?: string;
  compact?: boolean;
};

const eventLabels: Record<string, { label: string; icon: React.ReactNode; tone: "brand" | "info" | "success" | "warning" | "neutral" }> = {
  SESSION_STARTED: {
    label: "Session started",
    icon: <Code2 size={13} className="text-[var(--color-info)]" />,
    tone: "info",
  },
  DRAFT_SAVED: {
    label: "Draft auto-saved",
    icon: <RotateCcw size={13} className="text-[var(--text-muted)]" />,
    tone: "neutral",
  },
  RUN_REQUESTED: {
    label: "Test execution requested",
    icon: <Play size={13} className="text-[var(--color-warning)]" />,
    tone: "warning",
  },
  RUN_COMPLETED: {
    label: "Tests executed in sandbox",
    icon: <Play size={13} className="text-[var(--color-brand)]" />,
    tone: "brand",
  },
  SUBMISSION_CREATED: {
    label: "Attempt recorded & submitted",
    icon: <FileCheck2 size={13} className="text-[var(--color-success)]" />,
    tone: "success",
  },
};

function formatTime(val: string | Date) {
  const d = typeof val === "string" ? new Date(val) : val;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

export function StudentJourneyTimeline({
  events,
  attemptNumber,
  submittedAt,
  reviewStatus = "NEEDS_REVIEW",
  marksAwarded,
  marksOutOf,
  runCount = 0,
  passedTests,
  totalTests,
}: StudentJourneyTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1] ?? { occurredAt: submittedAt };

  let durationString = "";
  if (firstEvent && lastEvent) {
    const diffMs = Math.max(0, new Date(lastEvent.occurredAt).getTime() - new Date(firstEvent.occurredAt).getTime());
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    durationString = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  const draftCount = sortedEvents.filter((e) => e.type === "DRAFT_SAVED").length;
  const actualRuns = runCount || sortedEvents.filter((e) => e.type === "RUN_REQUESTED" || e.type === "RUN_COMPLETED").length;

  const isReviewed = reviewStatus === "PUBLISHED_FEEDBACK";
  const isDraftReview = reviewStatus === "DRAFT_SAVED";

  return (
    <section
      aria-labelledby="journey-timeline-heading"
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--border-strong)] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-md bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
            <Sparkles size={14} aria-hidden="true" />
          </div>
          <div>
            <h2 id="journey-timeline-heading" className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              Student Journey Telemetry
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              EDIT → RUN → SUBMIT → REVIEW trajectory
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-[var(--text-secondary)]">
          {durationString ? (
            <span className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-0.5 text-[11px]">
              <Clock size={11} className="text-[var(--text-muted)]" /> {durationString} active coding
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-0.5 text-[11px]">
            Attempt #{attemptNumber}
          </span>
        </div>
      </div>

      {/* 4-Stage Workflow Progression Rail */}
      <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Stage 1: EDIT */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--color-surface-elevated)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">1. EDIT</span>
            <CheckCircle2 size={13} className="text-[var(--color-success)]" />
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">Coding & Drafts</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            {draftCount} {draftCount === 1 ? "draft saved" : "drafts auto-saved"}
          </p>
        </div>

        {/* Stage 2: RUN */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--color-surface-elevated)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">2. RUN</span>
            <CheckCircle2 size={13} className="text-[var(--color-success)]" />
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">Sandbox Runs</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            {actualRuns} {actualRuns === 1 ? "test run" : "test runs executed"}
          </p>
        </div>

        {/* Stage 3: SUBMIT */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--color-surface-elevated)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">3. SUBMIT</span>
            <CheckCircle2 size={13} className="text-[var(--color-success)]" />
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">Final Attempt</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            {typeof passedTests === "number" && typeof totalTests === "number"
              ? `${passedTests}/${totalTests} tests passed`
              : "Recorded"}
          </p>
        </div>

        {/* Stage 4: REVIEW & FEEDBACK */}
        <div className={`rounded-[var(--radius-md)] border p-3 ${
          isReviewed
            ? "border-[var(--color-success-border)] bg-[var(--color-success-surface)]"
            : isDraftReview
              ? "border-[var(--color-warning-border)] bg-[var(--color-warning-surface)]"
              : "border-[var(--border)] bg-[var(--color-surface-elevated)]"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">4. REVIEW</span>
            {isReviewed ? (
              <CheckCircle2 size={13} className="text-[var(--color-success)]" />
            ) : (
              <GraduationCap size={13} className="text-[var(--text-muted)]" />
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">
            {isReviewed ? "Feedback Published" : isDraftReview ? "Draft Feedback" : "Awaiting Review"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            {isReviewed && typeof marksAwarded === "number" && typeof marksOutOf === "number"
              ? `${marksAwarded} / ${marksOutOf} marks awarded`
              : isReviewed
                ? "Feedback live"
                : "Teacher evaluation"}
          </p>
        </div>
      </div>

      {/* Expandable Chronological Telemetry Stream */}
      {sortedEvents.length ? (
        <details className="group mt-3 border-t border-[var(--border)] pt-3">
          <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <span>Detailed Activity Stream ({sortedEvents.length} telemetry signals)</span>
            <ChevronDown size={13} className="transition-transform group-open:rotate-180" />
          </summary>
          <ol className="mt-4 space-y-3 pl-1">
            {sortedEvents.map((event, idx) => {
              const meta = eventLabels[event.type] || {
                label: event.type,
                icon: <Code2 size={13} className="text-[var(--text-muted)]" />,
                tone: "neutral",
              };
              return (
                <li key={event.id || idx} className="relative flex items-start gap-3 border-l border-[var(--border)] pl-4 pb-1">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[5px] top-1.5 size-2 rounded-full border border-[var(--color-surface)] bg-[var(--color-brand)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                        {meta.icon}
                        <span>{meta.label}</span>
                      </p>
                      <time
                        dateTime={new Date(event.occurredAt).toISOString()}
                        className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]"
                      >
                        {formatTime(event.occurredAt)}
                      </time>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
