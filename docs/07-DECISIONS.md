# Decisions

Use this log for product or technical choices that affect scope, data, safety, or architecture. “Accepted” entries are current constraints; “Proposed” entries still require owner approval.

## Accepted

### D-001 — Teacher-first workflow

Pulse centers Classroom → Practical → Coding Session → Run/Feedback → Submission → Evidence → Teacher Review. Student tooling serves this classroom review loop.

### D-002 — Evidence is not a verdict

Pulse presents neutral, inspectable facts and deterministic signals. It does not declare cheating, compute guilt, or automate sanctions. Copy/paste is not automatically blocked.

### D-003 — Immutable attempts and persistent drafts

Student drafts are recoverable mutable work. Each explicit submission creates an immutable attempt with the snapshots required for historical review.

### D-004 — Isolated execution

Untrusted code never runs inside the Next.js process. Production execution uses an isolated provider or sandbox behind `ExecutionProvider`.

### D-005 — Deterministic facts, advisory AI

Rules calculate measurable evidence. AI may explain, summarize, draft feedback, and generate viva questions; its output is labeled, reviewable, and non-authoritative.

### D-006 — Preserve the current stack

The MVP continues with Next.js/React/TypeScript, Prisma/PostgreSQL, Monaco, Zod, Vitest, and Playwright unless a later accepted decision records a change.

### D-007 — Explicit MVP exclusions

Screen recording, webcam monitoring, gamification, mobile coding, cross-institution plagiarism, and automated guilt verdicts are outside the MVP.

## Proposed / unresolved

### D-008 — Authentication and account lifecycle

Choose the authentication library/provider, institution onboarding, role assignment, session policy, account recovery, and whether pilot roles are global or solely membership-based.

### D-009 — Evidence policy

Approve exact event fields, student notice/consent, access roles, retention period, deletion/export behavior, threshold ownership, teacher annotations, and audit requirements before production collection.

### D-010 — Draft/session identity and concurrency

Decide whether a draft is unique per student/practical/language or per coding session, how multiple tabs/devices merge, autosave cadence, offline behavior, and recovery/version history.

### D-011 — Submission and deadline semantics

Define idempotency keys, allowed re-submissions, attempt numbering, late/grace rules, timezone source, practical edits after release, and which execution snapshot is required at submit time.

### D-012 — Execution provider and limits

Select build/buy/provider, supported compiler versions, queue and concurrency targets, resource/network/filesystem limits, test visibility, retention, observability, and outage behavior.

### D-013 — AI provider and governance

Select provider/model, data region and retention, training-use policy, redaction, prompt/version storage, cost limits, human-review UX, evaluation thresholds, and source-code prompt-injection defenses.

### D-014 — Product naming migration

The product is now called Pulse, while the package, UI, storage keys, seed emails, errors, and older docs still use CodeClass/coding-classroom. Decide when and how to migrate naming without bundling it into unrelated feature work.

### D-015 — Test visibility and assessment model

The schema has a `visible` flag but current authoring creates visible tests only. Decide whether hidden tests, grading, rubrics, and result disclosure remain post-MVP.

