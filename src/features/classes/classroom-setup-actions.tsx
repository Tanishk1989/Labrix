"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UsersRound, X } from "lucide-react";
import { createClassroom, joinClassroom } from "./classroom-actions";

export function CreateClassroomButton() {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="button" onClick={() => setOpen(true)}><Plus size={17} aria-hidden="true" />Create class</button>{open && <ClassroomDialog mode="create" close={() => setOpen(false)} />}</>;
}

export function JoinClassroomButton() {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="button-secondary mt-5" onClick={() => setOpen(true)}><UsersRound size={17} aria-hidden="true" />Join with code</button>{open && <ClassroomDialog mode="join" close={() => setOpen(false)} />}</>;
}

function ClassroomDialog({ mode, close }: { mode: "create" | "join"; close: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  async function submit(formData: FormData) {
    setPending(true); setMessage(undefined);
    const result = mode === "create" ? await createClassroom(Object.fromEntries(formData)) : await joinClassroom(String(formData.get("joinCode") ?? ""));
    setPending(false);
    if (!result.ok) { setMessage(result.message); return; }
    close(); router.push(`/classes/${result.classroomId}`); router.refresh();
  }
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-4" role="dialog" aria-modal="true" aria-labelledby="classroom-dialog-title"><form action={submit} className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="classroom-dialog-title" className="text-lg font-semibold text-slate-950">{mode === "create" ? "Create classroom" : "Join classroom"}</h2><p className="mt-1 text-sm text-slate-600">{mode === "create" ? "Set up a space for programming practicals." : "Enter the code shared by your teacher."}</p></div><button type="button" aria-label="Close" className="icon-button" onClick={close}><X size={18} /></button></div>{mode === "create" ? <div className="mt-5 space-y-4"><Field label="Classroom name" name="name" placeholder="e.g. DSA Practical Lab" /><Field label="Subject" name="subject" placeholder="e.g. Data Structures & Algorithms" /><Field label="Section" name="section" placeholder="e.g. BTech CSE · Section B" /></div> : <div className="mt-5"><Field label="Classroom code" name="joinCode" placeholder="e.g. ARRAY-42" /></div>}{message && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" className="button-secondary" onClick={close}>Cancel</button><button className="button" disabled={pending}>{pending ? "Working…" : mode === "create" ? "Create classroom" : "Join classroom"}</button></div></form></div>;
}
function Field({ label, name, placeholder }: { label: string; name: string; placeholder: string }) { return <label className="block text-sm font-medium text-slate-700">{label}<input name={name} required className="input mt-2" placeholder={placeholder} /></label>; }
