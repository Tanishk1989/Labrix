"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { PublishingChecklist, Stepper, StatusBadge } from "@/components/design-system";
import {
  type CreatePracticalFormValues,
} from "./schema";
import { publishTask, saveTaskDraft } from "./actions";

export function CreatePracticalForm({
  classroomId,
  classroomName,
  taskId,
  initialValues,
}: {
  classroomId: string;
  classroomName: string;
  taskId?: string;
  initialValues?: Partial<CreatePracticalFormValues>;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("Not saved yet");
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreatePracticalFormValues>({
    defaultValues: {
      title: initialValues?.title ?? "",
      instructions: initialValues?.instructions ?? "",
      constraints: initialValues?.constraints ?? "",
      allowedLanguages: initialValues?.allowedLanguages ?? ["CPP", "JAVA"],
      deadlineLocal: initialValues?.deadlineLocal ?? "",
      testCases: initialValues?.testCases ?? [
        { clientId: "tc-1", input: "", expectedOutput: "", visible: true },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testCases",
  });

  const [watchTitle, watchInstructions, watchDeadline, watchLanguages, watchTestCases] = useWatch({
    control: form.control,
    name: ["title", "instructions", "deadlineLocal", "allowedLanguages", "testCases"],
  });

  // Publishing Checklist States
  const hasDetails = watchTitle.trim().length > 0 && watchInstructions.trim().length > 0;
  const hasProblems = watchInstructions.trim().length > 0;
  const hasTestCases = watchTestCases.some(tc => tc.visible) && watchTestCases.every(tc => tc.expectedOutput.trim().length > 0);
  const hasConfig = watchLanguages.length > 0;
  const isReadyToPublish = hasDetails && hasProblems && hasTestCases && hasConfig;

  const checklistItems = [
    { label: "Practical details", completed: hasDetails },
    { label: "Problem statement", completed: hasProblems },
    { label: "Test cases configured", completed: hasTestCases },
    { label: "Practical configuration", completed: hasConfig },
    { label: "Ready to publish", completed: isReadyToPublish },
  ];

  async function handleSaveDraft() {
    setIsSaving(true);
    setServerError(null);
    const values = form.getValues();
    const result = await saveTaskDraft(classroomId, taskId, values);
    setIsSaving(false);
    if (result.ok) {
      setSavedAt(`Saved at ${new Date().toLocaleTimeString()}`);
    } else {
      setServerError(result.message);
    }
  }

  async function handlePublish() {
    setIsSaving(true);
    setServerError(null);
    const values = form.getValues();
    const result = await publishTask(classroomId, taskId, values);
    setIsSaving(false);
    if (result.ok) {
      router.push(`/classes/${classroomId}`);
    } else {
      setServerError(result.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="mb-1 text-xs text-[var(--text-muted)]">
            <span>Practicals</span> &gt; <span className="text-white font-medium">Create Practical</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Practical</h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Build and configure a programming practical for your class.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">{savedAt}</span>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="button button-secondary text-xs"
          >
            Save Draft
          </button>
        </div>
      </div>

      {/* Stepper Header */}
      <Stepper
        steps={["Details", "Problems", "Configure", "Review"]}
        currentStep={currentStep}
      />

      {serverError ? (
        <div className="rounded-lg bg-rose-500/10 p-3 text-xs font-semibold text-rose-400 border border-rose-500/20">
          {serverError}
        </div>
      ) : null}

      {/* Form & Side Panel Layout */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Form Area */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
          {/* STEP 1: DETAILS */}
          {currentStep === 1 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Practical Details</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Set the basic information students will see.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Practical Title
                </label>
                <input
                  {...form.register("title")}
                  className="input mt-1.5"
                  placeholder="e.g. Binary Trees Practical"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Class</label>
                <input
                  type="text"
                  disabled
                  value={classroomName}
                  className="input mt-1.5 opacity-70 cursor-not-allowed bg-[#0b0c10]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Instructions</label>
                <textarea
                  {...form.register("instructions")}
                  rows={4}
                  className="input mt-1.5"
                  placeholder="Shown to students on the practical overview."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Constraints</label>
                <textarea
                  {...form.register("constraints")}
                  rows={3}
                  className="input mt-1.5"
                  placeholder="e.g. 2 ≤ n ≤ 100000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  {...form.register("deadlineLocal")}
                  className="input mt-1.5 max-w-xs text-xs"
                />
              </div>
            </div>
          ) : null}

          {/* STEP 2: PROBLEMS & TEST CASES */}
          {currentStep === 2 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Test Cases & Evaluation</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Visible tests give students detailed feedback. Hidden tests run only on submission and keep their details private.
                </p>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-[var(--border)] bg-[#0f1118] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-indigo-400">Test Case #{index + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
                          <span>Visibility</span>
                          <select
                            {...form.register(`testCases.${index}.visible`, {
                              setValueAs: (value) => value === "true",
                            })}
                            className="input min-h-8 py-1 text-xs"
                          >
                            <option value="true">Visible</option>
                            <option value="false">Hidden</option>
                          </select>
                        </label>
                        {fields.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          aria-label={`Remove test case ${index + 1}`}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 size={14} />
                        </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300">Input</label>
                        <textarea
                          {...form.register(`testCases.${index}.input`)}
                          rows={2}
                          className="input mt-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300">Expected Output</label>
                        <textarea
                          {...form.register(`testCases.${index}.expectedOutput`)}
                          rows={2}
                          className="input mt-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => append({ clientId: `tc-${fields.length + 1}`, input: "", expectedOutput: "", visible: true })}
                className="button button-secondary text-xs"
              >
                <Plus size={14} />
                <span>Add Test Case</span>
              </button>
            </div>
          ) : null}

          {/* STEP 3: CONFIGURE */}
          {currentStep === 3 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Configure Execution</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Select the programming languages allowed for this practical.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Allowed Languages</label>
                <div className="flex items-center gap-4">
                  {([
                    { id: "CPP", label: "C++" },
                    { id: "JAVA", label: "Java" },
                  ] satisfies Array<{ id: "CPP" | "JAVA"; label: string }>).map((lang) => (
                    <label key={lang.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                      <input
                        type="checkbox"
                        value={lang.id}
                        defaultChecked={watchLanguages.includes(lang.id)}
                        onChange={(e) => {
                          const val = lang.id as "CPP" | "JAVA";
                          const current = form.getValues("allowedLanguages");
                          if (e.target.checked) {
                            form.setValue("allowedLanguages", [...current, val]);
                          } else {
                            form.setValue("allowedLanguages", current.filter(l => l !== val));
                          }
                        }}
                        className="rounded border-[var(--border)] bg-[#0f1118]"
                      />
                      <span>{lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* STEP 4: REVIEW & PUBLISH */}
          {currentStep === 4 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Review Practical</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Review configuration before publishing to students.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[#0f1118] p-4 space-y-2 text-xs">
                <p><strong className="text-white">Title:</strong> {watchTitle}</p>
                <p><strong className="text-white">Class:</strong> {classroomName}</p>
                <p><strong className="text-white">Languages:</strong> {watchLanguages.join(", ")}</p>
                <p><strong className="text-white">Test Cases:</strong> {watchTestCases.filter(test => test.visible).length} visible · {watchTestCases.filter(test => !test.visible).length} hidden</p>
                <p><strong className="text-white">Deadline:</strong> {watchDeadline || "No deadline"}</p>
              </div>
            </div>
          ) : null}

          {/* Stepper Control Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="button button-secondary text-xs"
            >
              Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="button button-brand text-xs"
              >
                <span>Continue to {["Problems", "Configure", "Review"][currentStep - 1]}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSaving || !isReadyToPublish}
                className="button button-brand text-xs"
              >
                Publish Practical
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          {/* Practical Summary Panel */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Practical Summary
              </h3>
              <StatusBadge tone="draft">Draft</StatusBadge>
            </div>

            <div className="space-y-2 text-xs border-t border-[var(--border)] pt-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Class</span>
                <span className="font-semibold text-white">{classroomName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Coding task</span>
                <span className="font-semibold text-white">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Test Cases</span>
                <span className="font-semibold text-white">{watchTestCases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Deadline</span>
                <span className="font-semibold text-white">{watchDeadline || "No deadline"}</span>
              </div>
            </div>
          </div>

          {/* Publishing Checklist */}
          <PublishingChecklist items={checklistItems} />
        </div>
      </div>
    </div>
  );
}
