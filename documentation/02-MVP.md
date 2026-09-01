# MVP and implementation status

Status reflects repository behavior as of 2026-08-27.

## Implemented

- Next.js/Prisma persistence for users, memberships, classrooms, practicals, and optional visible/hidden tests.
- Teacher classroom creation and practical draft/publish actions, including editable Java and C++ starter-code templates.
- Explicit database-backed routes for the seeded student workspace, practical progress, and submission review.
- A server-resolved seeded student/teacher identity boundary that accepts no browser user ID or role.
- Active `CodingSession` plus one mutable `Draft`; the first draft uses the practical's language-specific starter template, while change-aware server autosave resumes saved work without overwriting it, skips identical updates, and exposes Saving, Saved, and Save failed states.
- Server-owned `ServerExecutionProvider` with a deterministic mock implementation.
- Durable PostgreSQL execution jobs for production Run/Submit, with leased worker claims, bounded retry, worker heartbeat, queue position, refresh-safe active-job recovery, and idempotent result/submission finalization on a separate Google Cloud worker.
- Minimal public liveness health plus bearer-protected runtime diagnostics for database, runner, worker, queue-age, failure, capacity, and release checks.
- Fail-closed 40–50 student capacity and pre-class verification commands with explicit web, runner, worker-capacity, backup, restore-drill, and authenticated-smoke gates.
- Persisted `RunAttempt` and immutable `ResultSnapshot` records.
- Run evaluates visible tests only; Submit evaluates visible and hidden tests. Students receive visible details plus a hidden aggregate, while the owning teacher can inspect both groups.
- New result snapshots store visible/hidden counters and a one-decimal, equal-weight suggested test score out of ten. This never overwrites teacher-awarded marks; legacy snapshots remain readable.
- Immutable, numbered `SubmissionAttempt` records with exact source/result snapshots and student-scoped idempotency.
- Foundation `CodeEvent` timeline: `SESSION_STARTED`, `DRAFT_SAVED`, `RUN_REQUESTED`, `RUN_COMPLETED`, and `SUBMISSION_CREATED`.
- Teacher-owned review of student, practical, attempt, source, timestamp, simulated result, run count, and ordered timeline.
- Teacher-owned marks and feedback are stored separately for each immutable attempt. Each practical defines its maximum mark and may define a small 2–5 criterion rubric. Published reviews require written feedback and confirmation; every save creates an append-only review revision. Drafts and history remain teacher-only, while only the current published review is visible to the owning student.
- Teacher-owned classroom summaries count distinct active students with at least one immutable submission for the latest published practical.
- Teacher-owned classroom roster controls show active and inactive memberships, join dates, immutable-attempt/review summaries, recent owner-attributed access audit entries, and the current copyable join code. Teachers may deactivate or reactivate the same membership row without deleting historical records, and may regenerate the unique join code, invalidating the previous code.
- Owner-scoped teacher dashboard, practical list, submission queue, and progress views use persisted classroom, membership, practical, attempt, result, and event data without screenshot fixtures or automated review verdicts. Progress presents submission coverage, **Passed all provided tests**, and published teacher review as separate dimensions.
- Membership-scoped student dashboard, classroom/practical views, submission history, progress, workspace, and immutable attempt result views use the same persisted records.
- Provider-neutral local identity persistence: `User.accountStatus` and optional `ExternalIdentity` mappings with database uniqueness by provider/subject and local user/provider.
- Clerk SDK, Next.js 16 proxy integration, public sign-in/sign-up shell, sign-out/account control, and server-side Clerk session adapter.
- A provider-neutral `resolveCurrentActor()` maps a server-verified Clerk subject to an explicitly linked local user and enforces local account status and role before existing resource authorization.
- Controlled local/admin identity linking by explicit TRACE user ID and verified Clerk subject; no email matching or public linking endpoint.
- Unit, database integration, and critical browser tests.
- Canonical persisted navigation for dashboard, classrooms, practicals, progress, submissions, workspace, and teacher review. Known legacy list/history URLs redirect to persisted equivalents; arbitrary unmatched URLs no longer render hard-coded product data.

## Partial

- Production authentication remains incomplete until a security acceptance pass. Clerk teacher identities are provisioned only from administrator-controlled public metadata and become active through the signed lifecycle webhook. An unlinked Clerk student can create a local STUDENT account only by presenting a valid classroom join code.
- Resolver mode is explicit: `demo` retains fixed actors for local/test use and is rejected in deployed production; the supervised loopback-only professor-demo launcher may acknowledge it solely to serve an optimized local build. `clerk` never falls back to demo.
- Practical authoring lacks complete editing/list management and release/version semantics.
- Draft conflict handling is server-last-write-wins; offline and multi-device recovery are not implemented.
- A separate, loopback-only local Java worker compiles once and runs tests in a fresh locked-down Docker container per request. It is single-flight, explicitly opt-in through `java-http`, and verified for success, compiler failure, runtime failure, and timeout through both its HTTP boundary and the existing workspace Run/Submit persistence service. It is not the selected production execution system.

## Mock

- The default execution provider derives outcomes from source markers such as `fail_test`, `compile_error`, and `runtime_error`. C++ is not compiled; Java compilation requires explicit local `java-http` opt-in.
- In explicit demo mode, **Preview as teacher/student** is session-scoped presentation preview, not authentication or authorization. It is shown only where both demo views are available; role-specific pages remain tied to their fixed demo actor. Clerk mode hides it.

## Planned

- Clerk email invitations, MFA, and social-login acceptance remain outside this slice. Signed Clerk lifecycle webhooks and administrator-controlled public metadata handle teacher provisioning.
- Complete staging capacity validation and operational alert delivery for the isolated production queue.
- Versioned deterministic evidence signals beyond the five foundation events.
- External AI-assisted explanation and feedback generation. The MVP ships deterministic source-based oral-defense prompts without sending student code to a third party.
- Concurrency, retention/deletion, deadline/timezone, accessibility, and operations hardening.

## Out of scope for the MVP

- Screen recording, webcam monitoring, keystroke biometrics, or hidden surveillance.
- Gamification or mobile coding support.
- Cross-institution plagiarism matching.
- Automated cheating verdicts, guilt scores, or automatic copy/paste blocking.
- Broad integrations, social/chat features, or autonomous grading.
