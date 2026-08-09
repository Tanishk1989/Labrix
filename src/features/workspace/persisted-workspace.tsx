"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AllowedLanguage } from "@prisma/client";
import type {
  PersistedRun,
  PersistedSubmission,
  StudentWorkspace,
} from "@/server/attempts/service";
import {
  runDraftAction,
  saveDraftAction,
  submitDraftAction,
} from "./actions";
import { draftVersionChanged, type DraftVersion } from "./draft-version";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
type SaveState = "saving" | "saved" | "failed";

function saveLabel(state: SaveState) {
  if (state === "saving") return "Saving…";
  if (state === "failed") return "Save failed";
  return "Saved to Labrix";
}

function resultLabel(result: PersistedRun) {
  if (result.state !== "completed") return result.errorText ?? "Simulated run failed.";
  if (result.passedTests === result.totalTests) return "Passed all provided tests";
  return `${result.passedTests}/${result.totalTests} provided tests passed`;
}

export function PersistedWorkspace({ workspace }: { workspace: StudentWorkspace }) {
  const [source, setSource] = useState(workspace.draft.sourceCode);
  const [language, setLanguage] = useState<AllowedLanguage>(workspace.session.language);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveMessage, setSaveMessage] = useState<string>();
  const [run, setRun] = useState<PersistedRun>();
  const [runFailure, setRunFailure] = useState<string>();
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<PersistedSubmission>();
  const [submissionFailure, setSubmissionFailure] = useState<string>();
  const lastPersisted = useRef<DraftVersion>({
    sourceCode: workspace.draft.sourceCode,
    language: workspace.session.language,
  });
  const latestSave = useRef(0);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    const requestedVersion = { sourceCode: source, language };
    if (!draftVersionChanged(lastPersisted.current, requestedVersion)) return;

    const requestNumber = latestSave.current + 1;
    latestSave.current = requestNumber;
    setSaveState("saving");
    setSaveMessage(undefined);
    const timer = window.setTimeout(async () => {
      const result = await saveDraftAction({
        sessionId: workspace.session.id,
        sourceCode: source,
        language,
      });
      if (requestNumber !== latestSave.current) return;
      if (result.ok) {
        lastPersisted.current = requestedVersion;
        setSaveState("saved");
      } else {
        setSaveState("failed");
        setSaveMessage(result.message);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [language, source, workspace.session.id]);

  async function runCode() {
    setRunning(true);
    setRunFailure(undefined);
    const result = await runDraftAction({
      sessionId: workspace.session.id,
      sourceCode: source,
      language,
    });
    if (result.ok) {
      setRun(result.run);
      lastPersisted.current = { sourceCode: source, language };
      setSaveState("saved");
    } else {
      setRunFailure(result.message);
    }
    setRunning(false);
  }

  async function submitCode() {
    setSubmitting(true);
    setSubmissionFailure(undefined);
    idempotencyKey.current ??= crypto.randomUUID();
    const result = await submitDraftAction({
      sessionId: workspace.session.id,
      sourceCode: source,
      language,
      idempotencyKey: idempotencyKey.current,
    });
    if (result.ok) {
      setSubmission(result.submission);
      setRun(result.submission.result);
      lastPersisted.current = { sourceCode: source, language };
      setSaveState("saved");
    } else {
      setSubmissionFailure(result.message);
    }
    setSubmitting(false);
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {workspace.classroom.name} / Practical
          </p>
          <h1 className="text-2xl font-semibold">{workspace.task.title}</h1>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Attempt {workspace.session.attemptNumber}
        </span>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="whitespace-pre-wrap">{workspace.task.instructions}</p>
          {workspace.task.constraints && (
            <>
              <h2 className="mt-5 font-semibold">Constraints</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {workspace.task.constraints}
              </p>
            </>
          )}
          <p className="mt-5 text-sm font-medium">
            Deadline: {workspace.task.deadline ? new Date(workspace.task.deadline).toLocaleString() : "No deadline"}
          </p>
          <h2 className="mt-5 font-semibold">Visible tests</h2>
          {workspace.task.tests.map((test) => (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm" key={test.id}>
              <p className="font-medium">Example {test.position}</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs">
                Input: {test.input}{"\n"}Output: {test.expectedOutput}
              </pre>
            </div>
          ))}
        </section>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
            <label className="text-sm">
              Language{" "}
              <select
                aria-label="Language"
                className="ml-2 rounded border px-2 py-1"
                value={language}
                disabled={Boolean(submission)}
                onChange={(event) => setLanguage(event.target.value as AllowedLanguage)}
              >
                {workspace.task.allowedLanguages.map((allowed) => (
                  <option value={allowed} key={allowed}>
                    {allowed === "CPP" ? "C++" : "Java"}
                  </option>
                ))}
              </select>
            </label>
            <span
              role="status"
              className={saveState === "failed" ? "text-xs text-rose-700" : "text-xs text-emerald-700"}
            >
              {saveLabel(saveState)}
            </span>
          </div>
          {saveMessage && <p role="alert" className="border-b bg-rose-50 p-3 text-sm text-rose-700">{saveMessage}</p>}
          <div className="h-[360px]">
            <Editor
              height="100%"
              language={language === "CPP" ? "cpp" : "java"}
              value={source}
              onChange={(value) => setSource(value ?? "")}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14, readOnly: Boolean(submission) }}
            />
          </div>
          <div className="border-t p-3">
            <p className="mb-3 text-xs text-amber-700">
              Simulated execution only — Java and C++ are not compiled in this phase.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="button-secondary" onClick={runCode} disabled={running || submitting || Boolean(submission)}>
                {running ? "Running simulation…" : "Run"}
              </button>
              <button className="button" onClick={submitCode} disabled={running || submitting || Boolean(submission)}>
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
          {runFailure && <p role="alert" className="border-t bg-rose-50 p-4 text-sm text-rose-700">{runFailure}</p>}
          {run && (
            <section className="border-t p-4" aria-label="Simulated result">
              <p className="font-medium">{resultLabel(run)}</p>
              {run.testResults.map((testResult) => (
                <div className="mt-2 flex justify-between rounded bg-slate-50 p-2 text-sm" key={testResult.testId}>
                  <span>{workspace.task.tests.find((test) => test.id === testResult.testId)?.position ?? "Test"}</span>
                  <span className={testResult.passed ? "text-emerald-700" : "text-rose-700"}>
                    {testResult.passed ? "Passed" : `Failed · output: ${testResult.actualOutput}`}
                  </span>
                </div>
              ))}
            </section>
          )}
          {submissionFailure && <p role="alert" className="border-t bg-rose-50 p-4 text-sm text-rose-700">{submissionFailure}</p>}
          {submission && (
            <section className="m-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
              <p className="font-semibold text-emerald-900">Submitted successfully</p>
              <p className="mt-1 text-sm text-emerald-800">
                Immutable attempt {submission.attemptNumber} · {new Date(submission.submittedAt).toLocaleString()}
              </p>
              <div className="mt-3 flex gap-4">
                <Link href={`/submissions/${submission.id}`} className="text-sm font-semibold text-emerald-800 underline underline-offset-2">
                  View persisted submission
                </Link>
                <Link href={`/classes/${workspace.classroom.id}`} className="text-sm font-semibold text-emerald-800 underline underline-offset-2">
                  Return to classroom
                </Link>
              </div>
            </section>
          )}
        </section>
      </div>
    </>
  );
}
