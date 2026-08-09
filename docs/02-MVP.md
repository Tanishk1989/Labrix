# MVP and implementation status

Status reflects repository behavior as of 2026-08-09.

## Implemented

- Next.js/Prisma persistence for users, memberships, classrooms, practicals, and visible tests.
- Teacher classroom creation and practical draft/publish actions.
- Explicit database-backed routes for the seeded student workspace, practical progress, and submission review.
- A server-resolved seeded student/teacher identity boundary that accepts no browser user ID or role.
- Active `CodingSession` plus one mutable `Draft`; server autosave resumes after refresh and exposes Saving, Saved, and Save failed states.
- Server-owned `ServerExecutionProvider` with a deterministic mock implementation.
- Persisted `RunAttempt` and immutable `ResultSnapshot` records.
- Immutable, numbered `SubmissionAttempt` records with exact source/result snapshots and student-scoped idempotency.
- Foundation `CodeEvent` timeline: `SESSION_STARTED`, `DRAFT_SAVED`, `RUN_REQUESTED`, `RUN_COMPLETED`, and `SUBMISSION_CREATED`.
- Teacher-owned review of student, practical, attempt, source, timestamp, simulated result, run count, and ordered timeline.
- Unit, database integration, and critical browser tests.

## Partial

- The actor resolver is non-production and fixed to seeded identities. It enforces service authorization but does not authenticate the person using the browser.
- Only the seeded practical vertical slice uses persisted workspace/submission/review behavior; remaining unmatched product paths may still use the legacy catch-all.
- Classroom cards/overview still show placeholder submission totals rather than querying persisted attempts.
- Practical authoring lacks complete editing/list management and release/version semantics.
- Draft conflict handling is server-last-write-wins; offline and multi-device recovery are not implemented.

## Mock

- Execution derives outcomes from source markers such as `fail_test`, `compile_error`, and `runtime_error`. Java/C++ are not compiled.
- The role selector is session-scoped presentation preview, not authentication or authorization.
- Remaining catch-all pages, including legacy “my submissions” and practical-list variants, retain demo behavior.

## Planned

- Production authentication, account lifecycle, and authenticated actor resolution.
- Isolated production execution with queues, limits, retries, and observability.
- Persisted attempt-aware classroom summary counts and complete submission navigation.
- Versioned deterministic evidence signals beyond the five foundation events.
- AI-assisted explanation, feedback drafting, evidence summaries, and implementation-specific viva guidance with provenance and human review.
- Concurrency, retention/deletion, deadline/timezone, accessibility, and operations hardening.

## Out of scope for the MVP

- Screen recording, webcam monitoring, keystroke biometrics, or hidden surveillance.
- Gamification or mobile coding support.
- Cross-institution plagiarism matching.
- Automated cheating verdicts, guilt scores, or automatic copy/paste blocking.
- Broad integrations, social/chat features, or autonomous grading.

