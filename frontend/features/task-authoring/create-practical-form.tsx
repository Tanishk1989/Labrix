"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { ArrowRight, Plus, Trash2, Sparkles } from "lucide-react";
import { PublishingChecklist, Stepper, StatusBadge } from "@/components/design-system";
import { DEFAULT_STARTER_CODES } from "@/domain/tasks/starter-code";
import { type CreatePracticalFormValues } from "./schema";
import { publishTask, saveTaskDraft } from "./actions";
import { deadlineSummary, isFutureLocalDeadline, serializeLocalDeadline } from "./authoring-summary";
import { PRACTICAL_STARTER_TEMPLATES, type PracticalTemplate } from "./starter-templates";

export function CreatePracticalForm({
  classroomId,
  classroomName,
  taskId,
  initialStatus = "DRAFT",
  initialValues,
}: {
  classroomId: string;
  classroomName: string;
  taskId?: string;
  initialStatus?: "DRAFT" | "PUBLISHED";
  initialValues?: Partial<CreatePracticalFormValues>;
}) {
  const router = useRouter();
  const isEditing = Boolean(taskId);
  const isPublished = initialStatus === "PUBLISHED";
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>(
    isEditing ? (isPublished ? "Published" : "Draft loaded") : "Not saved yet",
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreatePracticalFormValues>({
    defaultValues: {
      title: initialValues?.title ?? "",
      instructions: initialValues?.instructions ?? "",
      constraints: initialValues?.constraints ?? "",
      allowedLanguages: initialValues?.allowedLanguages ?? ["CPP", "JAVA"],
      starterCodes: initialValues?.starterCodes ?? DEFAULT_STARTER_CODES,
      deadlineLocal: initialValues?.deadlineLocal ?? "",
      testCases: initialValues?.testCases ?? [],
      maximumMarks: initialValues?.maximumMarks ?? 10,
      rubricCriteria: initialValues?.rubricCriteria ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testCases",
  });
  const rubric = useFieldArray({ control: form.control, name: "rubricCriteria" });

  const [watchTitle, watchInstructions, watchDeadline, watchLanguages, watchTestCases, watchMaximumMarks, watchRubric] = useWatch({
    control: form.control,
    name: ["title", "instructions", "deadlineLocal", "allowedLanguages", "testCases", "maximumMarks", "rubricCriteria"],
  });

  // Publishing Checklist States
  const hasDetails = watchTitle.trim().length > 0 && watchInstructions.trim().length > 0;
  const hasProblems = watchInstructions.trim().length > 0;
  const hasValidTestCases = watchTestCases.every(tc => tc.expectedOutput.trim().length > 0);
  const hasValidDeadline = isFutureLocalDeadline(watchDeadline ?? "");
  const rubricTotal = watchRubric.reduce((sum, item) => sum + (Number(item.maximumMarks) || 0), 0);
  const hasValidRubric = watchRubric.length !== 1 && watchRubric.every((item) => item.title.trim().length > 0) && (watchRubric.length === 0 || rubricTotal === Number(watchMaximumMarks));
  const hasConfig = watchLanguages.length > 0 && Number(watchMaximumMarks) > 0 && hasValidRubric;
  const isReadyToPublish = hasDetails && hasProblems && hasValidTestCases && hasValidDeadline && hasConfig;
  const deadlineLabel = deadlineSummary(watchDeadline ?? "", {
    timeZoneName: "device local time",
  });

  const checklistItems = [
    { label: "Title and instructions added", completed: hasDetails },
    { label: watchTestCases.length ? "All test cases have expected output" : "Tests are optional — none added", completed: hasValidTestCases },
    { label: watchDeadline ? "Deadline is in the future" : "Deadline is optional", completed: hasValidDeadline },
    { label: "Languages and marking are ready", completed: hasConfig },
    { label: "Ready to publish", completed: isReadyToPublish },
  ];

  async function handleSaveDraft() {
    setIsSaving(true);
    setServerError(null);
    const values = form.getValues();
    const submissionValues = {
      ...values,
      deadlineLocal: serializeLocalDeadline(values.deadlineLocal ?? ""),
    };
    const result = await saveTaskDraft(classroomId, taskId, submissionValues);
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
    const submissionValues = {
      ...values,
      deadlineLocal: serializeLocalDeadline(values.deadlineLocal ?? ""),
    };
    const result = await publishTask(classroomId, taskId, submissionValues);
    setIsSaving(false);
    setIsSaving(false);
    if (result.ok) {
      router.push(`/classes/${classroomId}`);
    } else {
      setServerError(result.message);
    }
  }
  function applyTemplate(template: PracticalTemplate) {
    form.setValue("title", template.title, { shouldValidate: true, shouldDirty: true });
    form.setValue("instructions", template.instructions, { shouldValidate: true, shouldDirty: true });
    form.setValue("constraints", template.constraints, { shouldValidate: true, shouldDirty: true });
    form.setValue("maximumMarks", template.maximumMarks, { shouldValidate: true, shouldDirty: true });
    form.setValue("testCases", template.testCases, { shouldValidate: true, shouldDirty: true });
    setSavedAt("Template loaded (draft not saved yet)");
  }

  return (
    <div className="authoring-form space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="mb-1 text-xs text-[var(--text-muted)]">
            <span>Practicals</span> &gt; <span className="text-white font-medium">{isEditing ? "Edit practical" : "Create practical"}</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-white">{isEditing ? "Edit practical" : "Create practical"}</h1>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {isEditing
              ? "Update this programming practical for your class."
              : "Build and configure a programming practical for your class."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs text-[var(--text-muted)]"
            aria-live="polite"
            aria-atomic="true"
          >
            {savedAt}
          </span>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="button button-secondary text-xs"
          >
            {isEditing ? "Save changes" : "Save draft"}
          </button>
        </div>
      </div>

      {/* Stepper Header */}
      <Stepper
        steps={["Details", "Automated tests", "Availability & marking", "Review"]}
        currentStep={currentStep}
      />

      {serverError ? (
        <div role="alert" className="rounded-lg bg-rose-500/10 p-3 text-xs font-semibold text-rose-400 border border-rose-500/20">
          {serverError}
        </div>
      ) : null}

      {/* Form & Side Panel Layout */}
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Left Form Area */}
        <div className="space-y-8 border-y border-[var(--border)] py-7 sm:py-8">
          {/* STEP 1: DETAILS */}
          {currentStep === 1 ? (
            <div className="space-y-5">
              {!isEditing && (
                <div className="rounded-2xl border border-[var(--color-brand)]/20 bg-gradient-to-r from-[var(--color-brand)]/10 via-white/[0.03] to-transparent p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
                    <Sparkles size={14} />
                    <span>Quick-Start with Verified DSA Templates</span>
                  </div>
                  <p className="mt-1 text-xs text-white/60">
                    Click any pre-configured template below to auto-fill title, problem statement, constraints, and test cases instantly:
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {PRACTICAL_STARTER_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => applyTemplate(tmpl)}
                        className="flex flex-col items-start rounded-xl border border-white/10 bg-black/40 p-2.5 text-left transition-all hover:scale-[1.02] hover:border-[var(--color-brand)]/50 hover:bg-white/[0.06]"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-semibold text-white">{tmpl.title}</span>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-white/70">
                            {tmpl.testCases.length} tests
                          </span>
                        </div>
                        <span className="mt-1 text-[10px] text-[var(--color-brand)] font-medium">
                          {tmpl.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-base font-bold text-white">Practical details</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Set the basic information students will see.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Practical title
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
                <label className="block text-xs font-semibold text-slate-300">Student instructions</label>
                <textarea
                  {...form.register("instructions")}
                  rows={4}
                  className="input mt-1.5"
                  placeholder="Shown to students on the practical overview."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Constraints and limits</label>
                <textarea
                  {...form.register("constraints")}
                  rows={3}
                  className="input mt-1.5"
                  placeholder="e.g. 2 ≤ n ≤ 100000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300" htmlFor="practical-deadline">Student deadline (optional)</label>
                <input
                  id="practical-deadline"
                  type="datetime-local"
                  {...form.register("deadlineLocal")}
                  aria-describedby="practical-deadline-help"
                  className="input mt-1.5 max-w-xs"
                />
                <p id="practical-deadline-help" className={`mt-2 ${hasValidDeadline ? "text-[var(--text-muted)]" : "text-amber-300"}`}>
                  {watchDeadline
                    ? hasValidDeadline
                      ? `Students can submit until ${deadlineLabel}.`
                      : "Choose a future date and time before publishing."
                    : "Students can submit without a time limit."}
                </p>
              </div>
            </div>
          ) : null}

          {/* STEP 2: PROBLEMS & TEST CASES */}
          {currentStep === 2 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Automated tests <span className="font-normal text-[var(--text-muted)]">(optional)</span></h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  You can publish without automated tests. Visible tests give students practice feedback when they run code. Hidden tests run only on submission and keep their details private.
                </p>
              </div>

              <div className="space-y-3">
                {fields.length === 0 ? (
                  <p className="border-y border-[var(--border)] py-5 text-xs leading-5 text-[var(--text-muted)]">
                    No tests configured. Students can still run and submit code, but TRACE will not calculate an automated test score.
                  </p>
                ) : null}
                {fields.map((field, index) => (
                  <div key={field.id} className="authoring-test-case space-y-4 border-t border-[var(--border)] py-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-indigo-400">{watchTestCases[index]?.visible ? "Visible" : "Hidden"} test {index + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          <span>Test type</span>
                          <select
                            {...form.register(`testCases.${index}.visible`, {
                              setValueAs: (value) => value === "true",
                            })}
                            className="input min-h-8 py-1 text-xs"
                          >
                            <option value="true">Visible test</option>
                            <option value="false">Hidden test</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          aria-label={`Remove test case ${index + 1}`}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300">Input</label>
                        <textarea
                          {...form.register(`testCases.${index}.input`)}
                          rows={2}
                          className="input mt-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300">Expected output</label>
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
                <span>Add test case</span>
              </button>
            </div>
          ) : null}

          {/* STEP 3: CONFIGURE */}
          {currentStep === 3 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Student availability and marking</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Choose what students can use and how teachers will mark their work.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Languages available to students</label>
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

              <div className="space-y-3 border-t border-[var(--border)] pt-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">What students start with</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">A new student attempt starts with the template for its selected language. Existing saved drafts are never replaced.</p>
                </div>
                {watchLanguages.map((language) => <div key={language}>
                  <label className="block text-xs font-semibold text-slate-300">{language === "CPP" ? "C++ starter code" : "Java starter code"}</label>
                  <textarea
                    {...form.register(`starterCodes.${language}`)}
                    rows={language === "CPP" ? 8 : 7}
                    className="input mt-1 font-mono text-xs leading-5"
                    spellCheck={false}
                  />
                </div>)}
                {watchLanguages.length === 0 ? <p className="text-xs text-amber-300">Select a language to configure its starter code.</p> : null}
              </div>

              <div className="space-y-4 border-t border-[var(--border)] pt-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">How this practical is marked</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Automated test results may provide a suggested score, but teachers award the final marks. Set the total marks and add 2–5 criteria when distinct aspects should be scored separately.</p>
                </div>
                <label className="block text-xs font-semibold text-slate-300">
                  Total marks available
                  <input {...form.register("maximumMarks", { valueAsNumber: true })} type="number" min={1} max={1000} className="input mt-1.5 w-28" />
                </label>
                {rubric.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]">
                    <input {...form.register(`rubricCriteria.${index}.title`)} className="input" aria-label={`Rubric criterion ${index + 1}`} placeholder="e.g. Correctness" />
                    <input {...form.register(`rubricCriteria.${index}.maximumMarks`, { valueAsNumber: true })} type="number" min={1} max={1000} className="input" aria-label={`Marks available for criterion ${index + 1}`} />
                    <button type="button" onClick={() => rubric.remove(index)} className="button button-secondary" aria-label={`Remove rubric criterion ${index + 1}`}><Trash2 size={14} /></button>
                  </div>
                ))}
                {rubric.fields.length < 5 ? (
                  <button type="button" onClick={() => rubric.append({ clientId: `rubric-${rubric.fields.length + 1}`, title: "", maximumMarks: 1 })} className="button button-secondary text-xs"><Plus size={14} /> Add criterion</button>
                ) : null}
                {watchRubric.length === 1 ? <p className="text-xs text-amber-300">Add one more criterion or remove the rubric.</p> : null}
                {watchRubric.length > 0 && rubricTotal !== Number(watchMaximumMarks) ? <p className="text-xs text-amber-300">Criterion marks must total {watchMaximumMarks}.</p> : null}
              </div>
            </div>
          ) : null}

          {/* STEP 4: REVIEW & PUBLISH */}
          {currentStep === 4 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Review before publishing</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Confirm what students can see, what remains teacher-only, and how final marks are awarded.
                </p>
              </div>

              <div className="space-y-3 border-y border-[var(--border)] py-5 text-sm">
                <p><strong className="text-white">Title:</strong> {watchTitle}</p>
                <p><strong className="text-white">Class:</strong> {classroomName}</p>
                <p><strong className="text-white">Languages:</strong> {watchLanguages.length ? watchLanguages.map((language) => language === "CPP" ? "C++" : "Java").join(", ") : "None selected"}</p>
                <p><strong className="text-white">Automated tests:</strong> {watchTestCases.length === 0 ? "None (optional)" : `${watchTestCases.filter(test => test.visible).length} visible · ${watchTestCases.filter(test => !test.visible).length} hidden`}</p>
                <p><strong className="text-white">Student deadline:</strong> {deadlineLabel}</p>
                <p><strong className="text-white">Total marks:</strong> {watchMaximumMarks}</p>
                <p><strong className="text-white">Rubric:</strong> {watchRubric.length ? `${watchRubric.length} criteria` : "Overall mark only"}</p>
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
                <span>Continue to {["Automated tests", "Availability & marking", "Review"][currentStep - 1]}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSaving || !isReadyToPublish}
                className="button button-brand text-xs"
              >
                {isPublished ? "Save and keep published" : "Publish practical"}
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <aside aria-label="Practical publishing context" className="space-y-8 xl:sticky xl:top-24 xl:self-start">
          {/* Teacher-facing practical summary */}
          <section className="space-y-4 border-y border-[var(--border)] py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                At a glance
              </h3>
              <StatusBadge tone={isPublished ? "published" : "draft"}>
                {isPublished ? "Published" : "Draft"}
              </StatusBadge>
            </div>

            <dl className="space-y-3 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Class</dt>
                <dd className="text-right font-semibold text-white">{classroomName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Languages</dt>
                <dd className="font-semibold text-white">{watchLanguages.length ? watchLanguages.map((language) => language === "CPP" ? "C++" : "Java").join(", ") : "None selected"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Automated tests</dt>
                <dd className="font-semibold text-white">{watchTestCases.length || "None"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Student deadline</dt>
                <dd className="text-right font-semibold text-white">{deadlineLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Marking</dt>
                <dd className="text-right font-semibold text-white">{watchMaximumMarks} marks · {watchRubric.length ? `${watchRubric.length} criteria` : "overall mark"}</dd>
              </div>
            </dl>
          </section>

          {/* Publishing Checklist */}
          <PublishingChecklist items={checklistItems} />
        </aside>
      </div>
    </div>
  );
}
