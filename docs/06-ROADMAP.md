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

**Status:** complete. Real authentication, execution, AI, and advanced evidence were intentionally excluded.

## Phase 2A — authentication architecture decision

- Clerk proves identity and session validity.
- Labrix PostgreSQL owns role, status, ownership, membership, and permissions.
- Verified email/password is the first sign-in method; students self-register, while teachers are provisioned by an administrator or invitation process.

**Status:** decision complete. Clerk is approved but not integrated.

## Phase 2B.1 — provider-neutral local identity foundation

- Add local `ACTIVE`/`DISABLED` account status.
- Add optional provider/subject identity mappings without changing seeded users or runtime identity.
- Keep the fixed demo resolver operational until the authenticated resolver is ready.

**Status:** implemented. Authentication UI and sessions remain planned.

## Phase 2B.2 — Clerk integration and authenticated authorization

- Install and configure Clerk for separate development and production instances.
- Add verified email/password sign-in/sign-up shell, sign-out, and session-expiry handling.
- Resolve the authenticated provider subject to a local user on the server and enforce account status.
- Make the fixed demo resolver unavailable in production.
- Apply reusable authorization to every current and remaining route.
- Add cross-classroom, cross-student, expired-session, and account-status tests.
- Keep the execution provider mocked while identity is hardened.

**Status:** implemented for explicitly linked existing users and the persisted vertical slice. Production authentication remains partial pending onboarding and security acceptance.

## Next authentication slice — student onboarding

- Create a local `STUDENT` only after a verified Clerk sign-up reaches an explicit onboarding flow.
- Require a valid classroom join code before creating active membership.
- Make retries transactional and idempotent without linking by email.
- Define administrator-controlled teacher provisioning separately.

**Status:** planned. No automatic user, membership, or teacher creation exists yet.

## Later slices

1. Replace remaining catch-all task/submission paths and complete broader task/submission navigation.
2. Add isolated execution, queues, resource limits, retry policy, and observability.
3. Version deterministic evidence signals and teacher-facing definitions.
4. Add governed AI explanation, feedback drafting, and implementation-specific viva assistance.
5. Pilot hardening: concurrency, deadlines/timezones, retention/deletion, audit, accessibility, backup, and incident paths.

Do not pull screen/webcam recording, gamification, mobile coding, cross-institution plagiarism, broad integrations, or automated verdicts into these slices.
