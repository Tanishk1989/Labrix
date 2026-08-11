"use client";

import { useActionState } from "react";
import { JoinCode } from "@/components/interactive-design-system";
import {
  deactivateStudentMembershipAction,
  reactivateStudentMembershipAction,
  regenerateClassroomJoinCodeAction,
  type RosterActionState,
} from "./roster-actions";

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
      <div><p className="eyebrow">Classroom access</p><h2 className="mt-2 text-sm font-semibold text-white">Student join code</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Share this code with students who should join this classroom.</p></div>
      <JoinCode code={code} />
    </div>
    <form action={formAction} className="mt-4 border-t border-[var(--border)] pt-4">
      <p className="text-[11px] leading-5 text-[var(--text-muted)]">Regenerating immediately invalidates the current code. Existing memberships and historical work stay unchanged.</p>
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
      className="button-secondary min-h-8 px-2.5 py-1 text-rose-300"
      disabled={pending}
      aria-label={`Deactivate classroom access for ${studentName}`}
    >{pending ? "Deactivating…" : "Deactivate access"}</button>
    {state.message && !state.ok ? <p aria-live="polite" className="mt-1 max-w-44 text-[10px] text-rose-400">{state.message}</p> : null}
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
      className="button-secondary min-h-8 px-2.5 py-1 text-emerald-300"
      disabled={pending}
      aria-label={`Reactivate classroom access for ${studentName}`}
    >{pending ? "Reactivating…" : "Reactivate access"}</button>
    {state.message && !state.ok ? <p aria-live="polite" className="mt-1 max-w-44 text-[10px] text-rose-400">{state.message}</p> : null}
  </form>;
}
