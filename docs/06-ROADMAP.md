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

**Status:** implemented for the primary routes. Remaining unmatched legacy catch-all routes still need retirement.

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

## Later slices

1. Complete teacher provisioning, authentication security acceptance, and remaining legacy-route retirement.
2. Add isolated execution, queues, resource limits, retry policy, and observability.
3. Version deterministic evidence signals and teacher-facing definitions.
4. Add governed AI explanation, feedback drafting, and implementation-specific viva assistance.
5. Pilot hardening: concurrency, deadlines/timezones, retention/deletion, audit, accessibility, backup, and incident paths.

Do not pull screen/webcam recording, gamification, mobile coding, cross-institution plagiarism, broad integrations, or automated verdicts into these slices.
