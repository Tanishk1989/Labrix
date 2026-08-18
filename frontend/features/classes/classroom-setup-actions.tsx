"use client";

import { Plus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button, Input, type ButtonVariant } from "@/components/design-system";
import { Dialog } from "@/components/dialog";
import { createClassroom, joinClassroom } from "./classroom-actions";

export function CreateClassroomButton() {
  const [open, setOpen] = useState(false);
  return <><Button className="min-h-11" onClick={() => setOpen(true)}><Plus size={16} aria-hidden="true" />Create class</Button>{open ? <ClassroomDialog mode="create" close={() => setOpen(false)} /> : null}</>;
}

export function JoinClassroomButton({ variant = "secondary" }: { variant?: ButtonVariant }) {
  const [open, setOpen] = useState(false);
  return <><Button variant={variant} className="min-h-11" onClick={() => setOpen(true)}><UsersRound size={16} aria-hidden="true" />Join class</Button>{open ? <ClassroomDialog mode="join" close={() => setOpen(false)} /> : null}</>;
}

function ClassroomDialog({ mode, close }: { mode: "create" | "join"; close: () => void }) {
  const router = useRouter();
  const errorId = useId();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(undefined);
    const result = mode === "create"
      ? await createClassroom(Object.fromEntries(formData))
      : await joinClassroom(String(formData.get("joinCode") ?? ""));
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    close();
    router.push(`/classes/${result.classroomId}`);
    router.refresh();
  }

  const title = mode === "create" ? "Create classroom" : "Join classroom";
  const description = mode === "create"
    ? "Set up a space for programming practicals."
    : "Enter the code shared by your teacher.";

  return (
    <form action={submit}>
      <Dialog
        title={title}
        description={description}
        onClose={close}
        footer={(
          <>
            <Button variant="secondary" className="min-h-11" onClick={close}>Cancel</Button>
            <Button type="submit" className="min-h-11" loading={pending}>{pending ? "Working…" : title}</Button>
          </>
        )}
      >
        {mode === "create" ? (
          <div className="space-y-4">
            <Field label="Classroom name" name="name" placeholder="e.g. DSA Practical Lab" />
            <Field label="Subject" name="subject" placeholder="e.g. Data Structures & Algorithms" />
            <Field label="Section" name="section" placeholder="e.g. BTech CSE · Section B" />
          </div>
        ) : (
          <Field
            label="Class code"
            name="joinCode"
            placeholder="e.g. ARRAY-42"
            describedBy={message ? errorId : undefined}
            invalid={Boolean(message)}
          />
        )}
        {message ? (
          <p id={errorId} role="alert" className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-3 text-sm text-[var(--color-danger)]">
            {message}
          </p>
        ) : null}
      </Dialog>
    </form>
  );
}

function Field({ label, name, placeholder, describedBy, invalid = false }: { label: string; name: string; placeholder: string; describedBy?: string; invalid?: boolean }) {
  return <label className="field-label block">{label}<Input name={name} required className="mt-2" placeholder={placeholder} aria-describedby={describedBy} aria-invalid={invalid || undefined} /></label>;
}
