# MVP and implementation status

Status reflects repository behavior as of 2026-08-14.

## Implemented

- Next.js/Prisma persistence for users, memberships, classrooms, practicals, and visible/hidden tests.
- Teacher classroom creation and practical draft/publish actions, including editable Java and C++ starter-code templates.
- Explicit database-backed routes for the seeded student workspace, practical progress, and submission review.
- A server-resolved seeded student/teacher identity boundary that accepts no browser user ID or role.
- Active `CodingSession` plus one mutable `Draft`; the first draft uses the practical's language-specific starter template, while change-aware server autosave resumes saved work without overwriting it, skips identical updates, and exposes Saving, Saved, and Save failed states.
- Server-owned `ServerExecutionProvider` with a deterministic mock implementation.
- Persisted `RunAttempt` and immutable `ResultSnapshot` records.
- Run evaluates visible tests only; Submit evaluates visible and hidden tests. Students receive visible details plus a hidden aggregate, while the owning teacher can inspect both groups.
- New result snapshots store visible/hidden counters and a one-decimal, equal-weight suggested test score out of ten. This never overwrites teacher-awarded marks; legacy snapshots remain readable.
- Immutable, numbered `SubmissionAttempt` records with exact source/result snapshots and student-scoped idempotency.
- Foundation `CodeEvent` timeline: `SESSION_STARTED`, `DRAFT_SAVED`, `RUN_REQUESTED`, `RUN_COMPLETED`, and `SUBMISSION_CREATED`.
- Versioned deterministic submission evidence facts for the owner-scoped teacher review: run/test summaries, stored timing/version/execution provenance, session timing, pre-submission successful-run comparison, draft-save timing, event counts, and explicit unavailable legacy fields. Source-size jumps remain unavailable because current events do not retain the required metadata.
- Teacher-only deterministic integrity review signals map available evidence facts to `LOW_ATTENTION`, `REVIEW_RECOMMENDED`, or `HIGH_REVIEW_PRIORITY` with neutral reasons. They prioritize review or viva only and never assert cheating, guilt, plagiarism, or an academic decision.
- A teacher may request a transient, structured review brief for one owned immutable submission. The Phase AI-2 v1 workflow introduced the in-process fake provider and returns an editable/discardable approach summary, edge-case prompts, deterministic evidence explanation, three viva questions with expected-answer bullets, one modification task, constructive feedback draft, and explicit non-persisted provenance.
- Provider selection remains fake by default. Explicit `groq` configuration enables a fetch-based prototype/demo adapter with a fixed endpoint, minimized allowlisted input, structured output, timeout, bounded errors, and the same transient teacher-only contract. Generation stays a one-submission teacher click with a process-local per-teacher single-flight guard; no automatic, bulk, queued, or student-triggered path exists.
- Teacher-owned review of student, practical, attempt, source, timestamp, simulated result, run count, and ordered timeline.
- Teacher-owned marks and feedback are stored separately for each immutable attempt; drafts remain teacher-only and published reviews are visible only to the owning student.
- Teacher-owned classroom summaries count distinct active students with at least one immutable submission for the latest published practical.
- Teacher-owned classroom roster controls show active and inactive memberships, join dates, immutable-attempt/review summaries, recent owner-attributed access audit entries, and the current copyable join code. Teachers may deactivate or reactivate the same membership row without deleting historical records, and may regenerate the unique join code, invalidating the previous code.
- Owner-scoped teacher dashboard, practical list, submission queue, and progress views use persisted classroom, membership, practical, attempt, result, and event data without screenshot fixtures or automated review verdicts.
- Membership-scoped student dashboard, classroom/practical views, submission history, progress, workspace, and immutable attempt result views use the same persisted records.
- Provider-neutral local identity persistence: `User.accountStatus` and optional `ExternalIdentity` mappings with database uniqueness by provider/subject and local user/provider.
- Clerk SDK, Next.js 16 proxy integration, public sign-in/sign-up shell, sign-out/account control, and server-side Clerk session adapter.
- A provider-neutral `resolveCurrentActor()` maps a server-verified Clerk subject to an explicitly linked local user and enforces local account status and role before existing resource authorization.
- Controlled local/admin identity linking by explicit Labrix user ID and verified Clerk subject; no email matching or public linking endpoint.
- Guarded administrator teacher provisioning creates a new active teacher or links an explicitly selected active teacher to a Clerk subject without email matching or student promotion.
- Unit, database integration, and critical browser tests.
- Canonical persisted navigation for dashboard, classrooms, practicals, progress, submissions, workspace, and teacher review. Known legacy list/history URLs redirect to persisted equivalents; arbitrary unmatched URLs no longer render hard-coded product data.

## Partial

- Production authentication still requires a security acceptance pass and operational secret-management procedure. An unlinked Clerk student can create a local STUDENT account only by presenting a valid classroom join code.
- Resolver mode is explicit: `demo` retains fixed actors for local/test use and is rejected in production; `clerk` never falls back to demo.
- Practical authoring lacks complete editing/list management and release/version semantics.
- Draft conflict handling is server-last-write-wins; offline and multi-device recovery are not implemented.
- A separate, loopback-only local Java worker compiles once and runs tests in a fresh locked-down Docker container per request. It is single-flight, explicitly opt-in through `java-http`, and verified for success, compiler failure, runtime failure, and timeout through both its HTTP boundary and the existing workspace Run/Submit persistence service. It is not the selected production execution system.

## Mock

- The default execution provider derives outcomes from source markers such as `fail_test`, `compile_error`, and `runtime_error`. C++ is not compiled; Java compilation requires explicit local `java-http` opt-in.
- The deterministic in-process fake remains the default AI review provider and is the only provider used by tests. The opt-in Groq adapter is a prototype/demo integration, not an institutional production provider.
- In explicit demo mode, the role selector is session-scoped presentation preview, not authentication or authorization. Clerk mode hides it.

## Planned

- Automatic local `STUDENT` creation after verified Clerk sign-up and classroom membership through a valid join code.
- Administrator-controlled teacher provisioning. Email invitations, webhooks, MFA, and social login remain outside this slice.
- Isolated production execution with queues, limits, retries, and observability.
- Additional evidence event fields and signal policies beyond the Phase AI-1 review-priority rules.
- Institutional AI provider/model selection, documented residency/retention/training guarantees, evaluation, cost controls, and production prompt-injection hardening beyond the prototype Groq boundary.
- Concurrency, retention/deletion, deadline/timezone, accessibility, and operations hardening.

## Out of scope for the MVP

- Screen recording, webcam monitoring, keystroke biometrics, or hidden surveillance.
- Gamification or mobile coding support.
- Cross-institution plagiarism matching.
- Automated cheating verdicts, guilt scores, or automatic copy/paste blocking.
- Broad integrations, social/chat features, or autonomous grading.
