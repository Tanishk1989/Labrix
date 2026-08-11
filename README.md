# Labrix

Labrix is a teacher-first, process-aware coding lab platform that captures the student’s coding journey and converts it into actionable evidence, feedback, and viva guidance for teachers.

The core workflow is:

**Classroom → Practical → Coding Session → Run/Feedback → Submission → Evidence → Teacher Review**

Labrix presents evidence for teacher judgment. It does not declare cheating or automatically block copy/paste. Pulse, CodePulse, and CodeClass are legacy product names.

## Current repository state

- **Implemented:** Next.js classroom/practical persistence; visible/hidden test authoring for the single-problem model; Monaco workspace for the seeded practical; change-aware server-autosaved and resumable drafts; numbered coding sessions; server-owned deterministic execution boundary; immutable submission attempts and result snapshots with visibility counters and a suggested equal-weight test score; five foundation timeline events; database-backed teacher and student dashboards, classroom/practical lists, progress, submission history/review, and workspace views; teacher-authored draft/published marks and feedback per immutable attempt; server-side membership and teacher-ownership checks; Clerk SDK/configuration and sign-in/sign-up shell; join-code student onboarding; provider-neutral authenticated actor resolution for linked users; local account-status enforcement; and controlled identity linking.
- **Partial:** production authentication still needs a security acceptance pass and administrator-controlled teacher provisioning. `demo` remains an explicit non-production resolver mode; `clerk` resolves linked Labrix users and onboards unlinked students through a valid join code. Practical authoring remains intentionally limited to the current single-problem data model.
- **Mock:** execution results are simulated from deterministic source markers. Java and C++ are not compiled or executed. The visible role selector changes demo presentation and is not authentication.
- **Planned:** administrator-controlled teacher provisioning, authentication security hardening, isolated execution, practical-authoring completion, deterministic evidence signals, AI-assisted explanation/feedback/viva generation, and pilot hardening.
- **Out of scope for the MVP:** screen/webcam recording, gamification, mobile coding, cross-institution plagiarism detection, automatic guilt verdicts, and automatic copy/paste blocking.

See [docs/02-MVP.md](docs/02-MVP.md) for the complete boundary.

Canonical product routes are `/dashboard`, `/classes`, `/practicals`, `/progress`, `/submissions`, `/classes/[classroomId]`, `/classes/[classroomId]/students`, `/tasks/[taskId]`, and `/submissions/[submissionId]`. The retired root demo and its two known list/history aliases redirect to these persisted routes; other unmatched paths return a 404.

## Stack

- Next.js 16.3 App Router, React 19.2, strict TypeScript, Tailwind CSS 4
- PostgreSQL through Prisma 6
- Clerk Next.js SDK for external identity and secure sessions
- Monaco through `@monaco-editor/react`
- React Hook Form and Zod
- Vitest unit/integration tests and Playwright browser tests

## Local development

Copy the variable names from `.env.example` into an ignored `.env.local`; provide `DATABASE_URL`, Clerk development-instance keys, and an explicit `LABRIX_IDENTITY_MODE`. Never commit values.

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

With `LABRIX_IDENTITY_MODE=demo`, open `http://127.0.0.1:3000/classes`; the seeded actors and role preview are explicitly non-production. With `clerk`, sign in at `/sign-in`; only explicitly linked local users can enter the product.

For local Clerk verification, explicitly link existing users using verified Clerk user IDs. The command never matches email or changes roles:

```bash
npm run auth:link-clerk -- --user-id demo-student-1 --clerk-subject <verified-clerk-user-id>
npm run auth:link-clerk -- --user-id demo-teacher --clerk-subject <verified-clerk-user-id>
```

Use a different Clerk account for each mapping. Duplicate or conflicting mappings are rejected.

Checks:

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

## Safety boundary

Untrusted student code must never execute inside Next.js. `ServerMockExecutionProvider` only simulates outcomes. Production execution requires a separate isolated provider or sandbox with explicit resource and network controls.

Submission attempts and result snapshots are protected from updates by database triggers. Repeated submission requests are deduplicated by a student-scoped idempotency key; a later resubmission creates a new numbered attempt.

## Documentation

- [Product](docs/01-PRODUCT.md)
- [MVP and implementation status](docs/02-MVP.md)
- [User flows](docs/03-USER-FLOWS.md)
- [Architecture](docs/04-ARCHITECTURE.md)
- [AI and evidence system](docs/05-AI-EVIDENCE-SYSTEM.md)
- [Roadmap](docs/06-ROADMAP.md)
- [Decisions](docs/07-DECISIONS.md)
- [Contributing](CONTRIBUTING.md)
