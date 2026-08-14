import { Info } from "lucide-react";
import type {
  EvidenceFact,
  SubmissionEvidenceFactsV1,
} from "@/domain/evidence/submission-evidence";

function factLabel<T>(
  fact: EvidenceFact<T>,
  format: (value: T) => string,
) {
  return fact.availability === "AVAILABLE"
    ? format(fact.value)
    : "Unavailable";
}

function durationLabel(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const executionModeLabels = {
  SIMULATED: "Simulated execution",
  JAVA_DOCKER_LOCAL: "Java Docker runner",
  CPP_DOCKER_LOCAL: "C++ Docker runner",
} as const;

function EvidenceRow({
  label,
  value,
  explanation,
}: {
  label: string;
  value: string;
  explanation: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[var(--text-muted)]" title={explanation}>
        {label}
      </dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}

export function SubmissionEvidenceSection({
  facts,
}: {
  facts: SubmissionEvidenceFactsV1;
}) {
  const events = Object.entries(facts.eventCounts).filter(
    ([, count]) => count > 0,
  );

  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-heading">Evidence</h2>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Deterministic facts · schema v{facts.schemaVersion}
          </p>
        </div>
        <span className="status-badge status-neutral">Teacher only</span>
      </div>

      <dl className="mt-4 space-y-3 text-xs">
        <EvidenceRow
          label="Runs recorded"
          value={factLabel(facts.runCount, String)}
          explanation={facts.runCount.explanation}
        />
        <EvidenceRow
          label="All tests"
          value={factLabel(
            facts.tests.overall,
            ({ passed, total }) => `${passed}/${total} passed`,
          )}
          explanation={facts.tests.overall.explanation}
        />
        <EvidenceRow
          label="Visible tests"
          value={factLabel(
            facts.tests.visible,
            ({ passed, total }) => `${passed}/${total} passed`,
          )}
          explanation={facts.tests.visible.explanation}
        />
        <EvidenceRow
          label="Hidden tests"
          value={factLabel(
            facts.tests.hidden,
            ({ passed, total }) => `${passed}/${total} passed`,
          )}
          explanation={facts.tests.hidden.explanation}
        />
        <EvidenceRow
          label="Suggested score"
          value={factLabel(
            facts.suggestedScore,
            (score) => `${score.toFixed(1)}/10`,
          )}
          explanation={facts.suggestedScore.explanation}
        />
        <EvidenceRow
          label="Deadline timing"
          value={factLabel(facts.timingStatus, (status) =>
            status === "ON_TIME" ? "On time" : "Late",
          )}
          explanation={facts.timingStatus.explanation}
        />
        <EvidenceRow
          label="Practical version"
          value={factLabel(
            facts.practicalVersion,
            (version) => `Version ${version}`,
          )}
          explanation={facts.practicalVersion.explanation}
        />
        <EvidenceRow
          label="Execution mode"
          value={factLabel(
            facts.executionMode,
            (mode) => executionModeLabels[mode],
          )}
          explanation={facts.executionMode.explanation}
        />
        <EvidenceRow
          label="Session to submission"
          value={factLabel(facts.sessionToSubmissionMs, durationLabel)}
          explanation={facts.sessionToSubmissionMs.explanation}
        />
        <EvidenceRow
          label="Time to first run"
          value={factLabel(facts.timeToFirstRunMs, durationLabel)}
          explanation={facts.timeToFirstRunMs.explanation}
        />
        <EvidenceRow
          label="Matches latest successful run"
          value={factLabel(
            facts.submissionMatchesLatestSuccessfulRun,
            (matches) => (matches ? "Yes" : "No"),
          )}
          explanation={
            facts.submissionMatchesLatestSuccessfulRun.explanation
          }
        />
        <EvidenceRow
          label="Draft saved after successful run"
          value={factLabel(
            facts.draftSavedAfterLatestSuccessfulRun,
            (saved) => (saved ? "Yes" : "No"),
          )}
          explanation={facts.draftSavedAfterLatestSuccessfulRun.explanation}
        />
        <EvidenceRow
          label="Large source-size jumps"
          value={factLabel(
            facts.largeSourceSizeJumps,
            (jumps) => String(jumps.length),
          )}
          explanation={facts.largeSourceSizeJumps.explanation}
        />
      </dl>

      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          Recorded events
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {events.length ? (
            events.map(([type, count]) => (
              <span className="count-chip" key={type}>
                {type.replaceAll("_", " ").toLowerCase()} · {count}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">
              No foundation events recorded.
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 p-3">
        <Info
          size={14}
          className="mt-0.5 shrink-0 text-blue-400"
          aria-hidden="true"
        />
        <p className="text-[11px] leading-5 text-[var(--text-secondary)]">
          These facts describe persisted records for teacher judgment. They do
          not determine misconduct or change marks.
        </p>
      </div>
    </section>
  );
}
