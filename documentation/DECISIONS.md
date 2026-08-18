# Labrix Engineering Decisions

This is a current-state decision record, not a future architecture proposal. It summarizes behavior verified in the repository. Historical rationale in `documentation/07-DECISIONS.md` is used only where the implementation still supports it.

## Decision: Use a Next.js full-stack application with explicit server boundaries

Status: Accepted

### Context

Labrix needs role-aware classroom pages, interactive coding UI, server-side authorization, persistence, and an execution boundary without maintaining a separate public application API.

### Decision

Labrix uses Next.js 16 App Router and React 19. Server Components load persisted views; `"use server"` actions handle mutations. Server modules under `src/server` contain actor resolution, authorization-sensitive services, analytics, reviews, onboarding, and execution adapters. Client Components are limited to interactive UI such as Monaco, forms, dialogs, demo preview, and transient request state.

There are no application `route.ts` HTTP endpoints. The only HTTP execution endpoint is in the separate local Java worker, not the Next.js application.

### Why

The current structure keeps browser input outside the trust boundary while allowing pages and mutations to share TypeScript types and server services.

### Alternatives

- A separate REST or GraphQL backend.
- Client-rendered pages calling JSON APIs.
- A separate frontend and service repository.

### Consequences

- Authorization must be repeated in every server read and mutation; hiding a route or control is insufficient.
- Server Actions return small success/error objects and revalidate affected paths.
- Some reads use focused services or view models while others query Prisma directly from a server page; there is no single repository abstraction.

## Decision: Use explicit App Router pages and quarantine legacy paths

Status: Accepted

### Context

The repository previously exposed a catch-all demo experience and legacy URLs that could look like active product routes.

### Decision

Product pages are explicit under `src/app`. The root catch-all contains no product UI: it redirects only three known aliases and calls `notFound()` otherwise. Canonical routes use the nouns `classes`, `practicals`, `tasks`, and `submissions` as shown in `FLOW.md`.

### Why

Explicit routes make persisted behavior and access requirements inspectable and prevent arbitrary URLs from rendering hard-coded demo data.

### Alternatives

- Retain a client-side catch-all router.
- Preserve every historical alias.
- Introduce a custom route registry.

### Consequences

- New behavior needs an explicit page and a server-side data path.
- The route vocabulary is intentionally uneven: `/practicals/[taskId]` is the student detail page, while `/tasks/[taskId]` is the coding workspace.
- Needs decision: in Clerk mode, `src/proxy.ts` redirects an authenticated unknown top-level path to `/classes`, while demo mode lets the catch-all return 404. This conflicts with documentation claiming all unknown paths return 404.

## Decision: Retain only known legacy aliases

Status: Deprecated

### Context

Old links exist for the root demo, classroom task lists, and task submission histories.

### Decision

- `/` redirects to `/dashboard`.
- `/classes/[classroomId]/tasks` redirects to `/practicals?classroom=...`.
- `/tasks/[taskId]/my-submissions` redirects to `/submissions?practical=...`.

### Why

These redirects preserve known links while keeping new work on persisted canonical pages.

### Alternatives

- Remove the aliases immediately.
- Keep legacy pages indefinitely.

### Consequences

- Agents should generate canonical URLs, not aliases.
- Unknown legacy-shaped paths are not supported.

## Decision: Resolve identity on the server and authorize from PostgreSQL

Status: Accepted

### Context

External authentication proves who holds a session, but Labrix roles, account lifecycle, classroom ownership, and membership are application data.

### Decision

`LABRIX_IDENTITY_MODE` must be explicitly `demo` or `clerk`. In Clerk mode, Clerk validates the session and supplies a subject. `ExternalIdentity(provider, providerSubject)` maps it to a local `User`; the local `accountStatus` and `platformRole` then apply. Email, browser-supplied IDs, browser-selected roles, and provider metadata do not authorize product access.

`src/proxy.ts` performs an optimistic signed-in check. Protected pages and actions resolve the actor again, and resource services enforce ownership or active membership.

### Why

This separates provider identity from product authorization and fails closed for missing, malformed, unlinked, disabled, or unavailable identities.

### Alternatives

- Store roles only in Clerk metadata.
- Link accounts automatically by email.
- Trust a client-selected role.
- Put all authorization in middleware/proxy code.

### Consequences

- Clerk users require an explicit local mapping or successful student onboarding.
- Controlled identity linking uses an existing Labrix user ID and verified Clerk subject; it does not create users or change roles.
- Clerk mode never falls back to demo identity.
- Local `DISABLED` status blocks an otherwise valid external session.
- Needs decision: administrator-controlled teacher provisioning and the production authentication security acceptance process are not implemented.

## Decision: Keep demo identity as an explicit non-production mode

Status: Temporary

### Context

The seeded vertical slice and browser tests need deterministic actors while Clerk integration remains incomplete.

### Decision

Demo mode resolves fixed server-side actors (`demo-teacher` or `demo-student-1`) and is rejected when `NODE_ENV=production`. The sidebar role selector changes demo presentation and navigation only; it is not authentication or authorization.

### Why

This preserves a deterministic local demonstration without letting browser state become a security credential.

### Alternatives

- Require Clerk for every local/test workflow.
- Let the role selector choose trusted user IDs.

### Consequences

- Demo pages sometimes preload both teacher and seeded-student views for presentation.
- Code must not infer permissions from the demo selector or `sessionStorage`.
- Production cannot start with `LABRIX_IDENTITY_MODE=demo`.

## Decision: Model classrooms with one owning teacher and durable memberships

Status: Accepted

### Context

Teacher management and student access need a simple, enforceable ownership boundary while historical work survives access changes.

### Decision

Each `Classroom` has one `ownerTeacherId`. A unique `ClassMembership(classroomId, userId)` records teacher or student membership and an `active` flag. Teacher reads and mutations are owner-scoped; membership alone does not grant teacher management rights. Student classroom, published-practical, workspace, run, and submit access require an active `STUDENT` membership.

Deactivation/reactivation updates the existing membership and appends a `MembershipAuditEntry`; it does not delete historical work. Join-code regeneration updates the classroom’s unique code.

### Why

The model provides a narrow authorization rule and preserves an auditable, continuous relationship to submissions and reviews.

### Alternatives

- Multiple classroom owners or delegated teacher roles.
- Delete membership and dependent history on removal.
- Store invitations as separate durable records.

### Consequences

- Only the owner can create/manage practicals, manage the roster, inspect hidden results, review attempts, or view classroom analytics.
- An inactive student cannot self-reactivate with a join code.
- A student can still open their own historical `/submissions/[submissionId]`; that read is owner-scoped to the student, not gated by current membership.
- Co-teaching and delegated administration are not modeled. Needs decision if required.

## Decision: Onboard new Clerk students through a valid classroom join code

Status: Accepted

### Context

A signed-in but unlinked Clerk account must not receive a Labrix role or access merely because its email is known.

### Decision

`/unlinked-account` accepts a join code only in Clerk mode. A verified primary Clerk email and current Clerk subject are validated server-side. A serializable transaction creates an `ACTIVE` local `STUDENT`, its Clerk `ExternalIdentity`, and an active classroom membership. Repeated requests for an already linked identity are idempotent. Existing email ownership causes an error rather than automatic linking.

### Why

This makes classroom possession the enrollment gate while preserving explicit identity semantics.

### Alternatives

- Automatic account creation at sign-up without a class.
- Email-based account linking.
- Teacher-created student accounts only.

### Consequences

- Student self-onboarding is implemented; `documentation/03-USER-FLOWS.md` still incorrectly describes it as planned.
- Onboarding creates only students. Teacher creation remains administrative and unresolved.
- Clerk onboarding enrolls only the first classroom. The general `joinClassroom()` action is demo-only, so a linked Clerk student has no implemented self-service flow to join an additional classroom. Needs decision if multi-class enrollment is required.

## Decision: Keep the practical model single-problem and publication one-way

Status: Temporary

### Context

The MVP needs teacher-authored coding work without multi-problem/versioning complexity.

### Decision

A Prisma `Task` is the current practical entity. It belongs to one classroom and author, has `DRAFT` or `PUBLISHED` status, Java/C++ language choices and starter templates, optional constraints/deadline, and ordered visible/hidden tests. Publishing requires title, instructions, at least one language, at least one visible test, and expected output for every test. Once published, the service never returns it to draft.

Tests may be replaced until any `CodingSession` or submission exists. After student activity, changing test content, order, count, or visibility is blocked; non-test details can still change.

### Why

Locking tests after activity avoids silently changing the assessment attached to persisted runs and attempts.

### Alternatives

- Multi-problem practicals.
- Versioned releases and test suites.
- Allow unrestricted test editing.

### Consequences

- Existing drafts copy starter code at session creation and are not rewritten by later authoring edits.
- Null starter-code fields remain readable through legacy defaults.
- There is no unpublish flow, release version, attempt limit, or multi-file starter.
- Needs decision: deadline enforcement, late/grace policy, timezone authority, attempt limits, and practical versioning. The current execution/submission service does not reject work after a deadline.

## Decision: Persist mutable drafts and immutable numbered submission attempts

Status: Accepted

### Context

Students need resumable work, while teachers need stable historical evidence for every explicit submission.

### Decision

One active numbered `CodingSession` exists per student/practical, enforced by a partial unique PostgreSQL index. It owns one mutable `Draft`, numbered `RunAttempt` records, result snapshots, and ordered events. Run source and each submitted source are copied into snapshots. Submission closes the active session and creates one numbered `SubmissionAttempt`; reopening the workspace creates the next session/attempt.

`SubmissionAttempt` and `ResultSnapshot` updates are rejected by database triggers. A student-scoped UUID idempotency key deduplicates retries.

### Why

Mutable drafts support recovery; immutable attempts preserve the exact source/result used for review.

### Alternatives

- Overwrite a single submission row.
- Store only the latest source.
- Rely only on application code for immutability.

### Consequences

- Resubmissions do not alter earlier attempts or inflate distinct-student completion.
- Draft saving is server-last-write-wins; identical source/language is a no-op.
- Needs decision: multi-tab/device conflict handling, offline recovery, retention/deletion, and draft history.

## Decision: Use Prisma/PostgreSQL with transactions plus database constraints

Status: Accepted

### Context

Authorization, attempts, idempotency, ordered events, and review history depend on relational integrity under concurrent requests.

### Decision

PostgreSQL is authoritative and Prisma 6 is the application data client. Serializable transactions protect workspace creation, practical saving, onboarding, and final submission. Unique constraints enforce identity mappings, memberships, test order, attempt numbering, run/event order, one submission/result relationship, and idempotency. Migrations add rather than rewrite history.

### Why

The combination provides typed data access and database-enforced invariants that survive application mistakes or retries.

### Alternatives

- An in-memory/demo store.
- A document database.
- Application-only uniqueness and immutability.

### Consequences

- The application requires PostgreSQL and a valid `DATABASE_URL`.
- Database-backed integration and browser tests require an explicitly confirmed disposable database.
- Data access is distributed across services, view models, and one small repository module; future changes must inspect all relevant queries.

## Decision: Put code execution behind a server-owned provider interface

Status: Accepted

### Context

Student source is untrusted and must not execute inside the Next.js process.

### Decision

Run and Submit call a `ServerExecutionProvider`. Run sends visible tests only; Submit sends visible and hidden tests. The Next.js process persists request/result snapshots but never invokes a compiler, Docker, shell, or child process.

### Why

The provider boundary keeps persistence and UI independent from the execution implementation and preserves a strict isolation boundary.

### Alternatives

- Compile in a Server Action.
- Execute in the browser.
- Couple attempts directly to one external vendor.

### Consequences

- Provider failure maps to bounded `internal_error` feedback and still produces a result snapshot for a prepared run.
- Any production provider must remain outside Next.js and enforce explicit resource/network/filesystem controls.

## Decision: Default to deterministic simulation; keep Java execution local-only

Status: Temporary

### Context

The persisted workflow needs stable execution-shaped results before a production sandbox/provider is selected.

### Decision

Unset or `mock` `LABRIX_EXECUTION_PROVIDER` selects `ServerMockExecutionProvider`. It never compiles code; source markers such as `compile_error`, `runtime_error`, and `fail_test` deterministically shape results.

An explicit `java-http` mode supports Java only and requires a loopback HTTP URL. A separate single-flight Node worker invokes Docker, compiles once in a fresh locked-down Java 21 container, and runs ordered tests within fixed limits. It is a development spike, not a production execution service, and never falls back to mock.

### Why

The mock makes the end-to-end persistence flow testable. The Java spike proves the isolation contract without weakening the web-process boundary.

### Alternatives

- Select a hosted sandbox now.
- Run local compilers in Next.js.
- Make the Docker worker the production service.

### Consequences

- C++ is never compiled in the current repository.
- Java is real only when a developer opts into the local worker; default behavior remains simulated.
- The UI and action error text always say “simulated,” even in `java-http` mode. Needs decision: either expose provider provenance in persisted/UI data or restrict the UI to mock mode.
- Needs decision: production provider, queueing, concurrency, retries, outage policy, image lifecycle, observability, retention, compiler versions, and abuse testing.

## Decision: Separate visible/hidden test disclosure, suggested score, and teacher marks

Status: Accepted

### Context

Students need useful run feedback without receiving hidden assessment details, and automatic test performance must not overwrite teacher judgment.

### Decision

Run evaluates visible tests. Submit evaluates all tests. Student DTOs include visible per-test results and hidden pass/total aggregates only; owning-teacher DTOs may include both groups and test details. Result snapshots persist equal-weight suggested scores out of ten, rounded to one decimal; non-completed execution scores zero.

One mutable `SubmissionReview` may be attached to each immutable attempt. It uses whole-number marks out of ten and `DRAFT`/`PUBLISHED` status. Draft feedback is teacher-only; only published feedback is returned to the student who owns the attempt.

### Why

This keeps deterministic test output distinct from teacher-awarded marks and protects hidden test content.

### Alternatives

- Reveal every test to students.
- Treat suggested score as the final grade.
- Store review fields on the immutable attempt.

### Consequences

- Resubmissions have independent reviews.
- Legacy result snapshots without visibility counters are interpreted as visible-only and are not backfilled.
- Rubrics, weighted tests, fractional teacher marks, and autonomous grading are not implemented.

## Decision: Derive analytics from persisted records with deterministic rules

Status: Accepted

### Context

Teachers need progress and attention views without mock fixtures, duplicated attempt counts, or automated misconduct judgments.

### Decision

Teacher overview analytics query owner-scoped active classrooms, active student memberships, published practicals, immutable attempts, results, and reviews. Classroom practical analytics uses each active student’s latest attempt number for the selected published practical. It calculates completion, average suggested score, visible/hidden pass rates, and published-review counts.

Attention reasons are deterministic: no submission, suggested score below `5/10`, not all hidden tests passed, or review not published. Dashboard attention also uses missing submissions, approaching deadlines, and unpublished drafts.

### Why

These are reproducible facts derived from the same records teachers review.

### Alternatives

- Client-side counters over fixture data.
- Count every resubmission as completion.
- AI-generated risk or cheating scores.

### Consequences

- Inactive memberships are excluded from current completion/analytics but their history is preserved.
- “Reviewed” means feedback is published; a private draft remains in “Needs review.”
- Analytics do not expose source, hidden case details, or draft feedback.
- The `/progress` page is global for the teacher despite classroom pages linking to `/progress?classroom=...`; that query parameter is currently ignored. Needs decision: implement filtering or remove the parameter.
- The teacher practical list labels `testCount` as “Visible tests,” but its query counts all test cases. Needs decision: change the query or label.

## Decision: Keep evidence factual and AI absent from the implemented slice

Status: Accepted

### Context

Labrix is intended to support teacher judgment without producing automated accusations or collecting invasive surveillance data.

### Decision

The current evidence timeline contains only `SESSION_STARTED`, `DRAFT_SAVED`, `RUN_REQUESTED`, `RUN_COMPLETED`, and `SUBMISSION_CREATED`, with server timestamps and relevant IDs. There is no AI provider, generated feedback/viva, cheating score, clipboard capture, raw keystroke tracking, screen/webcam capture, or automatic copy/paste blocking.

### Why

The implemented facts are bounded, attributable, and deterministic.

### Alternatives

- Broad telemetry collection.
- Automated misconduct classification.
- AI-generated grades or feedback without review.

### Consequences

- Evidence supports review but cannot describe detailed editing behavior.
- Needs decision before expansion: event fields, privacy notice, retention/deletion/export, thresholds, AI provider/data policy, provenance, evaluation, and prompt-injection defenses.

## Decision: Keep durable state on the server and transient interaction state locally

Status: Accepted

### Context

The coding workspace needs responsive editing while the platform requires persisted, recoverable history.

### Decision

PostgreSQL stores product state. React local state/ref values manage editor buffers, autosave status, dialogs, forms, in-flight operations, and the per-submit idempotency UUID. Context is used only for identity mode and demo-role presentation. The demo role preview is stored in browser `sessionStorage`. There is no Redux/Zustand-style global product store.

### Why

The current scope does not require a replicated client cache; server reloads can reconstruct product views from persisted data.

### Alternatives

- A global client store.
- Browser-local durable drafts.
- An optimistic normalized API cache.

### Consequences

- Autosave is debounced in the browser and rechecked transactionally on the server.
- A failed save leaves the editor buffer intact but has no offline recovery guarantee.
- Server mutations revalidate selected paths rather than synchronizing a global client cache.

## Decision: Validate external input explicitly and fail closed at access boundaries

Status: Accepted

### Context

Server Actions receive untrusted JavaScript values or `FormData`, and page URLs contain untrusted resource IDs.

### Decision

Zod schemas validate workspace input, practical authoring, reviews, roster IDs, onboarding, external identities, and the Java runner protocol. Services then re-query the requested resource with actor ownership/membership conditions. Page-level actor failures redirect to sign-in/onboarding/disabled/unauthorized states; unavailable or unauthorized resource pages commonly return 404. Mutating actions generally return bounded user-facing messages rather than raw exceptions.

### Why

Schema validation prevents malformed input from crossing service boundaries, while resource-scoped queries prevent confused-deputy access.

### Alternatives

- Trust TypeScript types at runtime.
- Return raw database/provider errors.
- Authorize only through route visibility.

### Consequences

- Client messages are intentionally generic and server error types carry only limited detail.
- There is no shared public HTTP error envelope because there are no application API routes.
- Some broad `catch` blocks turn operational failures into 404 or generic action errors, which limits diagnosis. Needs decision: production logging/observability and a consistent error taxonomy.

## Decision: Assume a Node.js Next.js runtime, PostgreSQL, and optional external local worker

Status: Temporary

### Context

The repository needs concrete local and test runtime assumptions but does not contain an accepted production deployment design.

### Decision

The application uses the standard Next.js Node-oriented runtime with Prisma/PostgreSQL and Clerk environment variables. No Edge runtime declarations or production hosting manifests are present. The optional Java worker is a separate Node process requiring Docker and loopback access.

### Why

Prisma, Clerk server APIs, and the local worker match the implemented development architecture.

### Alternatives

- Edge/serverless-only deployment.
- Containerized application deployment.
- Managed execution and database services.

### Consequences

- Local setup requires `DATABASE_URL`, explicit identity mode, migrations, and seed data for demo mode.
- The Java worker cannot be treated as an internet-facing or horizontally scaled service.
- Needs decision: production hosting, PostgreSQL topology, migration execution, secrets, backups, monitoring, incident handling, and production execution deployment.

## Last verified against codebase

- Verified: 2026-08-11
- Git commit inspected: `44ed19a`
- Evidence inspected: required product/architecture/roadmap/verification docs; package and environment configuration; all App Router pages; proxy; Prisma schema, migrations, seed, and data queries; actor/auth/onboarding/authorization services; practical, attempt, review, roster, analytics, and execution services; server actions and validation schemas; Java worker; unit, integration, runner, and Playwright coverage.
