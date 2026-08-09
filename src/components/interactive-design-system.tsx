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
          <h2 className="text-base font-semibold text-slate-900">
            Archived classes
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Previous terms and inactive classrooms.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
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
      className="group inline-flex min-h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold tracking-wide text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
      onClick={copy}
      aria-label={`Copy join code ${code}`}
    >
      {copied ? (
        <Check size={14} className="text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy
          size={14}
          className="text-slate-400 group-hover:text-indigo-600"
          aria-hidden="true"
        />
      )}
      {copied ? "Copied" : code}
    </button>
  );
}
