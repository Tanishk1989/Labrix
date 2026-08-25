"use client";

import type { AllowedLanguage } from "@prisma/client";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Play,
  Send,
} from "lucide-react";
import { startTransition, useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Dialog } from "@/components/dialog";
import { ExecutionModeBadge } from "@/components/execution-mode-badge";
import { sourceAfterLanguageChange } from "@/domain/tasks/starter-code";
import type {
  PersistedRun,
  PersistedSubmission,
  StudentExecutionJob,
  StudentWorkspace,
} from "@/server/attempts/service";
import { executionJobStatusAction, runDraftAction, saveDraftAction, submitDraftAction } from "./actions";
import { draftVersionChanged, type DraftVersion } from "./draft-version";
import {
  clearLocalDraftMirror,
  loadLocalDraftMirror,
  reconcileDraftVersions,
  saveLocalDraftMirror,
  useNetworkOnlineState,
} from "./offline-draft-mirror";
import { StudentHintPanel } from "./student-hint-panel";
import { StudentRunResults } from "./student-run-results";
import { StudentSubmissionVerdict } from "./student-submission-verdict";
import {
  nextWorkspacePanel,
  workspacePanels,
  type WorkspacePanel,
  type WorkspacePanelNavigationKey,
} from "./workspace-panels";

const Editor = dynamic(async () => {
  const { default: MonacoEditor, loader } = await import("@monaco-editor/react");

  // Serve the installed Monaco distribution from this application. The default
  // CDN loader makes the coding workspace depend on third-party network access.
  loader.config({ paths: { vs: "/monaco/vs" } });
  return MonacoEditor;
}, { ssr: false });

type SaveState = "saving" | "saved" | "failed";
const panelIds: Record<WorkspacePanel, string> = {
  problem: "workspace-problem-panel",
  code: "workspace-code-panel",
  results: "workspace-results-panel",
  hints: "workspace-hints-panel",
};

function saveLabel(state: SaveState, isOnline: boolean) {
  if (!isOnline) return "⚡ Offline: Saved locally";
  if (state === "saving") return "Saving changes…";
  if (state === "failed") return "Save failed · Backed up locally";
  return "All changes saved";
}

function languageLabel(language: AllowedLanguage) {
  return language === "CPP" ? "C++" : "Java";
}

function fileName(language: AllowedLanguage) {
  return language === "CPP" ? "main.cpp" : "Main.java";
}

function PlainTextContent({ text, compact = false }: { text: string; compact?: boolean }) {
  const paragraphs = text.trim().split(/\n\s*\n/);
  return (
    <div className={compact ? "workspace-prose workspace-prose-compact" : "workspace-prose"}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}
    </div>
  );
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
  const [executionJob, setExecutionJob] = useState<StudentExecutionJob>();
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [activePanel, setActivePanel] = useState<WorkspacePanel>("code");
  const [workspaceOpenedAt] = useState(() => Date.now());
  const isOnline = useNetworkOnlineState();
  const lastPersisted = useRef<DraftVersion>({
    sourceCode: workspace.draft.sourceCode,
    language: workspace.session.language,
  });
  const latestSave = useRef(0);
  const idempotencyKey = useRef<string | null>(null);
  const templateSwitchAllowed = useRef(workspace.draft.revision === 0);
  const wasOffline = useRef(false);
  const statusPollFailures = useRef(0);

  const showResults = useCallback(() => {
    setActivePanel("results");
    window.requestAnimationFrame(() => {
      document.getElementById(panelIds.results)?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (!executionJob || !["QUEUED", "RUNNING"].includes(executionJob.status)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => startTransition(async () => {
      const result = await executionJobStatusAction({ jobId: executionJob.id });
      if (cancelled) return;
      if (!result.ok) {
        statusPollFailures.current += 1;
        if (statusPollFailures.current < 3) {
          setExecutionJob({ ...executionJob });
          return;
        }
        setRunFailure(result.message);
        setSubmissionFailure(executionJob.kind === "SUBMIT" ? result.message : undefined);
        setRunning(false);
        setSubmitting(false);
        return;
      }
      statusPollFailures.current = 0;
      setExecutionJob(result.job);
      if (result.job.status === "COMPLETED") {
        if (result.job.run) setRun(result.job.run);
        if (result.job.submission) {
          setSubmission(result.job.submission);
          clearLocalDraftMirror(workspace.session.id);
        }
        lastPersisted.current = { sourceCode: source, language };
        templateSwitchAllowed.current = false;
        setSaveState("saved");
        setRunning(false);
        setSubmitting(false);
      } else if (result.job.status === "FAILED") {
        const message = result.job.message ?? "Execution failed after safe retries.";
        if (result.job.kind === "SUBMIT") setSubmissionFailure(message);
        else setRunFailure(message);
        setRunning(false);
        setSubmitting(false);
      }
    }), executionJob.status === "QUEUED" ? 2_000 : 1_500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [executionJob, language, source, workspace.session.id]);

  // Reconcile and restore local offline mirror on initial load
  useEffect(() => {
    const local = loadLocalDraftMirror(workspace.session.id);
    const reconciliation = reconcileDraftVersions(workspace.draft.sourceCode, local);
    if (reconciliation.hasLocalRecovery && reconciliation.recoveredSource) {
      setSource(reconciliation.recoveredSource);
      setSaveMessage("Restored unsaved local draft from offline session.");
    }
  }, [workspace.session.id, workspace.draft.sourceCode]);

  // Auto-sync when reconnecting from offline
  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      const requestedVersion = { sourceCode: source, language };
      if (draftVersionChanged(lastPersisted.current, requestedVersion)) {
        setSaveState("saving");
        saveDraftAction({
          sessionId: workspace.session.id,
          sourceCode: source,
          language,
        }).then((res) => {
          if (res.ok) {
            lastPersisted.current = requestedVersion;
            setSaveState("saved");
            saveLocalDraftMirror(workspace.session.id, {
              sourceCode: source,
              language,
              syncedWithServer: true,
            });
          }
        });
      }
    }
  }, [isOnline, source, language, workspace.session.id]);

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
        templateSwitchAllowed.current = false;
        setSaveState("saved");
        saveLocalDraftMirror(workspace.session.id, {
          sourceCode: source,
          language,
          syncedWithServer: true,
        });
      } else {
        setSaveState("failed");
        setSaveMessage(result.message);
        saveLocalDraftMirror(workspace.session.id, {
          sourceCode: source,
          language,
          syncedWithServer: false,
        });
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [language, source, workspace.session.id]);

  const runCode = useCallback(async () => {
    if (!source.trim()) {
      setRunFailure("Write some code before running tests.");
      showResults();
      return;
    }
    setRunning(true);
    setExecutionJob(undefined);
    setRunFailure(undefined);
    setRun(undefined);
    const result = await runDraftAction({
      sessionId: workspace.session.id,
      sourceCode: source,
      language,
    });
    if (result.ok && result.queued) {
      setExecutionJob(result.job);
    } else if (result.ok) {
      setRun(result.run);
      lastPersisted.current = { sourceCode: source, language };
      templateSwitchAllowed.current = false;
      setSaveState("saved");
    } else {
      setRunFailure(result.message);
    }
    if (!result.ok || !result.queued) setRunning(false);
    showResults();
  }, [language, showResults, source, workspace.session.id]);

  // Keyboard shortcut listener for Ctrl+Enter / Cmd+Enter (Run code) & Ctrl+S (Save)
  useEffect(() => {
    function handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!running && !submitting && !submission) {
          runCode();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        // Force trigger save action
        const requestedVersion = { sourceCode: source, language };
        if (draftVersionChanged(lastPersisted.current, requestedVersion)) {
          setSaveState("saving");
          saveDraftAction({
            sessionId: workspace.session.id,
            sourceCode: source,
            language,
          }).then((res) => {
            if (res.ok) {
              lastPersisted.current = requestedVersion;
              setSaveState("saved");
            } else {
              setSaveState("failed");
            }
          });
        }
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [source, language, running, submitting, submission, workspace.session.id, runCode]);

  async function submitCode() {
    setConfirmSubmit(false);
    if (!source.trim()) {
      setSubmissionFailure("Write some code before submitting your practical.");
      showResults();
      return;
    }
    setSubmitting(true);
    setExecutionJob(undefined);
    setSubmissionFailure(undefined);
    idempotencyKey.current ??= crypto.randomUUID();
    const result = await submitDraftAction({
      sessionId: workspace.session.id,
      sourceCode: source,
      language,
      idempotencyKey: idempotencyKey.current,
    });
    if (result.ok && result.queued) {
      setExecutionJob(result.job);
      lastPersisted.current = { sourceCode: source, language };
      templateSwitchAllowed.current = false;
      setSaveState("saved");
    } else if (result.ok) {
      setSubmission(result.submission);
      setRun(result.submission.result);
      lastPersisted.current = { sourceCode: source, language };
      templateSwitchAllowed.current = false;
      setSaveState("saved");
      clearLocalDraftMirror(workspace.session.id);
    } else {
      setSubmissionFailure(result.message);
    }
    if (!result.ok || !result.queued) setSubmitting(false);
    showResults();
  }

  const closeSubmitDialog = useCallback(() => setConfirmSubmit(false), []);

  function changeLanguage(nextLanguage: AllowedLanguage) {
    const nextSource = sourceAfterLanguageChange({
      sourceCode: source,
      currentLanguage: language,
      nextLanguage,
      starterCodes: workspace.task.starterCodes,
      canReplaceDefault: templateSwitchAllowed.current,
    });
    setLanguage(nextLanguage);
    setSource(nextSource);
  }

  function movePanelFocus(event: KeyboardEvent<HTMLButtonElement>, panel: WorkspacePanel) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextPanel = nextWorkspacePanel(panel, event.key as WorkspacePanelNavigationKey);
    setActivePanel(nextPanel);
    document.getElementById(`workspace-${nextPanel}-tab`)?.focus();
  }

  const deadline = workspace.task.deadline ? new Date(workspace.task.deadline) : null;
  const overdue = Boolean(deadline && deadline.getTime() < workspaceOpenedAt && !submission);

  return (
    <div className="workspace-shell">
      <header className="workspace-toolbar">
        <div className="workspace-title-group">
          <Link className="workspace-back-link" href={`/practicals/${workspace.task.id}`}>
            Back to practical
          </Link>
          <h1 className="workspace-title">{workspace.task.title}</h1>
          <p className="workspace-context">
            <span>{workspace.classroom.name}</span>
            <span aria-hidden="true">·</span>
            {deadline ? (
              <span>
                {overdue ? "Overdue since" : "Due"} <time dateTime={deadline.toISOString()}>{deadline.toLocaleString("en-IN")}</time>
              </span>
            ) : (
              <span>No deadline</span>
            )}
          </p>
        </div>

        <div className="workspace-toolbar-actions">
          <span
            role="status"
            className={`workspace-save-state inline-flex items-center gap-1.5 ${!isOnline ? "text-amber-300" : saveState === "failed" ? "workspace-save-state-failed" : ""}`}
          >
            <span
              className={`size-2 rounded-full ${
                !isOnline
                  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  : saveState === "saving"
                  ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  : saveState === "failed"
                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              }`}
            />
            {saveLabel(saveState, isOnline)}
          </span>
          <span className="workspace-attempt">Attempt #{workspace.session.attemptNumber}</span>
          {workspace.task.allowedLanguages.length > 1 ? (
            <label className="workspace-language-control">
              <span className="sr-only">Language</span>
              <select
                aria-label="Language"
                className="input"
                value={language}
                disabled={Boolean(submission)}
                onChange={(event) => changeLanguage(event.target.value as AllowedLanguage)}
              >
                {workspace.task.allowedLanguages.map((allowed) => (
                  <option value={allowed} key={allowed}>
                    {languageLabel(allowed)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="workspace-language-metadata">{languageLabel(language)}</span>
          )}
          <button
            type="button"
            className="button-secondary workspace-run-button inline-flex items-center gap-1.5"
            onClick={runCode}
            disabled={running || submitting || Boolean(submission)}
            aria-busy={running}
            title="Run visible tests (Ctrl + Enter)"
          >
            {running ? <span className="button-spinner" aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            <span>{running ? (executionJob?.status === "QUEUED" ? "Queued…" : "Running tests…") : "Run tests"}</span>
            <kbd className="hidden sm:inline-flex rounded border border-white/20 bg-black/40 px-1.5 py-0.2 font-mono text-[9px] text-white/70">
              Ctrl+↵
            </kbd>
          </button>
          <button
            type="button"
            className="button workspace-submit-button"
            onClick={() => setConfirmSubmit(true)}
            disabled={running || submitting || Boolean(submission)}
            aria-busy={submitting}
            aria-haspopup="dialog"
            aria-expanded={confirmSubmit}
          >
            {submitting ? <span className="button-spinner" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
            {submitting ? (executionJob?.status === "QUEUED" ? "Submission queued…" : "Submitting…") : "Submit attempt"}
          </button>
        </div>
      </header>

      {saveMessage ? (
        <p role="alert" className="workspace-save-error">
          {saveMessage}
        </p>
      ) : null}

      {overdue ? (
        <p role="status" className="workspace-deadline-warning">
          This deadline has passed. TRACE can still record an attempt; check your teacher’s late-work policy before submitting.
        </p>
      ) : null}

      <nav className="workspace-mobile-tabs" aria-label="Workspace panels" role="tablist">
        {workspacePanels.map((panel) => (
          <button
            type="button"
            role="tab"
            id={`workspace-${panel}-tab`}
            aria-controls={panelIds[panel]}
            aria-selected={activePanel === panel}
            tabIndex={activePanel === panel ? 0 : -1}
            className={activePanel === panel ? "workspace-mobile-tab workspace-mobile-tab-active" : "workspace-mobile-tab"}
            onClick={() => setActivePanel(panel)}
            onKeyDown={(event) => movePanelFocus(event, panel)}
            key={panel}
          >
            {panel[0].toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </nav>

      <div className="workspace-layout">
        <aside
          id={panelIds.problem}
          role="tabpanel"
          aria-labelledby="workspace-problem-tab workspace-problem-heading"
          tabIndex={0}
          className={`workspace-problem ${activePanel === "problem" ? "workspace-panel-active" : ""}`}
        >
          <p className="workspace-eyebrow">Problem</p>
          <h2 id="workspace-problem-heading" className="workspace-section-title">
            {workspace.task.title}
          </h2>
          <PlainTextContent text={workspace.task.instructions} />

          {workspace.task.constraints ? (
            <section className="workspace-problem-section" aria-labelledby="workspace-requirements-heading">
              <h3 id="workspace-requirements-heading" className="workspace-subheading">
                Requirements
              </h3>
              <PlainTextContent text={workspace.task.constraints} compact />
            </section>
          ) : null}

          <section className="workspace-problem-section" aria-labelledby="workspace-visible-tests-heading">
            <h3 id="workspace-visible-tests-heading" className="workspace-subheading">
              Visible tests
            </h3>
            {workspace.task.tests.length ? (
              <div className="workspace-visible-tests">
                {workspace.task.tests.map((test) => (
                <article className="workspace-visible-test" key={test.id}>
                  <h4>Test {test.position}</h4>
                  <dl className="workspace-test-values">
                    <div>
                      <dt>Input</dt>
                      <dd>
                        <pre><code>{test.input || "(empty)"}</code></pre>
                      </dd>
                    </div>
                    <div>
                      <dt>Expected output</dt>
                      <dd>
                        <pre><code>{test.expectedOutput || "(empty)"}</code></pre>
                      </dd>
                    </div>
                  </dl>
                </article>
                ))}
              </div>
            ) : (
              <p className="workspace-results-empty">
                No visible tests are configured. Run will check whether your code executes; Submit may also check hidden tests.
              </p>
            )}
          </section>
        </aside>

        <div className="workspace-developer-area">
          <section
            id={panelIds.code}
            role="tabpanel"
            aria-labelledby="workspace-code-tab workspace-code-heading"
            tabIndex={0}
            className={`workspace-code ${activePanel === "code" ? "workspace-panel-active" : ""}`}
          >
            <div className="workspace-pane-heading">
              <h2 id="workspace-code-heading">Code</h2>
              <span>{fileName(language)}</span>
            </div>
            <div className="workspace-editor">
              <Editor
                height="100%"
                language={language === "CPP" ? "cpp" : "java"}
                value={source}
                onChange={(value) => {
                  const next = value ?? "";
                  setSource(next);
                  saveLocalDraftMirror(workspace.session.id, {
                    sourceCode: next,
                    language,
                    syncedWithServer: false,
                  });
                }}
                onMount={(editor) => {
                  editor.onDidPaste((e) => {
                    const lineSpan = e.range.endLineNumber - e.range.startLineNumber + 1;
                    if (lineSpan > 10) {
                      setSaveMessage(`Large code block (${lineSpan} lines) inserted — recorded in session telemetry.`);
                      setTimeout(() => setSaveMessage(undefined), 3500);
                    }
                  });
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 22,
                  lineNumbers: "on",
                  lineNumbersMinChars: 3,
                  wordWrap: "off",
                  readOnly: Boolean(submission),
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  accessibilitySupport: "auto",
                  bracketPairColorization: { enabled: true },
                  scrollbar: {
                    horizontalScrollbarSize: 8,
                    verticalScrollbarSize: 8,
                  },
                  ariaLabel: "Code editor",
                }}
              />
            </div>
          </section>

          <section
            id={panelIds.results}
            role="tabpanel"
            aria-labelledby="workspace-results-tab workspace-results-heading"
            tabIndex={0}
            className={`workspace-results ${activePanel === "results" ? "workspace-panel-active" : ""}`}
          >
            <div className="workspace-results-heading">
              <h2 id="workspace-results-heading">Results</h2>
              <ExecutionModeBadge mode={run?.executionMode ?? workspace.executionMode} />
              <span>Run gives practice feedback. Submit records this attempt and also checks hidden tests.</span>
            </div>

            {submission ? (
              <StudentSubmissionVerdict
                key={submission.id}
                submission={submission}
                taskId={workspace.task.id}
                visibleTests={workspace.task.tests}
              />
            ) : (
              <StudentRunResults
                key={run?.id ?? (running ? "running" : runFailure ?? "idle")}
                run={run}
                running={running || submitting}
                progress={executionJob}
                failure={runFailure}
                visibleTests={workspace.task.tests}
              />
            )}

            {submissionFailure ? (
              <div role="alert" className="workspace-submit-error">
                <div>
                  <p>Submission failed</p>
                  <span>{submissionFailure}</span>
                </div>
                <button type="button" className="button-secondary" onClick={() => setConfirmSubmit(true)}>
                  Try again
                </button>
              </div>
            ) : null}
          </section>

          <section
            id={panelIds.hints}
            role="tabpanel"
            aria-labelledby="workspace-hints-tab workspace-hints-heading"
            tabIndex={0}
            className={`workspace-results workspace-hints ${activePanel === "hints" ? "workspace-panel-active" : ""}`}
          >
            <StudentHintPanel
              taskId={workspace.task.id}
              codingSessionId={workspace.session.id}
              sourceCode={source}
              language={language}
            />
          </section>
        </div>
      </div>

      {confirmSubmit ? (
        <Dialog
          title="Submit this attempt?"
          description="This permanently records the code currently in your editor as a submission. You cannot edit this attempt after submitting."
          onClose={closeSubmitDialog}
          footer={(
            <>
              <button type="button" className="button-secondary" onClick={closeSubmitDialog}>Cancel</button>
              <button type="button" className="button" onClick={submitCode}>Submit attempt</button>
            </>
          )}
        >
          <dl className="workspace-submit-confirmation">
            <div><dt>Attempt</dt><dd>#{workspace.session.attemptNumber}</dd></div>
            <div><dt>Language</dt><dd>{languageLabel(language)}</dd></div>
          </dl>
          <p className="workspace-submit-confirmation-note">
            Submit checks visible and hidden tests. After it is recorded, you can start a new numbered attempt without changing this one.
          </p>
        </Dialog>
      ) : null}
    </div>
  );
}
