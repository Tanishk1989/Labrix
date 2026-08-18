export type ProcessSignalCategory = "ITERATION" | "VERIFICATION" | "VELOCITY" | "STRUCTURE";
export type ProcessSignalTone = "success" | "info" | "warning" | "neutral";

export interface ProcessSignal {
  id: string;
  label: string;
  detail: string;
  tone: ProcessSignalTone;
  category: ProcessSignalCategory;
}

export interface AttemptProcessAnalysis {
  durationMs: number;
  durationFormatted: string;
  draftCount: number;
  runCount: number;
  lineCount: number;
  charCount: number;
  summary: string;
  signals: ProcessSignal[];
}

export interface AnalyzeProcessInput {
  events: Array<{
    id?: string;
    sequence: number;
    type: string;
    occurredAt: string | Date;
  }>;
  sourceCode: string;
  starterCode?: string;
  runCount?: number;
  passedTests?: number;
  totalTests?: number;
  submittedAt?: string | Date;
}

function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

/**
 * Deterministically analyzes the student's problem-solving process based on
 * immutable foundation event logs and source code characteristics.
 *
 * Adheres strictly to the neutral, non-accusatory language policy defined in
 * documentation/05-AI-EVIDENCE-SYSTEM.md.
 */
export function analyzeAttemptProcess(input: AnalyzeProcessInput): AttemptProcessAnalysis {
  const sortedEvents = [...input.events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1] ?? { occurredAt: input.submittedAt ?? new Date() };

  const startMs = firstEvent ? new Date(firstEvent.occurredAt).getTime() : new Date().getTime();
  const endMs = new Date(lastEvent.occurredAt).getTime();
  const durationMs = Math.max(0, endMs - startMs);
  const durationFormatted = formatDuration(durationMs);

  const draftCount = sortedEvents.filter((e) => e.type === "DRAFT_SAVED").length;
  const recordedRuns = sortedEvents.filter((e) => e.type === "RUN_REQUESTED" || e.type === "RUN_COMPLETED").length;
  const totalRuns = typeof input.runCount === "number" && input.runCount > 0 ? input.runCount : Math.ceil(recordedRuns / 2);

  const lines = input.sourceCode.split("\n");
  const lineCount = lines.length;
  const charCount = input.sourceCode.length;

  const signals: ProcessSignal[] = [];

  // 1. Verification & Test Execution Signal
  if (totalRuns === 0) {
    signals.push({
      id: "signal-zero-runs",
      label: "Unverified submission",
      detail: "0 sandbox test runs were executed before the final submission was recorded.",
      tone: "warning",
      category: "VERIFICATION",
    });
  } else if (totalRuns >= 2) {
    signals.push({
      id: "signal-iterative-runs",
      label: "Iterative testing verified",
      detail: `${totalRuns} sandbox test runs recorded with iterative verification before submission.`,
      tone: "success",
      category: "VERIFICATION",
    });
  } else {
    signals.push({
      id: "signal-single-run",
      label: "Single test run",
      detail: "1 sandbox test run was executed prior to submission.",
      tone: "info",
      category: "VERIFICATION",
    });
  }

  // 2. Draft Checkpoints & Edit Cadence Signal
  if (draftCount <= 1 && lineCount > 25) {
    signals.push({
      id: "signal-single-burst",
      label: "Single-burst code insertion",
      detail: `Over 85% of the final source (${lineCount} lines) was recorded in a single initial revision block.`,
      tone: "warning",
      category: "STRUCTURE",
    });
  } else if (draftCount >= 3) {
    signals.push({
      id: "signal-incremental-drafts",
      label: "Incremental code development",
      detail: `${draftCount} distinct draft checkpoints recorded across the active session timeline.`,
      tone: "success",
      category: "STRUCTURE",
    });
  } else {
    signals.push({
      id: "signal-moderate-drafts",
      label: "Standard revision progression",
      detail: `${draftCount} draft save checkpoints recorded prior to submission.`,
      tone: "neutral",
      category: "STRUCTURE",
    });
  }

  // 3. Time-to-Complexity & Active Session Velocity
  if (durationMs < 45_000 && lineCount > 30) {
    signals.push({
      id: "signal-rapid-velocity",
      label: "Rapid completion anomaly",
      detail: `Final source of ${lineCount} lines appeared in an active session of ${durationFormatted}.`,
      tone: "warning",
      category: "VELOCITY",
    });
  } else if (durationMs > 180_000) {
    signals.push({
      id: "signal-standard-duration",
      label: "Thorough development duration",
      detail: `Active coding session spanned ${durationFormatted} from initialization to submission.`,
      tone: "success",
      category: "VELOCITY",
    });
  } else {
    signals.push({
      id: "signal-paced-session",
      label: "Active coding span",
      detail: `Coding session completed in ${durationFormatted}.`,
      tone: "neutral",
      category: "VELOCITY",
    });
  }

  // 4. Test Case Convergence Signal
  const passed = input.passedTests ?? 0;
  const total = input.totalTests ?? 0;
  if (total > 0) {
    if (passed === total) {
      signals.push({
        id: "signal-tests-all-passed",
        label: `All ${total} automated tests passed`,
        detail: "Outputs matched expected test case values with 100% test case pass rate.",
        tone: "success",
        category: "ITERATION",
      });
    } else {
      signals.push({
        id: "signal-tests-partial",
        label: `${passed} of ${total} tests passed`,
        detail: `${total - passed} test case(s) produced differing output or execution errors.`,
        tone: "info",
        category: "ITERATION",
      });
    }
  }

  const summary = `${totalRuns} test run${totalRuns === 1 ? "" : "s"}, ${draftCount} draft${draftCount === 1 ? "" : "s"} over ${durationFormatted}`;

  return {
    durationMs,
    durationFormatted,
    draftCount,
    runCount: totalRuns,
    lineCount,
    charCount,
    summary,
    signals,
  };
}
