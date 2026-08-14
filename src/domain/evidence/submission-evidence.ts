export const submissionEvidenceEventTypes = [
  "SESSION_STARTED",
  "DRAFT_SAVED",
  "RUN_REQUESTED",
  "RUN_COMPLETED",
  "SUBMISSION_CREATED",
] as const;

export type SubmissionEvidenceEventType =
  (typeof submissionEvidenceEventTypes)[number];

export type EvidenceFact<T> =
  | {
      availability: "AVAILABLE";
      value: T;
      explanation: string;
    }
  | {
      availability: "UNAVAILABLE";
      value: null;
      explanation: string;
    };

export type SubmissionEvidenceFactsV1 = {
  schemaVersion: 1;
  runCount: EvidenceFact<number>;
  tests: {
    overall: EvidenceFact<{ passed: number; total: number }>;
    visible: EvidenceFact<{ passed: number; total: number }>;
    hidden: EvidenceFact<{ passed: number; total: number }>;
  };
  suggestedScore: EvidenceFact<number>;
  timingStatus: EvidenceFact<"ON_TIME" | "LATE">;
  practicalVersion: EvidenceFact<number>;
  executionMode: EvidenceFact<
    "SIMULATED" | "JAVA_DOCKER_LOCAL" | "CPP_DOCKER_LOCAL"
  >;
  sessionToSubmissionMs: EvidenceFact<number>;
  timeToFirstRunMs: EvidenceFact<number>;
  submissionMatchesLatestSuccessfulRun: EvidenceFact<boolean>;
  draftSavedAfterLatestSuccessfulRun: EvidenceFact<boolean>;
  largeSourceSizeJumps: EvidenceFact<
    ReadonlyArray<{
      fromEventSequence: number;
      toEventSequence: number;
      characterDelta: number;
    }>
  >;
  eventCounts: Record<SubmissionEvidenceEventType, number>;
};

type EvidenceRun = {
  id: string;
  sequence: number;
  sourceCodeSnapshot: string;
  requestedAt: Date;
  completedAt: Date | null;
  resultSnapshot: {
    state:
      | "COMPLETED"
      | "COMPILATION_ERROR"
      | "RUNTIME_ERROR"
      | "TIME_LIMIT_EXCEEDED"
      | "INTERNAL_ERROR";
    passedTests: number;
    totalTests: number;
  } | null;
};

type SubmissionEvidenceBuilderInput = {
  submission: {
    sourceCodeSnapshot: string;
    submittedAt: Date;
    timingStatus: "ON_TIME" | "LATE" | null;
    practicalVersion: number | null;
    resultRunAttemptId: string;
  };
  result: {
    executionMode:
      | "SIMULATED"
      | "JAVA_DOCKER_LOCAL"
      | "CPP_DOCKER_LOCAL"
      | null;
    passedTests: number;
    totalTests: number;
    visiblePassedTests: number | null;
    visibleTotalTests: number | null;
    hiddenPassedTests: number | null;
    hiddenTotalTests: number | null;
    suggestedScore: number | null;
  };
  session: {
    startedAt: Date;
    runs: EvidenceRun[];
    events: Array<{
      sequence: number;
      type: SubmissionEvidenceEventType;
      occurredAt: Date;
    }>;
  };
};

function available<T>(value: T, explanation: string): EvidenceFact<T> {
  return { availability: "AVAILABLE", value, explanation };
}

function unavailable<T>(explanation: string): EvidenceFact<T> {
  return { availability: "UNAVAILABLE", value: null, explanation };
}

function elapsedFact(
  start: Date | null,
  end: Date,
  explanation: string,
  missingExplanation: string,
): EvidenceFact<number> {
  if (!start) return unavailable(missingExplanation);
  const elapsed = end.getTime() - start.getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    return unavailable(
      "The stored timestamps do not form a valid chronological interval.",
    );
  }
  return available(elapsed, explanation);
}

function validTestSummary(passed: number | null, total: number | null) {
  return (
    passed !== null &&
    total !== null &&
    Number.isInteger(passed) &&
    Number.isInteger(total) &&
    passed >= 0 &&
    total >= 0 &&
    passed <= total
  );
}

/**
 * Builds versioned facts only from persisted submission/session records.
 * It does not infer intent, misconduct, or any academic decision.
 */
export function buildSubmissionEvidenceFacts(
  input: SubmissionEvidenceBuilderInput,
): SubmissionEvidenceFactsV1 {
  const eventCounts = Object.fromEntries(
    submissionEvidenceEventTypes.map((type) => [type, 0]),
  ) as Record<SubmissionEvidenceEventType, number>;
  for (const event of input.session.events) eventCounts[event.type] += 1;

  const runs = [...input.session.runs].sort(
    (left, right) => left.sequence - right.sequence,
  );
  const firstRun = runs[0] ?? null;
  const latestSuccessfulRun = runs
    .filter(
      (run) =>
        run.id !== input.submission.resultRunAttemptId &&
        run.completedAt !== null &&
        run.resultSnapshot?.state === "COMPLETED" &&
        run.resultSnapshot.totalTests > 0 &&
        run.resultSnapshot.passedTests === run.resultSnapshot.totalTests,
    )
    .at(-1);

  const sourceMatch = latestSuccessfulRun
    ? available(
        latestSuccessfulRun.sourceCodeSnapshot ===
          input.submission.sourceCodeSnapshot,
        "Compares the immutable submission source with the latest pre-submission run that completed and passed every test it evaluated.",
      )
    : unavailable<boolean>(
        "No pre-submission run completed and passed every test it evaluated.",
      );

  const draftSavedAfterSuccessfulRun = latestSuccessfulRun?.completedAt
    ? available(
        input.session.events.some(
          (event) =>
            event.type === "DRAFT_SAVED" &&
            event.occurredAt > latestSuccessfulRun.completedAt! &&
            event.occurredAt <= input.submission.submittedAt,
        ),
        "True when at least one DRAFT_SAVED event was recorded after the latest successful pre-submission run and no later than submission. A draft save may reflect a source or language change.",
      )
    : unavailable<boolean>(
        "No successful pre-submission run is available as the comparison point.",
      );

  const overallTests = validTestSummary(
    input.result.passedTests,
    input.result.totalTests,
  )
    ? available(
        {
          passed: input.result.passedTests,
          total: input.result.totalTests,
        },
        "Uses the immutable result snapshot's overall counters.",
      )
    : unavailable<{ passed: number; total: number }>(
        "The immutable result snapshot does not contain valid overall counters.",
      );

  const visibleTests = validTestSummary(
    input.result.visiblePassedTests,
    input.result.visibleTotalTests,
  )
    ? available(
        {
          passed: input.result.visiblePassedTests!,
          total: input.result.visibleTotalTests!,
        },
        "Uses the immutable result snapshot's visible-test counters.",
      )
    : unavailable<{ passed: number; total: number }>(
        "Visible-test counters were not stored for this legacy result snapshot.",
      );

  const hiddenTests = validTestSummary(
    input.result.hiddenPassedTests,
    input.result.hiddenTotalTests,
  )
    ? available(
        {
          passed: input.result.hiddenPassedTests!,
          total: input.result.hiddenTotalTests!,
        },
        "Uses the immutable result snapshot's hidden-test aggregate counters; test inputs and outputs are not part of this fact.",
      )
    : unavailable<{ passed: number; total: number }>(
        "Hidden-test counters were not stored for this legacy result snapshot.",
      );

  return {
    schemaVersion: 1,
    runCount: available(
      runs.length,
      "Counts all persisted RunAttempt records for the coding session, including the submission evaluation.",
    ),
    tests: {
      overall: overallTests,
      visible: visibleTests,
      hidden: hiddenTests,
    },
    suggestedScore:
      input.result.suggestedScore === null
        ? unavailable(
            "A suggested score was not stored for this legacy result snapshot.",
          )
        : available(
            input.result.suggestedScore,
            "Uses the stored deterministic equal-weight suggested score; it does not replace teacher-awarded marks.",
          ),
    timingStatus:
      input.submission.timingStatus === null
        ? unavailable(
            "Submission timing was not stored for this legacy attempt.",
          )
        : available(
            input.submission.timingStatus,
            "Uses the server-classified timing stored on the immutable submission.",
          ),
    practicalVersion:
      input.submission.practicalVersion === null
        ? unavailable(
            "The practical version was not stored for this legacy attempt.",
          )
        : available(
            input.submission.practicalVersion,
            "Uses the practical version captured on the immutable submission.",
          ),
    executionMode:
      input.result.executionMode === null
        ? unavailable(
            "Execution mode was not stored for this legacy result snapshot.",
          )
        : available(
            input.result.executionMode,
            "Uses the execution provider mode captured on the immutable result snapshot.",
          ),
    sessionToSubmissionMs: elapsedFact(
      input.session.startedAt,
      input.submission.submittedAt,
      "Elapsed server time from the coding session start to immutable submission creation.",
      "The coding session start time is unavailable.",
    ),
    timeToFirstRunMs: firstRun
      ? elapsedFact(
          input.session.startedAt,
          firstRun.requestedAt,
          "Elapsed server time from coding session start to the first persisted run request.",
          "The coding session start time is unavailable.",
        )
      : unavailable("No persisted run request is available."),
    submissionMatchesLatestSuccessfulRun: sourceMatch,
    draftSavedAfterLatestSuccessfulRun: draftSavedAfterSuccessfulRun,
    largeSourceSizeJumps: unavailable(
      "Current CodeEvent records do not store source-size deltas, and Draft retains only the latest value, so source-size jumps cannot be reconstructed.",
    ),
    eventCounts,
  };
}
