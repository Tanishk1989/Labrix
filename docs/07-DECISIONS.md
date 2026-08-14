# Decisions

“Accepted” entries are current constraints. “Proposed / unresolved” entries require owner approval.

## Accepted

### D-001 — Teacher-first workflow

Labrix centers Classroom → Practical → Coding Session → Run/Feedback → Submission → Evidence → Teacher Review.

### D-002 — Evidence is not a verdict

Labrix presents neutral, inspectable facts. It does not declare cheating, compute guilt, automate sanctions, or automatically block copy/paste.

### D-003 — Immutable attempts and persistent drafts

Drafts are recoverable mutable work. Each explicit submission creates an immutable attempt with historical source and result snapshots.

### D-004 — Isolated execution

Untrusted code never runs inside Next.js. Production execution uses an isolated provider or sandbox behind an execution-provider boundary.

### D-005 — Deterministic facts, advisory AI

Rules calculate measurable evidence. AI may later explain, summarize, draft feedback, and generate viva questions; its output is labeled and non-authoritative.

### D-006 — Preserve the current stack

The MVP uses Next.js/React/TypeScript, Prisma/PostgreSQL, Monaco, Zod, Vitest, and Playwright unless a later accepted decision changes it.

### D-007 — Explicit MVP exclusions

Screen/webcam recording, gamification, mobile coding, cross-institution plagiarism, and automated guilt verdicts are outside the MVP.

### D-008 — Clerk authentication with local Labrix authorization

**Accepted 2026-08-09.** Clerk will prove identity and server-session validity only. Labrix PostgreSQL remains authoritative for platform role, `ACTIVE`/`DISABLED` account status, classroom ownership, membership, and product permissions. The server will map a Clerk subject through an optional provider-neutral `ExternalIdentity` record to an existing local `User`; email is not an authentication identity key and accounts are never linked automatically by matching email.

Initial authentication will use verified email and password with Clerk Hobby session defaults. Students may self-register locally as `STUDENT` and require a valid join code for classroom access. Teachers are administrator/invitation provisioned; no browser role choice can grant `TEACHER`. Separate Clerk development and production instances are required. MFA, email invitations, and webhooks are deferred. The fixed seeded demo resolver remains current during the transition and must be unavailable in production once authenticated resolution is implemented.

### D-014 — Labrix is the canonical product name

**Accepted 2026-08-09.** Labrix is the only active product name. Pulse, CodePulse, and CodeClass are legacy names retained only in historical/migration context. Safe user-facing branding, package metadata, demo labels, seed labels, and storage prefixes use Labrix. Database tables, route parameters, environment variables, and unrelated technical identifiers are not renamed merely for branding.

### D-016 — Persisted attempt model names and lifecycle

**Accepted 2026-08-09.** The slice uses `CodingSession`, `Draft`, `RunAttempt`, `ResultSnapshot`, `SubmissionAttempt`, and `CodeEvent`. A numbered session represents one practical attempt; a partial unique index permits one active session per student/practical. `Draft` is mutable. Submission/result snapshots reject updates through database triggers. Student-scoped idempotency returns the same submission for a retried request; later work uses the next numbered session.

### D-017 — Seeded server actor boundary for Slice 1

**Accepted 2026-08-09, non-production.** Browser requests do not supply a trusted user ID or role. Workspace operations resolve `demo-student-1`; teacher review resolves `demo-teacher`; services enforce current membership or classroom ownership. Production authentication must replace this resolver before pilot use.

### D-018 — Explicit identity resolver modes and linking

**Accepted 2026-08-09.** `LABRIX_IDENTITY_MODE` must be explicitly `demo` or `clerk`; missing/invalid configuration fails, production rejects `demo`, and Clerk failures never fall back. In Clerk mode, the server-verified subject is mapped through `ExternalIdentity`, then PostgreSQL supplies account status and role. Existing service membership and ownership checks remain mandatory.

Initial linking is a controlled non-public command using an existing Labrix user ID and verified Clerk subject. It never matches email, creates users, changes roles, or exposes a public linking endpoint. A signed-in but unlinked Clerk account is not an authenticated Labrix user. Student onboarding and teacher provisioning follow the separate guarded policies recorded below.

### D-019 — Attempt-scoped teacher review

**Accepted 2026-08-10.** Each immutable submission attempt may have one separately mutable teacher review. Marks use a fixed ten-point scale (`marksOutOf = 10`). Draft reviews remain teacher-only; only a published review is visible to the student who owns that attempt. Students cannot create or edit reviews. Rubrics, weighted grading, multi-criteria marks, and AI-generated feedback are outside Phase 4A.

### D-015 — Test visibility and assessment model

**Accepted 2026-08-10.** A single-problem practical requires at least one visible test and may include hidden tests. Run evaluates visible tests only; Submit evaluates both groups. Students receive visible detail and only a hidden pass/total aggregate, while the classroom-owning teacher may inspect hidden details. Each new immutable result snapshot stores a deterministic equal-weight suggested score out of ten rounded to one decimal; provider/compile/runtime failure scores zero. Suggested scoring never replaces teacher-awarded marks. Rubrics and weighted grading remain out of scope.

### D-020 — Submission deadline classification

**Accepted 2026-08-11.** New immutable submission attempts store a nullable timing status determined from server time and the practical deadline. Submissions at or before the deadline, and submissions for practicals without a deadline, are `ON_TIME`; later submissions are `LATE`. The default policy allows late submissions while preserving their classification. Legacy attempts remain null and display **Timing unavailable**; they are not backfilled.

### D-021 — Practical versions on immutable submissions

**Accepted 2026-08-11.** Practicals start at version 1. Material changes to instructions, constraints, allowed languages, starter code, deadline, or ordered tests increment an already-published practical’s version; draft edits and no-op saves do not. Each new immutable submission stores the current practical version. Legacy submissions remain null and display **Version unavailable**; they are not rewritten.

### D-022 — Administrator-controlled teacher provisioning

**Accepted 2026-08-11.** Teacher access is provisioned only through a guarded server-side administrator command using an explicit verified Clerk subject. The command may create a new `ACTIVE TEACHER` or link an explicitly identified existing `ACTIVE TEACHER`; it never promotes a `STUDENT`, links by email, or accepts disabled users. Duplicate subjects, provider conflicts, email collisions, and uniqueness races fail closed. No public provisioning route is exposed. The generic identity linker is restricted to confirmed non-production recovery operations.

### D-023 — Transient fake-provider AI review brief v1

**Accepted 2026-08-14.** Phase AI-2 introduces a provider-neutral structured review-brief contract but configures only an in-process deterministic fake provider. A classroom-owning teacher must explicitly request generation for one immutable attempt; the server re-authorizes ownership and constructs the minimized input without student/classroom identity, raw events, per-test details, marks, or existing feedback. Hidden result information is aggregate-only.

Source code and comments are untrusted data and never instructions. Provider output is schema-validated, labeled with provider/model/prompt/non-persistence provenance, editable, discardable, and transient. It cannot assign marks, save or publish feedback, create a misconduct verdict, or reach student DTOs. No external AI call is approved by this decision; D-013 remains unresolved and controls any later real provider.

### D-024 — Prototype Groq review provider

**Accepted 2026-08-14.** Phase AI-3 permits Groq as an explicitly configured low-cost prototype/demo provider behind the existing `AIReviewBriefProvider` contract. Fake remains the default and the only provider used by automated tests. Groq mode requires a server-side API key and model; the documented default configuration is `openai/gpt-oss-20b`, and a compatible model such as `openai/gpt-oss-120b` may be selected through the environment without code changes. The adapter uses a fixed HTTPS endpoint, sends only the Phase AI-2 minimized allowlist, treats practical text/source/comments as untrusted data, requests structured output, applies a timeout and response bound, and validates returned content through the unchanged Zod contract.

Provider input excludes student/classroom identity, raw events, teacher marks/feedback, test IDs, and hidden inputs/expected/actual output. Labrix does not log API keys, prompts, submitted source, request bodies, or raw provider responses. Output remains transient, editable, discardable, non-authoritative, and unable to assign marks or publish feedback. This decision does not designate Groq as the institutional production provider or claim enterprise residency, retention, or training-use guarantees; D-013 remains unresolved for production governance and evaluation.

Generation is restricted to an explicit teacher click on one owner-authorized submission. A process-local guard allows one active generation per teacher; overlap and Groq 429 are rejected without retry, queueing, persistence, or page failure. No student, submission-completion, review-queue, progress, or class-wide bulk path invokes AI. Free-tier Groq is approved only for low-volume demonstration and is not suitable for automatic processing of 30–60 simultaneous submissions.

Deterministic domain code remains the sole producer of evidence facts and integrity review signals. Groq may explain supplied facts/signals, ground viva questions in code plus evidence, draft constructive feedback, and suggest manual teacher inspection. It cannot create, recalculate, replace, reclassify, or add facts, signal reasons, thresholds, categories, guilt scores, or verdicts, and its output never feeds the deterministic signal calculation.

### D-025 — Transient anonymous-aggregate class summary v1

**Accepted 2026-08-14.** A classroom-owning teacher may explicitly generate one transient class summary for one published practical from the students/progress route. Page rendering, submission completion, student actions, and background work never invoke it. The same process-local per-teacher guard prevents overlapping review-brief or class-summary requests; no queue, bulk generation, retry loop, or persistence is added.

Labrix computes all aggregates, deterministic integrity-category counts, and group membership before provider dispatch. Top verified membership requires a latest suggested score of at least 8.0/10, a published review, and no `HIGH_REVIEW_PRIORITY` category. Needs attention includes no submission, score below 5.0/10, hidden aggregate failure, high review priority, or review not published. These rules are versioned application behavior; AI may explain them but cannot select, remove, rank, or identify students.

Provider input contains practical title/instructions and anonymous class-level counters only. It excludes student/classroom identity, submitted source, raw events, test identifiers and hidden inputs/expected/actual output, marks, and feedback. Names and submission links are joined from the deterministic owner-only DTO after the provider call. The eight-section output is Zod-validated, editable, discardable, non-authoritative, and transient. Fake remains default/tests; explicit Groq remains a low-volume prototype under D-024 and D-013, with the same timeout and safe 429 behavior.

The summary uses neutral **needs attention**, **review priority**, and **top verified performers** wording. It cannot create evidence facts or integrity signals, make a cheating/plagiarism/guilt verdict, award marks, or publish feedback.

### D-026 — Deterministic teacher attention group presentation

**Accepted 2026-08-14.** The classroom-owning teacher's published-practical progress page may render compact top verified performers and needs-attention groups directly from the Phase AI-4 deterministic analytics. Rendering never invokes AI and never labels AI as the group source.

Top verified requires a submitted latest attempt, a suggested score of at least 8.0/10, published review, no `HIGH_REVIEW_PRIORITY` category, and no failed hidden aggregate when hidden counters are available. Unavailable legacy hidden counters do not invent a failure. Needs attention includes no submission, score below 5.0/10, failed hidden aggregate, high review priority, or review not published. Each displayed group is reproducibly ordered and limited to five while retaining its total count.

The teacher-only DTO may include display name, submission reference, latest attempt/status, suggested score, hidden pass/total aggregate or unavailable state, review status, integrity category, and neutral reason codes. It excludes source, raw events, test IDs, hidden input/expected/actual output, marks, and feedback text. Student DTOs and pages receive no group projection.

## Proposed / unresolved

### D-009 — Evidence policy

Approve event fields beyond the five foundation events, student notice/consent, access, retention, deletion/export, thresholds, annotations, and audit requirements.

### D-010 — Draft concurrency and recovery

The slice uses one draft per coding session with debounced server saves. Decide multi-tab/device conflict behavior, offline support, save history, and recovery guarantees.

### D-011 — Remaining submission policy

The slice permits numbered resubmissions, deduplicates retried requests, and classifies late attempts under D-020. Define allowed-attempt limits, grace rules, timezone presentation, practical versioning, and result-disclosure policy.

### D-012 — Execution provider and limits

Select build/buy/provider, compiler versions, queue/concurrency targets, resource/network/filesystem limits, retention, observability, and outage behavior.

### D-013 — AI provider and governance

Select provider/model, data region/retention, training-use policy, redaction, prompt/version storage, cost limits, human review, evaluation, and prompt-injection defenses.
