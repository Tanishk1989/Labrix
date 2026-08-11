# Architecture

## Current vertical slice

Labrix uses Next.js 16.3 App Router, React 19.2, strict TypeScript, Prisma 6/PostgreSQL, Monaco, Zod, Vitest, and Playwright.

```mermaid
flowchart TB
  UI["Workspace and review UI"] --> A["Server actions / server pages"]
  A --> ID["Explicit demo or Clerk identity adapter"]
  ID -->|"Clerk"| MAP["ExternalIdentity to local User"]
  MAP --> AUTHZ
  ID -->|"Demo"| AUTHZ["Membership and teacher-ownership checks"]
  AUTHZ --> SVC["Attempt service"]
  SVC --> DB[("PostgreSQL via Prisma")]
  SVC --> EP["ServerExecutionProvider"]
  EP --> MOCK["Deterministic mock; no code execution"]
  DB --> REVIEW["Persisted teacher progress and review"]
```

The browser sends resource IDs and source input, never a trusted user ID, provider subject, role, or account status. Every persisted page/action resolves its actor server-side, and services re-check membership/ownership with the requested resource.

Clerk is integrated behind a provider-neutral adapter. The identity foundation stores local `User.accountStatus` and optional `ExternalIdentity` records. Existing demo users require no external identity. The implemented Clerk resolver is:

```mermaid
flowchart LR
  C["Clerk-validated server session"] --> S["Provider subject"]
  S --> E["ExternalIdentity"]
  E --> U["Labrix User"]
  U --> P["Local account status, role, ownership, membership, and permissions"]
```

Clerk establishes identity and session validity only. PostgreSQL remains authoritative for authorization. Email, browser-selected roles, and provider metadata are not identity-linking or authorization inputs. Missing, malformed, unlinked, disabled, or unavailable Clerk identity fails closed.

`src/proxy.ts` performs an optimistic signed-in check and keeps authentication/static routes reachable. It is not the authorization boundary. `resolveCurrentActor()` runs again beside every protected database read or mutation. `demo` mode is local/test-only and production rejects it; `clerk` mode never falls back.

Teacher classroom queries are owner-scoped. Latest-practical completion is derived from active student memberships and distinct submission student IDs. Client autosave compares source/language with the last successfully persisted version; the server repeats that comparison transactionally before changing a draft, timestamp, revision, or event timeline.

Each `Task` may store nullable Java and C++ starter-code fields. Null keeps legacy practicals readable through built-in defaults. A new coding session copies only the selected language template into its mutable `Draft`; later authoring edits never rewrite an existing draft. The workspace swaps templates on language change only while the browser still holds an untouched, never-persisted default.

The teacher review-queue DTO is also classroom-owner scoped. It returns submission metadata, aggregate result status, suggested score, teacher marks, and a derived review status without returning draft feedback text. Student DTOs remain separate and expose only published reviews belonging to that student.

Roster reads and mutations use a server-only classroom service. Deactivation and owner-only reactivation atomically update only the existing membership `active` flag and append a `MembershipAuditEntry` after role and classroom-owner checks; the `(classroomId, userId)` uniqueness constraint prevents duplicate memberships and historical coding/review relations remain untouched. Owner-scoped roster reads return the recent audit trail, while student DTOs do not include it. An inactive member cannot self-reactivate through the join-code action. Join-code regeneration updates the existing unique classroom code, so no invitation record is required for these MVP controls.

## Persisted model

- `CodingSession`: one numbered practical attempt; a partial unique database index permits only one active session per student/practical.
- `Draft`: the one mutable source buffer for a session.
- `RunAttempt`: immutable source used for one server-owned provider request.
- `ResultSnapshot`: provider outcome, per-test JSON, nullable visible/hidden counters, and nullable suggested score; updates are rejected by a database trigger. Nullable additions keep legacy snapshots readable without rewriting them.
- `SubmissionAttempt`: numbered exact source plus associated result; updates are rejected by a database trigger.
- `SubmissionReview`: optional mutable teacher-authored marks/feedback attached one-to-one to an immutable attempt; only published reviews are returned to the owning student.
- `CodeEvent`: ordered, server-timestamped foundation events with relevant run/submission IDs.
- `User.accountStatus`: local `ACTIVE`/`DISABLED` lifecycle policy; existing users default to `ACTIVE`.
- `ExternalIdentity`: optional provider/subject link to an existing local user. Composite uniqueness prevents a provider subject from mapping twice and prevents duplicate same-provider identities for one local user.
- `MembershipAuditEntry`: append-only record of owner-authorized membership deactivation/reactivation with classroom, membership, student, acting teacher, optional reason, and server timestamp. Restrictive foreign keys preserve its references.

Submission creation uses a serializable transaction to create the attempt, close the active session, and append its event. Unique constraints enforce attempt numbering, one submission per session, one result per submission, and student-scoped idempotency.

## Route boundary

- **Database-backed:** `/dashboard`, `/classes`, `/classes/[classroomId]`, `/classes/[classroomId]/tasks/new`, `/classes/[classroomId]/tasks/[taskId]/edit`, `/practicals`, `/practicals/[taskId]`, `/progress`, `/tasks/[taskId]`, `/classes/[classroomId]/students`, `/submissions`, and `/submissions/[submissionId]`. Teacher queries are ownership-scoped; student queries are active-membership and resource-ownership scoped.
- **Legacy catch-all remains:** unmatched routes such as `/tasks/[taskId]/my-submissions` and `/classes/[classroomId]/tasks`.

Explicit routes take precedence over `src/app/[[...slug]]/page.tsx`. New product behavior should use explicit routes and server services rather than expanding the catch-all.

## Execution and evidence boundaries

No student source runs in Next.js. The current server provider only simulates deterministic feedback. A production adapter must call an isolated runner with explicit time, memory, process, filesystem, output, and network limits.

Run requests contain visible tests only. Submit requests contain visible and hidden tests. Student DTOs filter out every hidden test record before serialization and return only hidden pass/total counters; owner-scoped teacher DTOs may return the stored hidden details. Suggested scoring is deterministic and separate from teacher-authored marks.

Only five foundation events are captured. No raw keystrokes, clipboard contents, tab tracking, screen/webcam recording, suspicion signal, cheating score, or AI output exists in this slice.
