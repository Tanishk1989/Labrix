"use client";

import React, { useEffect, useState } from "react";
import type { AllowedLanguage } from "@prisma/client";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Lock,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  fetchWorkspaceHintStateAction,
  requestWorkspaceHintAction,
} from "./hint-actions";
import type { StudentHintSessionState } from "@/server/hints/service";

export function StudentHintPanel({
  taskId,
  codingSessionId,
  sourceCode,
  language,
}: {
  taskId: string;
  codingSessionId: string;
  sourceCode: string;
  language: AllowedLanguage;
}) {
  const [hintState, setHintState] = useState<StudentHintSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial hint state
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const res = await fetchWorkspaceHintStateAction(taskId, codingSessionId);
      if (active) {
        if (res.ok) {
          setHintState(res.state);
        } else {
          setErrorMessage(res.message);
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [taskId, codingSessionId]);

  async function handleRequestHint() {
    setRequesting(true);
    setErrorMessage(null);
    try {
      const res = await requestWorkspaceHintAction(
        taskId,
        codingSessionId,
        sourceCode,
        language,
      );
      if (res.ok) {
        setHintState(res.state);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Hint service is temporarily unavailable. Try again.");
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-white/50 space-y-3">
        <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-[var(--color-brand)]" />
        <p>Checking instructor hint permissions…</p>
      </div>
    );
  }

  // 1. LOCKED STATE (Default)
  if (!hintState || !hintState.allowed) {
    return (
      <section
        aria-labelledby="locked-hints-heading"
        className="rounded-2xl border border-white/[0.12] bg-[var(--surface)] p-6 text-left shadow-[var(--shadow-card)] relative overflow-hidden"
      >
        {/* Background glow */}
        <div
          className="absolute -top-10 -right-10 size-40 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--color-brand) 0%, transparent 70%)" }}
        />

        <div className="flex items-start gap-4">
          <div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 shrink-0 mt-0.5">
            <Lock size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white/60">
                Gated Assistance
              </span>
            </div>
            <h3 id="locked-hints-heading" className="mt-1 text-base font-bold text-white">
              Instructor Permission Required
            </h3>
            <p className="mt-1.5 text-xs text-white/60 leading-relaxed max-w-md">
              AI Socratic hint assistance is currently disabled for this practical session. Your instructor controls access to progressive guided assistance.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-white/50 flex items-center gap-2">
              <HelpCircle size={13} className="shrink-0 text-white/40" />
              <span>If you are genuinely stuck, ask your teacher to grant AI Hint Access for your account on the classroom roster.</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. UNLOCKED PROGRESSIVE HINT STATE
  const currentLevel = hintState.currentLevel;
  const nextLevel = currentLevel + 1;

  const nextButtonLabels: Record<number, string> = {
    1: "Get Conceptual Nudge (Level 1)",
    2: "Still Stuck? Give Me a Diagnostic Hint (Level 2)",
    3: "Show Structural Scaffold (Level 3)",
  };

  return (
    <section aria-labelledby="ai-hints-heading" className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-xl border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/15 text-[var(--color-brand)]">
            <Lightbulb size={16} />
          </div>
          <div>
            <h3 id="ai-hints-heading" className="text-sm font-bold text-white flex items-center gap-2">
              <span>Socratic AI Hint Assistant</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                Unlocked by Teacher
              </span>
            </h3>
            <p className="text-[11px] text-white/50">
              Progressive Socratic guidance — rethink your logic without spoiling the answer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-white/60">
            {currentLevel}/3 Hints Used
          </span>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CHRONOLOGICAL HINT CARDS */}
      {hintState.hints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
          <Sparkles size={20} className="mx-auto text-[var(--color-brand)] opacity-60 mb-2" />
          <h4 className="text-xs font-semibold text-white">No hints requested yet</h4>
          <p className="text-[11px] text-white/50 mt-1 max-w-sm mx-auto">
            Try running your tests first. If you encounter a bug or algorithmic blocker, request Level 1 guidance below.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hintState.hints.map((hint) => (
            <div
              key={hint.id}
              className="rounded-2xl border border-white/[0.12] bg-[var(--surface)] p-4 shadow-sm space-y-2.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-[var(--color-brand)]/20 text-[10px] font-mono font-bold text-[var(--color-brand)]">
                    {hint.level}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {hint.level === 1
                      ? "Level 1 · Conceptual Nudge"
                      : hint.level === 2
                      ? "Level 2 · Diagnostic & Boundary"
                      : "Level 3 · Structural Scaffold"}
                  </span>
                </div>
                <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.2 text-[9px] font-mono text-white/60 uppercase">
                  {hint.category}
                </span>
              </div>

              {/* Hint Content */}
              <p className="text-xs text-white/90 leading-relaxed whitespace-pre-line font-sans pl-1">
                {hint.hintText}
              </p>

              {/* Guiding Question */}
              <div className="rounded-xl border border-[var(--color-brand)]/25 bg-[var(--color-brand)]/5 p-2.5 text-xs text-white/80 leading-relaxed">
                <span className="font-bold text-[var(--color-brand)]">🤔 Socratic Reflection: </span>
                <span>{hint.nextQuestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROGRESSIVE REQUEST ACTION BUTTON */}
      {hintState.canRequestNextLevel ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleRequestHint}
            disabled={requesting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-brand)]/50 bg-[var(--color-brand)] p-3 text-xs font-bold text-black shadow-[0_0_20px_rgba(var(--spotlight-rgb),0.35)] transition-all hover:scale-[1.01] hover:bg-white hover:border-white disabled:opacity-50 active:scale-[0.99]"
          >
            {requesting ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Synthesizing Socratic Guidance…</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{nextButtonLabels[nextLevel] || "Get Next Hint"}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center text-xs text-white/60">
          <CheckCircle2 size={14} className="inline-block text-emerald-400 mr-1.5" />
          <span>Maximum Socratic assistance reached (3/3). Apply the structural scaffold to finalize your solution!</span>
        </div>
      )}
    </section>
  );
}
