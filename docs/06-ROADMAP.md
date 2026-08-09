# Roadmap

The sequence keeps the MVP narrow and converts the current demo into one real end-to-end workflow before broadening features.

## Sprint 0 — documentation and boundaries

- Establish product, MVP, flow, architecture, evidence/AI, contribution, and decision documents.
- Record the hybrid persisted/mock state and safety constraints.
- Resolve the identity, evidence-retention, execution-provider, and AI-data decisions needed for implementation.

**Status:** documentation in progress; no product implementation belongs in this sprint task.

## Slice 1 — persisted student attempt loop

For one seeded classroom and practical, replace the demo workspace path with a database-backed coding session: load the published practical, autosave/resume a student draft, call the existing mock provider through a server-owned boundary, submit a new immutable attempt with result snapshots, store a minimal approved event timeline, and show that attempt plus deterministic facts in teacher review.

Keep the demo actor temporarily if necessary, but enforce server-side membership/ownership helpers so real authentication can replace the actor cleanly. Do not add AI or real execution in this slice.

## Slice 2 — real identity and authorization

- Add the selected authentication approach.
- Replace demo role/actors with authenticated user context.
- Apply reusable teacher ownership and student membership checks to every read/write.
- Add integration tests for cross-classroom and cross-student access denial.

## Slice 3 — isolated execution

- Implement a production `ExecutionProvider` adapter to the selected isolated runner.
- Add queues/job states, limits, idempotency, result normalization, retries, and operational visibility.
- Retain only the approved execution metadata and immutable submission snapshots.

## Slice 4 — teacher evidence and viva assistance

- Version deterministic evidence rules and show facts/definitions in review.
- Add neutral summaries, teacher-editable feedback drafts, and implementation-specific viva generation through a replaceable AI adapter.
- Add provenance, redaction, failure fallback, and evaluation coverage.

## Pilot hardening

- Accessibility, concurrency, deadline/timezone, retention/deletion, audit, backup/restore, and incident-path testing.
- Remove remaining mock/catch-all product routes and stale CodeClass naming through an explicit product decision.
- Validate the complete classroom-to-review journey with pilot teachers.

## Later, not MVP

Do not pull screen/webcam recording, gamification, mobile coding, cross-institution plagiarism, broad integrations, or automated verdicts into these slices.

