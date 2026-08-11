# Roadmap

## Sprint 0 — documentation and boundaries

Canonical product, MVP, flow, architecture, evidence/AI, contribution, and decision documents.

**Status:** complete.

## Slice 1 — persisted student attempt loop

- Database-backed seeded practical workspace.
- Server-owned seeded identity boundary plus membership/ownership authorization.
- Resumable server-autosaved draft and numbered coding session.
- Server-owned deterministic mock execution.
- Immutable, idempotent submission/result snapshots.
- Five-event timeline and database-backed teacher progress/review.

**Status:** complete. Real execution, AI, and advanced evidence were intentionally excluded.

## Phase 2A — authentication architecture decision

- Clerk proves identity and session validity.
- Labrix PostgreSQL owns role, status, ownership, membership, and permissions.
- Verified email/password is the first sign-in method; students self-register, while teachers are provisioned by an administrator or invitation process.

**Status:** decision complete. Clerk integration status is tracked in the Phase 2B slices below.

## Phase 2B.1 — provider-neutral local identity foundation

- Add local `ACTIVE`/`DISABLED` account status.
- Add optional provider/subject identity mappings without changing seeded users or runtime identity.
- Keep the fixed demo resolver operational until the authenticated resolver is ready.

**Status:** complete.

## Phase 2B.2 — Clerk integration and authenticated authorization

- Configure Clerk for separate development and production instances.
- Add verified email/password sign-in/sign-up shell, sign-out, and session-expiry handling.
- Resolve the authenticated provider subject to a local user on the server and enforce account status.
- Make the fixed demo resolver unavailable in production.
- Keep the execution provider mocked while identity is hardened.

**Status:** partial. Linked-user resolution is implemented; administrator-controlled teacher provisioning and the final security acceptance pass remain.

## Phase 2B.3 — student join-code onboarding

- Create a local `STUDENT` only after a verified Clerk sign-up reaches the onboarding flow.
- Require a valid classroom join code before creating active membership.
- Make retries transactional and idempotent without linking by email.
- Keep teacher creation administrator-controlled.

**Status:** complete.

## Persisted UI and navigation

- Provide role-aware teacher and student dashboards.
- Use explicit database-backed routes for classes, practicals, progress, submissions, review, and the coding workspace.
- Scope teacher queries by ownership and student queries by active membership and resource ownership.

**Status:** complete for the canonical persisted routes. Known legacy aliases redirect to persisted equivalents, and arbitrary unmatched paths no longer render mock product UI.

## Phase 3C.1 — single-practical authoring lifecycle

- Allow teachers to create and edit the current single-problem practical model.
- Validate publication requirements on the server.
- Block destructive test replacement after persisted student activity exists.

**Status:** complete for the single-problem MVP. Multi-problem authoring and practical versioning remain out of this slice.

## Phase 4A — teacher marks and feedback

- Store one teacher review per immutable submission attempt.
- Use a fixed ten-point marks scale with private draft and student-visible published states.
- Keep review edits separate from immutable source and result snapshots.

**Status:** complete for basic marks and written feedback. Rubrics, weighted grading, and AI feedback remain excluded.

## Phase 5A — hidden tests and suggested grading

- Author visible and optional hidden tests within the single-problem practical.
- Run visible tests only; Submit evaluates both groups while redacting hidden details from students.
- Persist immutable visibility counters and a deterministic equal-weight suggested score without changing teacher-awarded marks.

**Status:** complete with the deterministic simulated provider. Real compilation, weighted grading, and rubrics remain excluded.

## Phase 7A — teacher review queue

- Add an owner-scoped grading queue over persisted immutable attempts.
- Distinguish submissions needing review, private review drafts, and published feedback.
- Show suggested score and teacher-awarded marks separately with simple review-status filters.

**Status:** complete for the existing teacher submissions route. Notifications, rubrics, weighted grading, AI, and real execution remain excluded.

## Phase 8A — teacher roster and join-code controls

- Show active student memberships, join dates, and persisted submission/review summaries.
- Allow only the classroom-owning teacher to deactivate membership access without deleting history.
- Display and regenerate the unique classroom join code with clear invalidation wording.

**Status:** complete for the classroom students/progress route. Reactivation is tracked in Phase 9B; invitations, notifications, and membership audit history remain future work.

## Phase 9B â€” teacher membership reactivation

- Keep inactive students visible to the classroom owner with preserved submission/review summaries.
- Restore access by reactivating the existing unique membership row; do not recreate membership or rewrite historical work.
- Keep reactivation teacher-only and prevent join-code self-reactivation for inactive members.

**Status:** complete for owner-controlled reactivation. Membership auditing is tracked in Phase 10A; invitations and notifications remain future work.

## Phase 10A — membership audit trail

- Record every successful teacher-controlled membership deactivation and reactivation atomically.
- Attribute each entry to the classroom, existing membership, student, acting teacher, action, and server timestamp.
- Show recent entries only to the classroom-owning teacher without exposing them through student read models.

**Status:** complete for membership access changes. Join-code changes, invitations, notifications, free-text reasons, and broader administrative audit events remain future work.

## Phase 11A — practical starter-code templates

- Let teachers persist Java and C++ starter code within the single-problem practical model.
- Initialize each new attempt from the matching language template while preserving every resumed draft unchanged.
- Swap an untouched pre-save template on language selection without changing immutable submission or result behavior.

**Status:** complete for Java and C++ templates. Additional languages, practical versioning, and multi-file starters remain future work.

## Phase 12A — teacher practical analytics

- Summarize the latest published practical from active memberships and each student's latest immutable submission.
- Show deterministic completion, suggested-score, visible/hidden pass-rate, and published-review aggregates.
- Surface neutral attention reasons without exposing hidden test details or private draft feedback.

**Status:** complete on the classroom students/progress route. Historical trend charts, exports, configurable thresholds, and cross-practical comparison remain future work.

## Phase 13A — legacy mock-route retirement

- Replace the client-side catch-all demo with a server redirect/404 quarantine.
- Redirect the old root, classroom-practical-list, and task-submission-history aliases to canonical persisted routes.
- Remove the orphaned hard-coded classroom data and duplicate browser-only execution mock while retaining the active server execution provider and non-production demo identity mode.

**Status:** complete. Canonical routes are explicit and database-backed; unknown paths no longer imitate working product behavior.

## Phase 15A — local Java runner spike

- Keep deterministic mock execution as the default.
- Define an opt-in Java-only HTTP adapter and a bounded contract for a separate local Docker worker.
- Prove compilation, runtime, and timeout behavior only after the Docker daemon and locked-down worker are available.

**Status:** partial scaffolding only. The adapter, configuration boundary, response limits, fail-closed mapping, and focused tests are implemented. The Docker daemon was unavailable during this slice, so no worker or real Java execution is included or claimed.

## Later slices

1. Complete teacher provisioning and authentication security acceptance.
2. Add isolated execution, queues, resource limits, retry policy, and observability.
3. Version deterministic evidence signals and teacher-facing definitions.
4. Add governed AI explanation, feedback drafting, and implementation-specific viva assistance.
5. Pilot hardening: concurrency, deadlines/timezones, retention/deletion, audit, accessibility, backup, and incident paths.

Do not pull screen/webcam recording, gamification, mobile coding, cross-institution plagiarism, broad integrations, or automated verdicts into these slices.
