import { CheckCircle2, CircleX } from "lucide-react";
import { ExecutionModeBadge } from "@/components/execution-mode-badge";
import type { ExecutionModeDisclosure } from "@/domain/execution/execution-mode";

type TeacherTestResult = {
  testId: string;
  position: number | null;
  visibility: "VISIBLE" | "HIDDEN";
  input: string | null;
  expectedOutput: string | null;
  actualOutput: string;
  passed: boolean;
};

export function SubmissionTestResults({
  result,
}: {
  result: {
    executionMode: ExecutionModeDisclosure;
    passedTests: number;
    totalTests: number;
    visiblePassedTests: number;
    visibleTotalTests: number;
    hiddenPassedTests: number;
    hiddenTotalTests: number;
    suggestedScore: number;
    errorText: string | null;
    testResults: TeacherTestResult[];
  };
}) {
  return (
    <section aria-labelledby="test-results-heading" className="border-y border-[var(--border)]">
      <header className="flex flex-wrap items-start justify-between gap-4 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="test-results-heading" className="text-base font-semibold text-[var(--text-primary)]">
              Tests
            </h2>
            <ExecutionModeBadge mode={result.executionMode} />
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            Recorded test results for this submission attempt.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {result.totalTests > 0 ? `${result.passedTests} / ${result.totalTests} passed` : "No tests configured"}
          </p>
          {result.totalTests > 0 ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Suggested {result.suggestedScore.toFixed(1)}/10
            </p>
          ) : null}
        </div>
      </header>

      {result.errorText ? (
        <pre className="overflow-x-auto border-t border-[var(--border)] bg-rose-500/5 p-4 text-xs leading-5 text-rose-300">
          {result.errorText}
        </pre>
      ) : null}

      <dl className="grid grid-cols-2 gap-5 border-t border-[var(--border)] py-4 text-sm">
        <div>
          <dt className="text-[var(--text-muted)]">Visible tests</dt>
          <dd className="mt-1 font-semibold text-[var(--text-primary)]">
            {result.visibleTotalTests > 0 ? `${result.visiblePassedTests}/${result.visibleTotalTests} passed` : "Not configured"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Hidden tests</dt>
          <dd className="mt-1 font-semibold text-[var(--text-primary)]">
            {result.hiddenTotalTests > 0 ? `${result.hiddenPassedTests}/${result.hiddenTotalTests} passed` : "Not configured"}
          </dd>
        </div>
      </dl>

      {result.testResults.length ? (
        <ol className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {result.testResults.map((test, index) => (
            <li key={`${test.testId}-${index}`} className="py-4">
              <div className="flex items-start gap-3">
                {test.passed ? (
                  <CheckCircle2 size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-400" />
                ) : (
                  <CircleX size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-rose-400" />
                )}
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Test {test.position ?? index + 1}: {test.passed ? "Pass" : "Fail"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {test.visibility === "HIDDEN" ? "Hidden teacher-only case" : "Visible case"}
                  </p>
                </div>
              </div>
              <dl className="mt-4 grid gap-4 pl-7 text-sm 2xl:grid-cols-3">
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">Input</dt>
                  <dd><pre className="mt-1 overflow-x-auto text-[var(--text-secondary)]">{test.input ?? "(legacy snapshot)"}</pre></dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">Expected</dt>
                  <dd><pre className="mt-1 overflow-x-auto text-[var(--text-secondary)]">{test.expectedOutput ?? "(legacy snapshot)"}</pre></dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">Actual</dt>
                  <dd><pre className="mt-1 overflow-x-auto text-[var(--text-secondary)]">{test.actualOutput || "(no output)"}</pre></dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-t border-[var(--border)] py-5 text-xs text-[var(--text-muted)]">
          {result.totalTests > 0
            ? "No per-test output was stored for this result."
            : "This practical was published without automated tests."}
        </p>
      )}
    </section>
  );
}
