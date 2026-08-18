"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Zap, CheckCircle, Users } from "lucide-react";

export interface FastGraderItem {
  id: string;
  studentName: string;
  taskTitle: string;
  status: "PENDING" | "PASSED" | "REDO";
  attemptNumber: number;
}

export function FastGraderNavigator({
  submissions,
  currentId,
}: {
  submissions: FastGraderItem[];
  currentId: string;
}) {
  const router = useRouter();

  const currentIndex = submissions.findIndex((s) => s.id === currentId);
  const prevSubmission = currentIndex > 0 ? submissions[currentIndex - 1] : null;
  const nextSubmission = currentIndex >= 0 && currentIndex < submissions.length - 1 ? submissions[currentIndex + 1] : null;

  // Keyboard navigation shortcuts: J for Next, K for Previous
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is actively typing in input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "j" || e.key === "J") {
        if (nextSubmission) {
          e.preventDefault();
          router.push(`/submissions/${nextSubmission.id}`);
        }
      } else if (e.key === "k" || e.key === "K") {
        if (prevSubmission) {
          e.preventDefault();
          router.push(`/submissions/${prevSubmission.id}`);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSubmission, nextSubmission, router]);

  if (submissions.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.12] bg-gradient-to-r from-white/[0.06] to-white/[0.02] p-3 shadow-[var(--shadow-card)] backdrop-blur-xl mb-6">
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/15 text-[var(--color-brand)] shadow-[0_0_12px_rgba(var(--spotlight-rgb),0.2)]">
          <Zap size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Fast-Grader Queue
            </span>
            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white/60">
              {currentIndex + 1} of {submissions.length}
            </span>
          </div>
          <p className="text-[11px] text-white/50">
            Use <kbd className="rounded border border-white/10 bg-white/10 px-1 py-0.2 font-mono text-[9px] text-white/80">K</kbd> / <kbd className="rounded border border-white/10 bg-white/10 px-1 py-0.2 font-mono text-[9px] text-white/80">J</kbd> keys to flip submissions sequentially
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {prevSubmission ? (
          <Link
            href={`/submissions/${prevSubmission.id}`}
            title={`Previous: ${prevSubmission.studentName} (Press K)`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition-all hover:scale-105 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Prev</span>
            <kbd className="hidden sm:inline rounded border border-white/10 bg-black/40 px-1 py-0.2 font-mono text-[9px] text-white/40">K</kbd>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-transparent px-3 py-1.5 text-xs font-medium text-white/30 cursor-not-allowed">
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Prev</span>
          </span>
        )}

        {nextSubmission ? (
          <Link
            href={`/submissions/${nextSubmission.id}`}
            title={`Next: ${nextSubmission.studentName} (Press J)`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/15 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:scale-105 hover:bg-[var(--color-brand)]/25 hover:border-[var(--color-brand)] shadow-[0_0_12px_rgba(var(--spotlight-rgb),0.25)]"
          >
            <span>Next Submission</span>
            <kbd className="hidden sm:inline rounded border border-white/20 bg-black/40 px-1 py-0.2 font-mono text-[9px] text-white/80">J</kbd>
            <ChevronRight size={14} />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle size={13} />
            <span>End of Queue</span>
          </span>
        )}
      </div>
    </div>
  );
}
