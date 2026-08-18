import { describe, expect, it } from "vitest";
import { analyzeAttemptProcess } from "../../backend/server/evidence/integrity-engine";

describe("Deterministic Integrity Engine (05-AI-EVIDENCE-SYSTEM.md)", () => {
  it("flags zero-run blind submissions neutrally", () => {
    const analysis = analyzeAttemptProcess({
      events: [
        { sequence: 1, type: "SESSION_STARTED", occurredAt: new Date("2026-08-18T10:00:00Z") },
        { sequence: 2, type: "DRAFT_SAVED", occurredAt: new Date("2026-08-18T10:01:00Z") },
        { sequence: 3, type: "SUBMISSION_CREATED", occurredAt: new Date("2026-08-18T10:01:10Z") },
      ],
      sourceCode: "int main() { return 0; }",
      runCount: 0,
      passedTests: 3,
      totalTests: 3,
    });

    expect(analysis.runCount).toBe(0);
    const zeroRunSignal = analysis.signals.find((s) => s.id === "signal-zero-runs");
    expect(zeroRunSignal).toBeDefined();
    expect(zeroRunSignal?.tone).toBe("warning");
    expect(zeroRunSignal?.label).toBe("Unverified submission");
  });

  it("identifies single-burst large code insertion", () => {
    const longCode = Array.from({ length: 45 }, (_, i) => `int var_${i} = ${i};`).join("\n");
    const analysis = analyzeAttemptProcess({
      events: [
        { sequence: 1, type: "SESSION_STARTED", occurredAt: new Date("2026-08-18T10:00:00Z") },
        { sequence: 2, type: "DRAFT_SAVED", occurredAt: new Date("2026-08-18T10:00:15Z") },
        { sequence: 3, type: "SUBMISSION_CREATED", occurredAt: new Date("2026-08-18T10:00:20Z") },
      ],
      sourceCode: longCode,
      runCount: 1,
      passedTests: 2,
      totalTests: 2,
    });

    const burstSignal = analysis.signals.find((s) => s.id === "signal-single-burst");
    expect(burstSignal).toBeDefined();
    expect(burstSignal?.tone).toBe("warning");

    const velocitySignal = analysis.signals.find((s) => s.id === "signal-rapid-velocity");
    expect(velocitySignal).toBeDefined();
  });

  it("recognizes genuine iterative test and debug workflow", () => {
    const analysis = analyzeAttemptProcess({
      events: [
        { sequence: 1, type: "SESSION_STARTED", occurredAt: new Date("2026-08-18T10:00:00Z") },
        { sequence: 2, type: "DRAFT_SAVED", occurredAt: new Date("2026-08-18T10:05:00Z") },
        { sequence: 3, type: "RUN_REQUESTED", occurredAt: new Date("2026-08-18T10:06:00Z") },
        { sequence: 4, type: "RUN_COMPLETED", occurredAt: new Date("2026-08-18T10:06:05Z") },
        { sequence: 5, type: "DRAFT_SAVED", occurredAt: new Date("2026-08-18T10:10:00Z") },
        { sequence: 6, type: "RUN_REQUESTED", occurredAt: new Date("2026-08-18T10:11:00Z") },
        { sequence: 7, type: "RUN_COMPLETED", occurredAt: new Date("2026-08-18T10:11:05Z") },
        { sequence: 8, type: "DRAFT_SAVED", occurredAt: new Date("2026-08-18T10:14:00Z") },
        { sequence: 9, type: "SUBMISSION_CREATED", occurredAt: new Date("2026-08-18T10:15:00Z") },
      ],
      sourceCode: "int main() { return 0; }",
      runCount: 2,
      passedTests: 4,
      totalTests: 4,
    });

    expect(analysis.draftCount).toBe(3);
    expect(analysis.runCount).toBe(2);
    expect(analysis.durationFormatted).toBe("15m 0s");

    const iterativeSignal = analysis.signals.find((s) => s.id === "signal-iterative-runs");
    expect(iterativeSignal?.tone).toBe("success");

    const incrementalSignal = analysis.signals.find((s) => s.id === "signal-incremental-drafts");
    expect(incrementalSignal?.tone).toBe("success");
  });
});
