# MVP and implementation status

Status reflects repository evidence as of 2026-08-09.

## Implemented

- Next.js App Router application shell with responsive teacher/student demo views.
- PostgreSQL/Prisma models and an initial migration for users, classrooms, memberships, practicals, and visible test cases.
- Database-backed classroom listing/detail, classroom creation/join actions, and teacher practical draft/publish actions.
- C++ and Java as the currently modeled allowed languages.
- Monaco editor component loaded client-side.
- Zod validation for classroom and practical authoring inputs.
- Deterministic `ExecutionProvider` abstraction with unit tests; no untrusted code is executed.
- Vitest unit and Playwright browser-test configuration.

## Partial

- Routes are split between explicit database-backed classroom pages and a broad demo catch-all route.
- Classroom/practical server actions check a hard-coded demo teacher or student, not an authenticated session.
- Teacher ownership is checked for practical writes, but reusable authorization and complete read authorization are absent.
- Practical authoring persists tasks and visible tests, but editing/list management and deadline semantics are incomplete.
- Student and teacher navigation exists, but progress counts are placeholders until drafts/submissions are persisted.
- The editor updates React state, but the displayed “Draft autosaved locally” claim has no draft-storage implementation.
- The test scripts cover unit and one demo browser journey; an integration script exists without an integration suite.

## Mock

- Run results are generated from source markers such as `fail_test`, `compile_error`, and `runtime_error`; Java/C++ are not compiled.
- Student source, selected language, latest run, and review source live in one client component.
- Submission time is stored in tab `sessionStorage`; source and result snapshots are not persisted as submissions.
- Student progress and submission review use typed mock classroom data and session state.
- The role selector is a preview control, not sign-in or authorization.

## Planned for the MVP

- Real authentication plus server-side role, membership, ownership, and resource authorization.
- A database-backed student workspace that loads the published practical and visible tests.
- Persisted per-student, per-practical, per-language drafts and resumable coding sessions.
- Isolated production execution behind `ExecutionProvider`, with limits, job states, and safe feedback.
- Immutable submission attempts containing submitted source and snapshotted run/test results.
- Proportionate coding-process events and deterministic evidence signals.
- A teacher review view combining source, result snapshot, evidence timeline/summary, and neutral unusual-pattern indicators.
- AI-assisted explanation, feedback drafting, evidence summarization, and implementation-specific viva generation with provenance and human review.

## Out of scope for the MVP

- Screen recording or webcam monitoring.
- Gamification, leaderboards, badges, or streaks.
- Mobile coding as a supported authoring experience.
- Cross-institution plagiarism matching.
- Automated cheating verdicts, guilt scores, or automatic copy/paste blocking.
- Broad LMS integrations, social/chat features, hidden surveillance, or autonomous grading.

## MVP acceptance boundary

The MVP is complete only when one teacher and enrolled students can complete the full core workflow with real persistence, isolated execution, immutable attempts, neutral evidence review, and recoverable failure states. A polished demo backed by client state does not satisfy this boundary.

