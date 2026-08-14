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

**Status:** complete as scaffolding. The adapter, configuration boundary, response limits, fail-closed mapping, and focused tests are implemented. Phase 15B supplies the local worker proof; this phase did not claim production execution.

## Phase 15B — local Docker Java runner worker

- Add a separate loopback worker without putting Java, Docker, shell, or child-process execution in Next.js.
- Create one disposable locked-down Java 21 container per request, compile once, and run ordered test inputs under fixed local limits.
- Prove success, compilation error, runtime error, and timeout through the HTTP boundary without touching PostgreSQL.
- Keep the deterministic mock provider as the default and keep C++, AI, grading, persistence, and authorization unchanged.

**Status:** complete for the opt-in local single-flight proof. Production provider selection, queueing, concurrency, observability, retry/outage behavior, broader abuse testing, and C++ remain future decisions/work.

## Phase 15C — Java runner workspace acceptance

- Exercise the existing workspace Run and Submit services with default provider resolution configured explicitly as `java-http`.
- Persist and verify Java success, compilation error, runtime error, and timeout across `RunAttempt` and immutable `ResultSnapshot` records.
- Confirm Run remains visible-only, Submit evaluates visible and hidden tests while redacting hidden detail from the student result, and an unset provider still selects mock.
- Provide guarded targeted and manual acceptance paths that refuse the shared development/demo database.

**Status:** complete for the disposable-database, non-Playwright acceptance proof. The default provider remains mock; C++, production execution operations, and UI browser automation remain outside this slice.

## Phase 15D — execution mode disclosure

- Describe the selected server provider as `simulated` or `java-docker-local` without changing provider selection or runner behavior.
- Return the mode with fresh Run and newly created Submit results and show **Simulated execution** or **Java Docker runner** in the workspace.
- Show **Execution mode unavailable** for persisted submission and teacher-review snapshots because the current schema does not store provider identity.
- Keep mock as the default and never derive a historical mode from language or the current environment.

**Status:** complete for runtime disclosure and the safe historical fallback. Persisting provider provenance would require a separate schema and lifecycle decision.

## Phase 16A — C++ runner planning spike

- Confirm the language-neutral application and persistence contract can carry C++ without schema changes.
- Add an explicit loopback-only `cpp-http` provider scaffold and a C++-literal bounded protocol without changing Java execution.
- Keep mock as default and disclose the opt-in mode as **C++ runner scaffold**, not as real execution.
- Document native-code threats and defer shared worker extraction until it can be validated against a real C++ sandbox.

**Status:** complete as planning and fail-closed scaffolding only. No C++ worker, compiler image, Docker execution, start script, or end-to-end acceptance exists.

## Phase 16B — local Docker C++ runner worker

- Add a separate loopback-only C++ worker without invoking `g++`, native binaries, Docker, a shell, or child processes from Next.js.
- Compile once and run ordered inputs inside one fresh, non-root, resource-bounded, network-disabled container per request.
- Keep source storage non-executable, place only the compiled binary on a small executable tmpfs, and force cleanup on every result path.
- Prove success, compilation error, runtime error, timeout, fixed-limit validation, and single-flight rejection without PostgreSQL.
- Keep mock as default, `cpp-http` explicitly opt-in, and the Java runner unchanged.

**Status:** complete for the local single-flight Docker proof. C++ workspace persistence acceptance, production isolation review, stricter runtime seccomp, queues/concurrency, observability, and broader native-code abuse testing remain future work.

## Phase 16C — C++ runner workspace acceptance

- Exercise the existing Run and Submit services with explicit `cpp-http` provider selection against the local Docker worker.
- Persist and verify C++ success, compilation error, runtime error, and timeout through `RunAttempt` and immutable `ResultSnapshot` records.
- Confirm Run remains visible-only, Submit evaluates visible and hidden tests, student output redacts hidden detail, and unset provider selection remains mock.
- Require the existing explicit disposable-database guard and avoid Playwright/shared data.

**Status:** complete for guarded service/persistence acceptance. Manual browser acceptance, production execution operations, and broader native-code abuse testing remain outside this slice.

## Phase 17A — persist execution mode

- Add nullable enum storage to immutable result snapshots for simulated, Java Docker, and C++ Docker execution.
- Persist the active provider mode for every new snapshot and reuse it in fresh and reloaded Run/Submit detail DTOs.
- Leave all historical rows null without backfill or language/environment inference, preserving **Execution mode unavailable** as the honest fallback.
- Verify mock/Java/C++ storage, student/teacher disclosure, legacy fallback, and unchanged hidden-detail redaction.

**Status:** complete with additive nullable storage. No runner, grading, submission, review, authorization, analytics, membership, or hidden-test behavior changes.

## Phase 18A — production runner safety

- Keep mock as the default in every environment.
- Reject the local Java and C++ HTTP adapters in production unless an explicit, exact operator-acknowledgment flag is present.
- Preserve the unauthenticated HTTP loopback restriction even when that production exception is acknowledged.
- Return actionable configuration errors for missing, malformed, remote, authenticated, or production-disallowed local runner settings.
- Document that no production execution provider exists yet.

**Status:** complete at the provider-configuration boundary. The override is an exceptional acknowledgment, not production certification; a future production provider still requires a separate decision and implementation.

## Phase 19A — runner request guard

- Guard the shared Run/Submit service boundary before execution-provider dispatch.
- Reject overlapping work for the same student and coding session, and apply a short cooldown between Run starts.
- Preserve Submit idempotency and avoid creating attempts or snapshots for rejected requests.
- Keep the guard process-local and document that production multi-instance execution still needs distributed coordination.

**Status:** complete as a small single-instance safeguard. It does not replace a durable production queue or distributed rate limiter.

## Phase AI-0 — deterministic submission evidence facts

- Build versioned, explainable facts from immutable submissions, result snapshots, session runs, and the five existing foundation events.
- Show the facts only on the classroom-owning teacher's submission review while preserving the separate student DTO and hidden-test redaction.
- Keep missing legacy values and unsupported source-size jumps explicit instead of inventing data.
- Add no AI provider, verdict, new event collection, grading, review, execution, or authorization behavior.

**Status:** complete for submission-level facts supported by existing records. New evidence event fields, source-size thresholds, AI summaries, viva generation, and class-level aggregation remain later governed slices.

## Phase AI-1 — integrity review signals

- Map Phase AI-0 facts through explicit, versioned thresholds to neutral `LOW_ATTENTION`, `REVIEW_RECOMMENDED`, and `HIGH_REVIEW_PRIORITY` categories.
- Return explainable reason text only to the classroom-owning teacher on submission review and the compact review queue.
- Treat missing legacy and unsupported source-jump facts as unavailable, never as reasons.
- Add no AI provider, cheating verdict, guilt score, plagiarism accusation, grading, execution, review-state, or student DTO behavior.

**Status:** complete for the five deterministic reasons supported by current Phase AI-0 facts. Policy configuration, acknowledgement/context notes, new evidence fields, class summaries, and AI assistance remain later governed slices.

## Phase AI-2 — AI review brief and viva questions v1

- Add a provider-neutral, schema-validated review-brief boundary with the deterministic in-process fake provider as the only implementation.
- Build a minimized teacher-only request from one owner-scoped immutable submission, aggregate result summaries, facts, and signals.
- Return a transient editable/discardable brief with seven required sections and explicit provider/model/prompt/non-persistence provenance.
- Treat source/comments as untrusted data and add no AI persistence, automatic feedback publication, marks, verdict, student DTO, schema, execution, or grading behavior.

**Status:** complete for the fake-provider v1 workflow. External provider selection, data governance, model evaluation, rate/cost limits, persistence/audit decisions, and production prompt-injection defenses remain unresolved under D-013.

## Phase AI-3 — configurable prototype review provider

- Keep the fake provider as the default and sole test provider.
- Add explicit `fake | groq` selection with a required Groq key/model and documented `openai/gpt-oss-20b` configuration.
- Send only the existing minimized teacher-only contract through a fixed HTTPS adapter with timeout, bounded errors, structured output, and Zod validation.
- Keep output transient and keep identity, raw events, per-test details, marks, feedback, verdicts, and student DTOs outside the provider boundary.
- Permit only manual one-submission teacher generation, reject overlapping work per teacher, map 429 without retry, and add no class-wide action or background queue.

**Status:** complete for low-volume, one-at-a-time teacher-triggered demo use. Groq free-tier limits are not suitable for automatic generation across 30–60 simultaneous submissions. This does not select or certify an institutional production provider and does not resolve residency, retention, training-use, evaluation, audit, distributed limiting, or operational prompt-injection policy under D-013.

## Later slices

1. Complete teacher provisioning and authentication security acceptance.
2. Add isolated execution, queues, resource limits, retry policy, and observability.
3. Approve and add any further evidence event fields and signal policies.
4. Select and evaluate an institutional production AI provider beyond the Phase AI-3 Groq prototype after D-013 governance is resolved.
5. Pilot hardening: concurrency, deadlines/timezones, retention/deletion, audit, accessibility, backup, and incident paths.

Do not pull screen/webcam recording, gamification, mobile coding, cross-institution plagiarism, broad integrations, or automated verdicts into these slices.
