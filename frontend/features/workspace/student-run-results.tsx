"use client";

import { CheckCircle2, CircleX, LoaderCircle, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { triggerVictoryMoment } from "@/components/victory-effects";
import type { PersistedRun, StudentWorkspace } from "@/server/attempts/service";
import {
  createRunPanelState,
  type StudentRunResultViewModel,
} from "./run-result-view-model";

type VisibleWorkspaceTest = StudentWorkspace["task"]["tests"][number];

export function ExecutionResultDetails({
  result,
  announceOutcome = true,
}: {
  result: StudentRunResultViewModel;
  announceOutcome?: boolean;
}) {
  const initialTestId = result.tests.find((test) => !test.passed)?.id ?? result.tests[0]?.id;
  const [selectedTestId, setSelectedTestId] = useState(initialTestId);
  const selectedTest = result.tests.find((test) => test.id === selectedTestId) ?? result.tests[0];
  const OutcomeIcon = result.tone === "success" ? CheckCircle2 : result.tone === "danger" ? CircleX : TriangleAlert;

  useEffect(() => {
    if (result.tone === "success" && result.tests.length > 0) {
      triggerVictoryMoment();
    }
  }, [result.tone, result.tests.length]);

  return (
    <div className="workspace-run-result">
      <div
        className={`workspace-run-outcome workspace-run-outcome-${result.tone}`}
        role={announceOutcome ? "status" : undefined}
        aria-live={announceOutcome ? "polite" : undefined}
        aria-atomic={announceOutcome ? "true" : undefined}
      >
        <OutcomeIcon size={18} aria-hidden="true" />
        <div>
          <p>{result.title}</p>
          <span>{result.detail}</span>
        </div>
      </div>

      {result.diagnostic ? (
        <section className="workspace-diagnostics" aria-labelledby="workspace-diagnostics-heading">
          <h3 id="workspace-diagnostics-heading">{result.diagnosticLabel ?? "Execution details"}</h3>
          <pre><code>{result.diagnostic}</code></pre>
        </section>
      ) : null}

      {result.tests.length > 0 ? (
        <div className="workspace-run-tests">
          <div className="workspace-test-navigator" aria-label="Visible test results">
            <p>Visible tests</p>
            <ul>
              {result.tests.map((test) => {
                const selected = selectedTest?.id === test.id;
                return (
                  <li key={test.id}>
                    <button
                      type="button"
                      id={`run-${test.id}-button`}
                      aria-pressed={selected}
                      className={selected ? "workspace-test-button workspace-test-button-selected" : "workspace-test-button"}
                      onClick={() => setSelectedTestId(test.id)}
                    >
                      {test.passed ? (
                        <CheckCircle2 size={14} className="workspace-test-pass" aria-hidden="true" />
                      ) : (
                        <CircleX size={14} className="workspace-test-fail" aria-hidden="true" />
                      )}
                      <span>{test.label}</span>
                      <span>{test.passed ? "Passed" : "Failed"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selectedTest ? (
            <section className="workspace-selected-test" aria-labelledby={`run-${selectedTest.id}-button`}>
              <h3>{selectedTest.label} details</h3>
              <dl>
                {selectedTest.input !== undefined ? (
                  <div>
                    <dt>Input</dt>
                    <dd><pre><code>{selectedTest.input || "(empty)"}</code></pre></dd>
                  </div>
                ) : null}
                {selectedTest.expectedOutput !== undefined ? (
                  <div>
                    <dt>Expected output</dt>
                    <dd><pre><code>{selectedTest.expectedOutput || "(empty)"}</code></pre></dd>
                  </div>
                ) : null}
                <div>
                  <dt>Your output</dt>
                  <dd><pre><code>{selectedTest.actualOutput || "(empty)"}</code></pre></dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function StudentRunResults({
  run,
  running,
  failure,
  visibleTests,
}: {
  run?: PersistedRun;
  running: boolean;
  failure?: string;
  visibleTests: VisibleWorkspaceTest[];
}) {
  const panelState = createRunPanelState({ run, running, failure, visibleTests });

  if (panelState.kind === "running") {
    return (
      <div className="workspace-run-pending" role="status" aria-live="polite">
        <LoaderCircle size={16} aria-hidden="true" />
        <div>
          <p>Running visible tests…</p>
          <span>TRACE is checking your code against the visible tests.</span>
        </div>
      </div>
    );
  }

  if (panelState.kind === "request_error") {
    return (
      <div className="workspace-run-request-error" role="alert">
        <TriangleAlert size={16} aria-hidden="true" />
        <div>
          <p>Run could not start</p>
          <span>{panelState.message}</span>
        </div>
      </div>
    );
  }

  if (panelState.kind === "idle") {
    return <p className="workspace-results-empty">Select “Run visible tests” for practice feedback. Submit only when you want to record this attempt.</p>;
  }

  return <ExecutionResultDetails result={panelState.result} />;
}
