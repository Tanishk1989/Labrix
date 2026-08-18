"use client";

import { Archive, Check, Copy } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "./design-system";

export function ArchivedClasses({
  archivedCount = 0,
}: {
  archivedCount?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-10 border-t border-[var(--border)] pt-7">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Archived classes
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Previous terms and inactive classrooms.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
          <Archive size={16} aria-hidden="true" /> {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && archivedCount === 0 && (
        <div className="mt-4">
          <EmptyState
            title="No archived classes"
            description="Classes you archive will appear here."
          />
        </div>
      )}
    </section>
  );
}
export function JoinCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button
      type="button"
      className="group inline-flex min-h-[var(--control-height-sm)] items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-elevated)] px-2 text-xs font-semibold tracking-wide text-[var(--text-secondary)] transition-colors hover:border-[var(--color-brand-border)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--text-primary)]"
      onClick={copy}
      aria-label={`Copy join code ${code}`}
    >
      {copied ? (
        <Check size={14} className="text-[var(--color-success)]" aria-hidden="true" />
      ) : (
        <Copy
          size={14}
          className="text-[var(--text-muted)] group-hover:text-[var(--color-brand-hover)]"
          aria-hidden="true"
        />
      )}
      {copied ? "Copied" : code}
    </button>
  );
}
