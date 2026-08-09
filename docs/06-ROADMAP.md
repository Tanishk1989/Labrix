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

## Recommended next slice — production identity and authorization

- Select and implement authentication/account lifecycle.
- Replace fixed demo actors with authenticated server session resolution.
- Apply reusable authorization to every current and remaining route.
- Add cross-classroom, cross-student, expired-session, and account-status tests.
- Keep the execution provider mocked while identity is hardened.

## Later slices

1. Replace remaining catch-all task/submission paths and complete broader task/submission navigation.
2. Add isolated execution, queues, resource limits, retry policy, and observability.
3. Version deterministic evidence signals and teacher-facing definitions.
4. Add governed AI explanation, feedback drafting, and implementation-specific viva assistance.
5. Pilot hardening: concurrency, deadlines/timezones, retention/deletion, audit, accessibility, backup, and incident paths.

Do not pull screen/webcam recording, gamification, mobile coding, cross-institution plagiarism, broad integrations, or automated verdicts into these slices.
