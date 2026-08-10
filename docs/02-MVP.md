# MVP and implementation status

Status reflects repository behavior as of 2026-08-09.

## Implemented

- Next.js/Prisma persistence for users, memberships, classrooms, practicals, and visible tests.
- Teacher classroom creation and practical draft/publish actions.
- Explicit database-backed routes for the seeded student workspace, practical progress, and submission review.
- A server-resolved seeded student/teacher identity boundary that accepts no browser user ID or role.
- Active `CodingSession` plus one mutable `Draft`; change-aware server autosave resumes after refresh, skips identical updates, and exposes Saving, Saved, and Save failed states.
- Server-owned `ServerExecutionProvider` with a deterministic mock implementation.
- Persisted `RunAttempt` and immutable `ResultSnapshot` records.
- Immutable, numbered `SubmissionAttempt` records with exact source/result snapshots and student-scoped idempotency.
- Foundation `CodeEvent` timeline: `SESSION_STARTED`, `DRAFT_SAVED`, `RUN_REQUESTED`, `RUN_COMPLETED`, and `SUBMISSION_CREATED`.
- Teacher-owned review of student, practical, attempt, source, timestamp, simulated result, run count, and ordered timeline.
- Teacher-owned classroom summaries count distinct active students with at least one immutable submission for the latest published practical.
- Owner-scoped teacher dashboard, practical list, submission queue, and progress views use persisted classroom, membership, practical, attempt, result, and event data without screenshot fixtures or automated review verdicts.
- Membership-scoped student dashboard, classroom/practical views, submission history, progress, workspace, and immutable attempt result views use the same persisted records.
- Provider-neutral local identity persistence: `User.accountStatus` and optional `ExternalIdentity` mappings with database uniqueness by provider/subject and local user/provider.
- Clerk SDK, Next.js 16 proxy integration, public sign-in/sign-up shell, sign-out/account control, and server-side Clerk session adapter.
- A provider-neutral `resolveCurrentActor()` maps a server-verified Clerk subject to an explicitly linked local user and enforces local account status and role before existing resource authorization.
- Controlled local/admin identity linking by explicit Labrix user ID and verified Clerk subject; no email matching or public linking endpoint.
- Unit, database integration, and critical browser tests.

## Partial

- Production authentication remains incomplete until a security acceptance pass and administrator-controlled teacher provisioning. An unlinked Clerk student can create a local STUDENT account only by presenting a valid classroom join code.
- Resolver mode is explicit: `demo` retains fixed actors for local/test use and is rejected in production; `clerk` never falls back to demo.
- Only the seeded practical vertical slice uses persisted workspace/submission/review behavior; remaining unmatched product paths may still use the legacy catch-all.
- Practical authoring lacks complete editing/list management and release/version semantics.
- Draft conflict handling is server-last-write-wins; offline and multi-device recovery are not implemented.

## Mock

- Execution derives outcomes from source markers such as `fail_test`, `compile_error`, and `runtime_error`. Java/C++ are not compiled.
- In explicit demo mode, the role selector is session-scoped presentation preview, not authentication or authorization. Clerk mode hides it.
- Remaining catch-all pages, including legacy “my submissions” and practical-list variants, retain demo behavior.

## Planned

- Automatic local `STUDENT` creation after verified Clerk sign-up and classroom membership through a valid join code.
- Administrator-controlled teacher provisioning. Email invitations, webhooks, MFA, and social login remain outside this slice.
- Isolated production execution with queues, limits, retries, and observability.
- Complete task/submission navigation beyond the seeded vertical slice.
- Versioned deterministic evidence signals beyond the five foundation events.
- AI-assisted explanation, feedback drafting, evidence summaries, and implementation-specific viva guidance with provenance and human review.
- Concurrency, retention/deletion, deadline/timezone, accessibility, and operations hardening.

## Out of scope for the MVP

- Screen recording, webcam monitoring, keystroke biometrics, or hidden surveillance.
- Gamification or mobile coding support.
- Cross-institution plagiarism matching.
- Automated cheating verdicts, guilt scores, or automatic copy/paste blocking.
- Broad integrations, social/chat features, or autonomous grading.
