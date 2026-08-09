"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { publishTask, saveTaskDraft } from "./actions";
import {
  createPracticalDraftSchema,
  createPracticalPublishSchema,
  type CreatePracticalFormValues,
} from "./schema";

const blankCase = () => ({
  clientId: crypto.randomUUID(),
  input: "",
  expectedOutput: "",
});
type Props = { classroomId: string; classroomName: string };
export function CreatePracticalForm({ classroomId, classroomName }: Props) {
  const router = useRouter();
  const [intent, setIntent] = useState<"draft" | "publish" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    control,
    formState: { errors, isDirty },
    getValues,
    setError,
  } = useForm<CreatePracticalFormValues>({
    defaultValues: {
      title: "",
      instructions: "",
      constraints: "",
      allowedLanguages: ["CPP", "JAVA"],
      deadlineLocal: "",
      testCases: [blankCase()],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "testCases",
    keyName: "fieldKey",
  });
  const [taskId, setTaskId] = useState<string>();
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (isDirty && !success) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, success]);
  async function save(nextIntent: "draft" | "publish") {
    setFailure(null);
    const values = getValues();
    const validation = (
      nextIntent === "publish"
        ? createPracticalPublishSchema
        : createPracticalDraftSchema
    ).safeParse(values);
    if (!validation.success) {
      validation.error.issues.forEach((issue) =>
        setError(issue.path.join(".") as keyof CreatePracticalFormValues, {
          message: issue.message,
        }),
      );
      setFailure("Review the highlighted fields before continuing.");
      return;
    }
    setIntent(nextIntent);
    try {
      if (nextIntent === "draft") {
        const saved = await saveTaskDraft(classroomId, taskId, values); if (!saved.ok) { setFailure(saved.message); return; } setTaskId(saved.taskId);
        setSuccess("Draft saved.");
      } else {
        const published = await publishTask(classroomId, taskId, values); if (!published.ok) { setFailure(published.message); return; } router.push(`/classes/${classroomId}?notice=published`);
      }
    } catch {
      setFailure(
        nextIntent === "draft"
          ? "We could not save this draft. Try again."
          : "We could not publish this practical. Try again.",
      );
    } finally {
      setIntent(null);
    }
  }
  function cancel() {
    if (
      !isDirty ||
      success ||
      window.confirm("Discard your unsaved practical?")
    )
      router.push(`/classes/${classroomId}`);
  }
  const busy = intent !== null;
  return (
    <form
      id="create-practical-form"
      data-testid="create-practical-form"
      onSubmit={(event) => {
        event.preventDefault();
        void save("publish");
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Basic information</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Give students enough context to begin confidently.
          </p>
          <label className="mt-5 block text-sm font-medium">
            Practical title
            <input
              className="input mt-2"
              {...register("title")}
              aria-invalid={Boolean(errors.title)}
            />
          </label>
          {errors.title && (
            <p className="mt-1 text-sm text-rose-700">{errors.title.message}</p>
          )}
          <label className="mt-5 block text-sm font-medium">
            Instructions
            <textarea
              className="input mt-2 min-h-40 resize-y"
              {...register("instructions")}
              aria-invalid={Boolean(errors.instructions)}
            />
          </label>
          {errors.instructions && (
            <p className="mt-1 text-sm text-rose-700">
              {errors.instructions.message}
            </p>
          )}
          <label className="mt-5 block text-sm font-medium">
            Constraints{" "}
            <span className="font-normal text-slate-500">(optional)</span>
            <textarea
              className="input mt-2 min-h-20 resize-y"
              {...register("constraints")}
            />
          </label>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Allowed languages</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Students can choose from the languages you enable.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["CPP", "JAVA"] as const).map((language) => (
              <label
                key={language}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 hover:border-indigo-300"
              >
                <input
                  type="checkbox"
                  value={language}
                  {...register("allowedLanguages")}
                  className="size-4 accent-indigo-600"
                />
                <span className="font-medium">
                  {language === "CPP" ? "C++" : "Java"}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  {language}
                </span>
              </label>
            ))}
          </div>
          {errors.allowedLanguages && (
            <p className="mt-2 text-sm text-rose-700">
              {errors.allowedLanguages.message}
            </p>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Visible test cases</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Students can run their code against these examples.
              </p>
            </div>
            <button
              type="button"
              className="button-secondary"
              onClick={() => append(blankCase())}
            >
              <Plus size={16} /> Add test case
            </button>
          </div>
          {fields.map((field, index) => (
            <div
              className="mt-5 rounded-lg border border-slate-200 p-4"
              key={field.fieldKey}
            >
              <div className="flex justify-between">
                <h3 className="font-medium">Test case {index + 1}</h3>
                <button
                  type="button"
                  className="text-sm text-rose-700 disabled:text-slate-400"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label={`Remove test case ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <label className="mt-3 block text-sm font-medium">
                Input
                <textarea
                  className="input mt-1 min-h-20 font-mono text-xs"
                  {...register(`testCases.${index}.input`)}
                />
              </label>
              <label className="mt-3 block text-sm font-medium">
                Expected output
                <textarea
                  className="input mt-1 min-h-20 font-mono text-xs"
                  {...register(`testCases.${index}.expectedOutput`)}
                  aria-invalid={Boolean(
                    errors.testCases?.[index]?.expectedOutput,
                  )}
                />
              </label>
              {errors.testCases?.[index]?.expectedOutput && (
                <p className="mt-1 text-sm text-rose-700">
                  {errors.testCases[index]?.expectedOutput?.message}
                </p>
              )}
            </div>
          ))}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Deadline</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Leave blank to keep this practical available without a deadline.
          </p>
          <label className="mt-4 block text-sm font-medium">
            Date and time{" "}
            <span className="font-normal text-slate-500">
              (your local timezone)
            </span>
            <input
              type="datetime-local"
              className="input mt-2 max-w-sm"
              {...register("deadlineLocal")}
            />
          </label>
          {errors.deadlineLocal && (
            <p className="mt-1 text-sm text-rose-700">
              {errors.deadlineLocal.message}
            </p>
          )}
        </section>
      </div>
      <aside className="h-fit space-y-4 lg:sticky lg:top-20">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Ready to share?</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            <strong>Draft</strong> stays teacher-only in future persistence.{" "}
            <strong>Published</strong> makes the practical available to
            students.
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium">Classroom</p>
          <p className="mt-1 text-sm text-slate-600">{classroomName}</p>
          <details className="mt-3 text-sm text-slate-600">
            <summary className="cursor-pointer">Publishing checklist</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Title and instructions</li>
              <li>One language selected</li>
              <li>Expected output for every test</li>
            </ul>
          </details>
        </section>
        {failure && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
          >
            {failure}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            <CheckCircle2 size={17} />
            {success}
          </p>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <button
            type="button"
            className="w-full min-h-10 text-sm font-medium text-slate-600 hover:text-slate-900"
            onClick={cancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button-secondary mt-2 w-full"
            disabled={busy}
            onClick={() => save("draft")}
          >
            {intent === "draft" ? "Saving draft…" : "Save as draft"}
          </button>
        <button type="button" data-testid="publish-practical-button" className="button mt-2 w-full" disabled={busy} onClick={() => void save("publish")}>
            {intent === "publish" ? "Publishing…" : "Publish practical"}
          </button>
        </div>
      </aside>
    </form>
  );
}
