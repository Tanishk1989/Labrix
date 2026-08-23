"use client";

import { useActionState } from "react";
import { JoinCode } from "@/components/interactive-design-system";
import {
  deactivateStudentMembershipAction,
  reactivateStudentMembershipAction,
  regenerateClassroomJoinCodeAction,
  type RosterActionState,
} from "./roster-actions";
import {
  toggleClassroomHintPolicyAction,
  toggleStudentHintPermissionAction,
} from "./hint-policy-actions";

const initialState: RosterActionState = {};

export function JoinCodeControls({
  classroomId,
  code,
}: {
  classroomId: string;
  code: string;
}) {
  const action = regenerateClassroomJoinCodeAction.bind(null, classroomId);
  const [state, formAction, pending] = useActionState(action, initialState);
  return <section className="panel p-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow">Classroom access</p><h2 className="mt-2 text-sm font-semibold text-white">Student join code</h2><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Share this code with students who should join this classroom.</p></div>
      <JoinCode code={code} />
    </div>
    <form action={formAction} className="mt-4 border-t border-[var(--border)] pt-4">
      <p className="text-sm leading-6 text-[var(--text-muted)]">Regenerating immediately invalidates the current code. Existing memberships and historical work stay unchanged.</p>
      <button className="button-secondary mt-3" disabled={pending}>{pending ? "Regenerating…" : "Regenerate code"}</button>
    </form>
    {state.message ? <p aria-live="polite" className={`mt-3 text-xs ${state.ok ? "text-emerald-400" : "text-rose-400"}`}>{state.message}</p> : null}
  </section>;
}

export function DeactivateMembershipButton({
  classroomId,
  membershipId,
  studentName,
}: {
  classroomId: string;
  membershipId: string;
  studentName: string;
}) {
  const action = deactivateStudentMembershipAction.bind(
    null,
    classroomId,
    membershipId,
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction}>
    <button
      className="button-secondary min-h-11 px-3 py-2 text-rose-300"
      disabled={pending}
      aria-label={`Deactivate classroom access for ${studentName}`}
    >{pending ? "Deactivating…" : "Deactivate access"}</button>
    {state.message && !state.ok ? <p aria-live="polite" className="mt-2 max-w-64 text-sm leading-5 text-rose-400">{state.message}</p> : null}
  </form>;
}

export function ReactivateMembershipButton({
  classroomId,
  membershipId,
  studentName,
}: {
  classroomId: string;
  membershipId: string;
  studentName: string;
}) {
  const action = reactivateStudentMembershipAction.bind(
    null,
    classroomId,
    membershipId,
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction}>
    <button
      className="button-secondary min-h-11 px-3 py-2 text-emerald-300"
      disabled={pending}
      aria-label={`Reactivate classroom access for ${studentName}`}
    >{pending ? "Reactivating…" : "Reactivate access"}</button>
    {state.message && !state.ok ? <p aria-live="polite" className="mt-2 max-w-64 text-sm leading-5 text-rose-400">{state.message}</p> : null}
  </form>;
}

export function ClassroomHintPolicyControls({
  classroomId,
  enabledForAll,
}: {
  classroomId: string;
  enabledForAll: boolean;
}) {
  const action = toggleClassroomHintPolicyAction.bind(null, classroomId, !enabledForAll);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="eyebrow">AI Guided Assistance Policy</p>
            <span
              className={`rounded-full border px-2 py-0.2 text-[10px] font-mono font-bold uppercase tracking-wider ${
                enabledForAll
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-black/40 text-white/60"
              }`}
            >
              {enabledForAll ? "💡 Unlocked for Cohort" : "🔒 Locked by Default"}
            </span>
          </div>
          <h2 className="mt-2 text-sm font-semibold text-white">Classroom AI Hint Default</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Controls whether students receive progressive Socratic hints during lab practicals. Individual student overrides take precedence.
          </p>
        </div>

        <form action={formAction}>
          <button
            className={`min-h-10 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              enabledForAll
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                : "border-[var(--color-brand)]/40 bg-[var(--color-brand)]/15 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/25"
            }`}
            disabled={pending}
          >
            {pending
              ? "Updating…"
              : enabledForAll
              ? "🔒 Lock Hints for Class"
              : "💡 Enable Hints for All Students"}
          </button>
        </form>
      </div>
      {state.message ? (
        <p aria-live="polite" className={`mt-3 text-xs ${state.ok ? "text-emerald-400" : "text-rose-400"}`}>
          {state.message}
        </p>
      ) : null}
    </section>
  );
}

export function StudentHintToggle({
  classroomId,
  studentId,
  studentName,
  effectiveAllowed,
  hintsUsedCount = 0,
}: {
  classroomId: string;
  studentId: string;
  studentName: string;
  effectiveAllowed: boolean;
  overrideState?: boolean | null;
  hintsUsedCount?: number;
}) {
  const nextTarget = !effectiveAllowed;
  const action = toggleStudentHintPermissionAction.bind(null, classroomId, studentId, nextTarget);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex items-center gap-3">
      {/* Usage count */}
      <span className="font-mono text-xs tabular-nums text-white/50" title={`${hintsUsedCount} hints generated`}>
        {hintsUsedCount > 0 ? (
          <span className="rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[10px] text-purple-300 font-bold">
            {hintsUsedCount} {hintsUsedCount === 1 ? "hint" : "hints"}
          </span>
        ) : (
          <span className="text-white/30 text-[10px]">0 hints</span>
        )}
      </span>

      {/* Toggle button */}
      <form action={formAction}>
        <button
          className={`min-h-8 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
            effectiveAllowed
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
              : "border-white/10 bg-white/5 text-white/50 hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-500/40"
          }`}
          disabled={pending}
          title={`Click to ${effectiveAllowed ? "lock" : "enable"} AI hint assistance for ${studentName}`}
        >
          {pending
            ? "…"
            : effectiveAllowed
            ? "💡 Enabled"
            : "🔒 Locked"}
        </button>
      </form>
      {state.message && !state.ok ? (
        <span aria-live="polite" className="text-[10px] text-rose-400">
          {state.message}
        </span>
      ) : null}
    </div>
  );
}
