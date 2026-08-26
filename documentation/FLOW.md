# TRACE System Flow

This describes the behavior present in the repository. “Practical” is represented by the Prisma `Task` model. “Execution” means the configured provider; it is simulated by default.

## 1. High-Level Architecture

```text
User browser
  |
  +--> Next.js App Router pages (Server Components)
  |      |
  |      +--> resolveCurrentActorForPage()
  |      +--> view models / read services
  |
  +--> Client Components (Monaco, forms, transient state)
         |
         +--> Server Actions
                |
                +--> resolveCurrentActor() + requireActorRole()
                +--> resource authorization / domain service
                       |
                       +--> Prisma --> PostgreSQL
                       |
                       +--> ServerExecutionProvider
                              +--> default deterministic mock (no execution)
                              `--> opt-in loopback Java HTTP adapter
                                     `--> separate Node worker --> Docker sandbox
```

`src/proxy.ts` protects signed-in navigation in Clerk mode, but it is not the authorization boundary. The server page/action and resource query enforce access again.

Reads are server-side and database-backed. Mutations use Server Actions; there are no Next.js application API route handlers.

## 2. Authentication Flow

### Identity mode selection

```text
Application start/request
  -> LABRIX_IDENTITY_MODE
       -> demo: fixed seeded actors; rejected in production
       -> clerk: Clerk session required; never falls back to demo
```

### Clerk linked-user flow

```text
Open protected route
  -> proxy checks signed-in state
  -> page/action calls resolveCurrentActor()
  -> Clerk auth() returns verified userId (provider subject)
  -> validate provider + subject
  -> ExternalIdentity lookup
  -> local User lookup
  -> require accountStatus = ACTIVE
  -> use local platformRole
  -> resource service checks classroom ownership, active membership,
     student ownership, or practical ownership
```

Failure routing for pages:

- No valid session -> `/sign-in`
- Valid but unlinked identity -> `/unlinked-account`
- Linked disabled user -> `/disabled-account`
- Invalid identity or wrong required role -> `/unauthorized`
- Missing/inaccessible resource -> usually 404

### New Clerk student onboarding

```text
Unlinked signed-in user
  -> /unlinked-account
  -> Clerk currentUser() + session must agree
  -> verified primary email required
  -> submit classroom join code
  -> Zod normalization/validation
  -> serializable transaction validates active Classroom.joinCode
  -> create ACTIVE STUDENT User
  -> create Clerk ExternalIdentity
  -> create active STUDENT ClassMembership
  -> redirect /classes
```

The flow is retry-safe for an already linked identity and refuses email-based linking. Teacher provisioning is not implemented.

### Demo flow

Demo routes resolve either `demo-teacher` or `demo-student-1` on the server. The sidebar selector changes presentation and stores that preference in `sessionStorage`; it does not select a trusted actor or role.

## 3. Teacher Flow

### Dashboard and cross-class progress

```text
Open dashboard/progress
-> /dashboard or /progress
-> resolve teacher actor
-> getTeacherOverview(teacherId)
-> query owned ACTIVE classrooms, active STUDENT memberships,
   tasks, attempts, result snapshots, and reviews
-> derive distinct-student/practical completion and attention facts
-> render owner-scoped metrics, tables, and links
```

### Create a classroom

```text
Submit “Create class” dialog
-> /classes client form
-> createClassroom(values) Server Action
-> Zod validate + resolve TEACHER actor
-> create Classroom with unique join code and owner teacher membership
-> revalidate /classes
-> navigate to /classes/[classroomId]
```

### View/manage a classroom

```text
Open classroom
-> /classes/[classroomId]
-> getClassroomOverviewViewModel(actor.id, id, TEACHER)
-> getOwnedClassroomById() filters ownerTeacherId
-> query active memberships, tasks, and attempts
-> derive latest published practical, distinct completion, and missing students
-> render overview
```

### Create, edit, and publish a practical

```text
Open authoring page
-> /classes/[classroomId]/tasks/new
   or /classes/[classroomId]/tasks/[taskId]/edit
-> resolve TEACHER; verify classroom owner / task author
-> submit saveTaskDraft() or publishTask()
-> Zod validate form (stricter rules for publish)
-> saveTeacherPractical() serializable transaction
-> verify owner and task author
-> block test replacement after any student CodingSession/submission
-> create/update Task and ordered TestCase rows
-> revalidate classes, classroom, practicals
-> show saved/published state
```

Publication is one-way in the service. A published practical stays published on later saves.

### View and manage students

```text
Open roster/progress
-> /classes/[classroomId]/students
-> resolve TEACHER
-> in parallel:
     getTeacherClassroomProgress()
     getTeacherClassroomRoster()
-> require classroom owner
-> query active/inactive memberships, attempt/review summaries,
   current join code, and latest 10 membership audit entries
-> render roster and current latest-practical progress
```

Membership actions:

```text
Deactivate/reactivate
-> roster Server Action
-> resolve TEACHER + validate IDs + require owner
-> transaction updates existing ClassMembership.active
-> append MembershipAuditEntry
-> revalidate classroom pages

Regenerate join code
-> roster Server Action
-> resolve TEACHER + require owner
-> transaction replaces Classroom.joinCode
-> old code becomes invalid; existing memberships/history remain
```

### Review submissions and suggested scoring

```text
Open /submissions
-> resolve TEACHER
-> getTeacherOverview(teacherId)
-> owner-scoped immutable attempts + results + review metadata
-> derive Needs review / Draft saved / Published feedback
-> apply URL filters in the server page
-> render queue with suggested score and teacher marks separately

Open /submissions/[submissionId]
-> getSubmissionForTeacher(teacherId, submissionId)
-> require task.classroom.ownerTeacherId = teacherId
-> load exact source, full visible/hidden result details,
   run count, ordered events, and review
-> render read-only attempt and editable review form

Save/publish review
-> saveSubmissionReviewAction()
-> resolve TEACHER + Zod validate whole marks 0..10 and feedback
-> transaction verifies classroom owner
-> upsert attempt-scoped SubmissionReview
-> DRAFT stays teacher-only; PUBLISHED becomes student-visible
-> revalidate queue and detail page
```

Suggested score is deterministic and equal-weight: completed passed/total tests scaled to 10 and rounded to one decimal; execution errors score 0. It never writes teacher-awarded marks.

### Classroom practical analytics

```text
/classes/[classroomId]/students
-> latest published practical from getTeacherClassroomProgress()
-> getTeacherPracticalAnalytics(owner, classroom, task)
-> active STUDENT memberships only
-> all attempts for those students
-> select highest attemptNumber per student
-> aggregate completion, suggested score, visible/hidden pass rates,
   and published-review count
-> derive neutral attention reasons
-> render metrics and review links
```

## 4. Student Flow

### Join/access classroom

Clerk users join during the onboarding flow in section 2. In demo mode only, the `/classes` dialog calls `joinClassroom(code)`, resolves the fixed demo student, and creates a membership if one does not already exist. An inactive existing membership is not reactivated by either join path.

There is no Clerk-mode self-service flow for an already linked student to join a second classroom; `joinClassroom()` rejects non-demo mode.

```text
Open /classes or /classes/[classroomId]
-> resolve STUDENT actor (or demo presentation bridge)
-> query ACTIVE classroom + active STUDENT membership
-> include PUBLISHED practicals only
-> render classes, latest practical, and completion
```

### View a practical

```text
Open /practicals or /practicals/[taskId]
-> resolve STUDENT
-> getStudentOverview()/getStudentPractical()
-> query active memberships + PUBLISHED Tasks + visible tests
-> load that student’s latest session and immutable attempts
-> render instructions, deadline, visible-test count, status,
   and submission history
```

### Start/resume coding

```text
Open /tasks/[taskId]
-> resolve STUDENT
-> getOrCreateStudentWorkspace(studentId, taskId)
-> require PUBLISHED task + active STUDENT membership
-> find ACTIVE CodingSession
   -> found: return its Draft unchanged
   -> absent: serializable transaction creates next numbered session,
      Draft from first allowed language starter, and SESSION_STARTED event
-> render Monaco workspace
```

Edits are held in React state. After 650 ms of inactivity:

```text
Editor/language changed
-> saveDraftAction()
-> Zod validate sessionId, language, source length
-> resolve STUDENT + require active owned session/membership
-> identical source+language: no-op
-> otherwise update Draft, increment revision, optionally update language,
   append DRAFT_SAVED
-> return Saved; on failure retain browser buffer and show Save failed
```

An untouched, never-persisted starter may switch to the matching language template. Edited/resumed source is preserved.

### Run code

```text
Click Run
-> runDraftAction()
-> validate input + resolve STUDENT
-> runStudentDraft() with visible tests only
-> persist source/language changes if any
-> create RunAttempt + RUN_REQUESTED
-> call configured ServerExecutionProvider outside the transaction
-> persist immutable ResultSnapshot
-> mark RunAttempt completed + append RUN_COMPLETED
-> return visible per-test results; render result
```

### Submit work

```text
Click Submit
-> browser creates/reuses UUID idempotency key
-> submitDraftAction()
-> validate input + resolve STUDENT
-> return an existing student-scoped idempotent submission if present
-> executeStudentDraft() with visible + hidden tests
-> serializable transaction rechecks active owned session
-> create immutable SubmissionAttempt linked to ResultSnapshot
-> mark CodingSession SUBMITTED
-> append SUBMISSION_CREATED
-> return visible details + hidden aggregate + suggested score
-> disable editor actions and show result/submission links
```

Opening the workspace again after submission creates the next numbered session. No deadline or maximum-attempt rule currently blocks this.

### View result/status

```text
Open /submissions or /submissions/[submissionId]
-> resolve STUDENT
-> list only that student’s attempts from active classroom overviews
   or fetch detail by SubmissionAttempt.studentId
-> return visible test results, hidden pass/total only,
   timeline, source, and only PUBLISHED review feedback
-> render immutable attempt status
```

A direct owned submission detail remains readable even if classroom membership is later inactive. The list overview is membership-scoped, so an inactive classroom’s history may disappear from `/submissions` while its owned detail URL still works.

## 5. Submission Lifecycle

The database has separate coding-session and review state machines.

```text
No session
  |
  | open workspace
  v
CodingSession ACTIVE (attempt N)
  +--> Draft mutable; revision increments on changed saves
  +--> RunAttempt 1..N -> immutable ResultSnapshot per completed run
  |
  | Submit with idempotency key
  v
SubmissionAttempt N created (immutable)
CodingSession -> SUBMITTED
  |
  | reopen workspace
  v
new CodingSession ACTIVE (attempt N+1)
```

Review state:

```text
No review
  -> DRAFT (private teacher marks/feedback)
  -> PUBLISHED (visible to owning student)
  -> DRAFT or PUBLISHED on a later teacher save
```

Key persistence rules:

- One active session per student/practical: partial unique database index.
- One submission per session and one result snapshot per submission: unique relations.
- One attempt number per student/practical and one run/event sequence per session.
- Retry dedupe: unique `(studentId, idempotencyKey)`.
- `SubmissionAttempt` and `ResultSnapshot` updates: rejected by PostgreSQL triggers.
- `SubmissionReview`: intentionally mutable and stored separately.

## 6. Code Execution Flow

### Common provider flow

```text
Server Action
-> attempt service authorizes session and snapshots source
-> getServerExecutionProvider()
-> provider.execute({ language, sourceCode, ordered tests })
-> normalize returned tests to requested IDs/visibility
-> calculate visibility counters + suggested score
-> persist ResultSnapshot and completion event
-> redact hidden details for student DTOs
```

### Default: deterministic mock

- Selected when `LABRIX_EXECUTION_PROVIDER` is unset or `mock`.
- Does not compile or execute Java/C++.
- `compile_error` and `runtime_error` source markers return simulated errors.
- `fail_test` makes all but the first requested test fail; otherwise all requested tests pass.
- A 75 ms delay simulates provider latency.

### Opt-in: local Java HTTP spike

```text
Next.js JavaHttpExecutionProvider
-> require JAVA + bounded source/tests + loopback HTTP endpoint
-> POST /v1/execute/java with fixed limits
-> separate Node worker (single-flight)
-> fresh Docker container using pinned Java 21 image
-> compile Main.java once
-> run one process per ordered test
-> compare normalized output
-> remove container in finally
-> validate bounded response against original request
```

The worker applies no network, non-root user, read-only root filesystem, dropped capabilities, CPU/memory/PID/file/output/time limits, bounded tmpfs, and forced cleanup. It is local development proof only. C++ has no real provider.

Important inconsistency: workspace, review, queue, and error copy always describe results as simulated, even when `java-http` is selected. Result snapshots do not store provider provenance.

## 7. Analytics Flow

Analytics are read-time reductions over PostgreSQL records; there is no event warehouse, background aggregation job, analytics SDK, or AI model.

### Teacher overview analytics

Sources:

- Owned active classrooms.
- Active student memberships.
- Draft/published tasks.
- All immutable attempts and result snapshots.
- Attempt-scoped reviews.

Calculations:

- Student counts are distinct across owned classrooms.
- Practical completion counts distinct submitting students, not attempts.
- Overall progress counts distinct student/published-practical pairs.
- “Needs review” includes no review and private drafts; only published feedback is reviewed.
- Deadline attention is generated when the latest published practical is due in 0–7 days.

### Per-practical analytics

Sources:

- One owner-validated published practical.
- Active student memberships only.
- Each student’s highest-numbered immutable attempt.
- Visibility counters/suggested score from its result snapshot.
- Review status.

Calculations:

- Submitted/pending active students.
- Mean suggested score over latest submitted attempts.
- Aggregate visible and hidden pass rates.
- Published-review and needs-review counts.
- Attention codes: `NO_SUBMISSION`, `LOW_SUGGESTED_SCORE` (below 5), `FAILED_HIDDEN_TESTS`, `NEEDS_REVIEW`.

Legacy snapshots without separate visibility counters are treated as visible-only. Analytics never return source code, hidden case contents, or private feedback.

## 8. Route Map

### Canonical product routes

| Route | Role/access | Meaning |
| --- | --- | --- |
| `/dashboard` | Teacher or student | Role-aware persisted summary |
| `/classes` | Teacher or student | Owned/enrolled classroom list; create class; demo-only join dialog |
| `/classes/[classroomId]` | Owner teacher or active member student | Classroom overview |
| `/classes/[classroomId]/students` | Owning teacher | Roster, join-code controls, audit history, latest-practical progress and analytics |
| `/classes/[classroomId]/tasks/new` | Owning teacher | Create practical draft/publish |
| `/classes/[classroomId]/tasks/[taskId]/edit` | Owning author teacher | Edit practical |
| `/practicals` | Teacher or student | Teacher practical management list or student published-practical list |
| `/practicals/[taskId]` | Active member student | Published practical detail and attempt history |
| `/tasks/[taskId]` | Active member student | Coding workspace; opening can create a session/draft |
| `/progress` | Teacher or student | Cross-class persisted progress; classroom query parameter is not currently applied |
| `/submissions` | Teacher or student | Owner-scoped review queue or student attempt history |
| `/submissions/[submissionId]` | Owning classroom teacher or owning student | Full teacher review or redacted student result |

### Authentication/state routes

| Route | Meaning |
| --- | --- |
| `/sign-in/[[...sign-in]]` | Clerk sign-in in Clerk mode; informational page in demo mode |
| `/sign-up/[[...sign-up]]` | Clerk sign-up in Clerk mode; informational page in demo mode |
| `/unlinked-account` | Clerk student join-code onboarding |
| `/disabled-account` | Linked local account is disabled |
| `/unauthorized` | Authenticated actor lacks role/permission |

### Deprecated redirects

| Legacy route | Destination |
| --- | --- |
| `/` | `/dashboard` |
| `/classes/[classroomId]/tasks` | `/practicals?classroom=[classroomId]` |
| `/tasks/[taskId]/my-submissions` | `/submissions?practical=[taskId]` |

The root catch-all returns 404 for other paths in demo mode. In Clerk mode, the proxy redirects authenticated unknown top-level paths outside known prefixes to `/classes`; this behavior needs reconciliation with the documented 404 policy.

## 9. Data Relationships

```text
User
  +-- optionally maps from --> ExternalIdentity
  +-- owns (teacher) -------> Classroom
  +-- belongs through ------> ClassMembership ----> Classroom
  +-- authors (teacher) ----> Task
  +-- opens (student) ------> CodingSession
  `-- submits (student) ----> SubmissionAttempt

Classroom
  +-- has one owner --------> User
  +-- has memberships ------> ClassMembership
  +-- contains -------------> Task (practical)
  `-- records access changes> MembershipAuditEntry

Task
  +-- has ordered ----------> TestCase (visible or hidden)
  +-- has ------------------> CodingSession
  `-- has immutable --------> SubmissionAttempt

CodingSession (one active per student/task)
  +-- has one mutable ------> Draft
  +-- has numbered ---------> RunAttempt
  +-- has ordered ----------> CodeEvent
  `-- has at most one ------> SubmissionAttempt

RunAttempt
  `-- has at most one ------> ResultSnapshot (immutable)

SubmissionAttempt (immutable)
  +-- references -----------> Task, student, CodingSession, ResultSnapshot
  `-- has at most one ------> SubmissionReview (mutable; draft/published)
```

## 10. Critical Invariants

- The browser never supplies a trusted actor ID, platform role, account status, or external provider subject.
- Clerk proves session identity; PostgreSQL supplies local role/status and all product authorization.
- Demo identity is explicit, non-production, and the role selector is presentation only.
- Only `Classroom.ownerTeacherId` can manage that classroom, its practicals, roster, reviews, hidden result details, and analytics.
- Students need an active `STUDENT` membership to see a classroom/published practical or create/save/run/submit work.
- Deactivation changes only the existing membership state and preserves drafts, runs, attempts, results, events, reviews, and audit references.
- A practical must be published before student workspace access. Students never receive draft practicals.
- Test cases cannot change after any student coding session/submission exists for the practical.
- An active session has one mutable draft; each explicit submission creates a new immutable numbered attempt.
- Submission and result snapshot immutability is enforced by PostgreSQL triggers, not convention alone.
- Repeated submit requests are deduplicated by a student-scoped idempotency key.
- Run evaluates visible tests only; Submit evaluates visible and hidden tests.
- Student result DTOs never expose hidden test IDs, input, expected output, or per-test output; only hidden aggregate counts.
- Suggested score is deterministic and separate from teacher marks. Only published review feedback is student-visible.
- Completion and practical analytics come from persisted attempts and count a student’s latest/distinct submission, not every resubmission.
- Untrusted source never executes inside Next.js. Default execution is simulated; the Java worker is separate, loopback-only, and not production.
- Evidence is factual and advisory. The implemented system does not produce cheating verdicts, guilt scores, or AI output.
- Canonical explicit routes are preferred; deprecated aliases exist only as redirects.

Verified gaps that future changes must not silently reinterpret:

- Deadline and attempt-limit policy is not enforced by the attempt service.
- Production execution, deployment, observability, retention, and teacher provisioning need decisions.
- `java-http` execution lacks stored provider provenance while UI copy says “simulated.”
- `/progress?classroom=...` is linked but not filtered.
- The practical list’s “Visible tests” column currently counts all test cases.
- `documentation/03-USER-FLOWS.md` is stale about Clerk student onboarding.
- Clerk-mode enrollment after the first onboarding classroom is not implemented.

## Last verified against codebase

- Verified: 2026-08-11
- Git commit inspected: `44ed19a`
- Evidence inspected: required product/architecture/roadmap/verification docs; package and environment configuration; all App Router pages; proxy; Prisma schema, migrations, seed, and data queries; actor/auth/onboarding/authorization services; practical, attempt, review, roster, analytics, and execution services; server actions and validation schemas; Java worker; unit, integration, runner, and Playwright coverage.
