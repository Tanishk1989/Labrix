# Labrix

Labrix is a teacher-first, process-aware coding lab platform that captures the student’s coding journey and converts it into actionable evidence, feedback, and viva guidance for teachers.

The core workflow is:

**Classroom → Practical → Coding Session → Run/Feedback → Submission → Evidence → Teacher Review**

Labrix presents evidence for teacher judgment. It does not declare cheating or automatically block copy/paste. Pulse, CodePulse, and CodeClass are legacy product names.

## Current repository state

- **Implemented:** Next.js classroom/practical persistence; Monaco workspace for the seeded practical; server-autosaved and resumable drafts; numbered coding sessions; server-owned deterministic execution boundary; immutable submission attempts and result snapshots; five foundation timeline events; database-backed teacher progress/review; server-side membership and teacher-ownership checks for this slice.
- **Partial:** identity uses fixed non-production server-owned demo actors rather than real authentication; classroom overview summary counts do not yet consume persisted attempts; practical management is incomplete; only the seeded vertical slice has replaced the broad legacy catch-all.
- **Mock:** execution results are simulated from deterministic source markers. Java and C++ are not compiled or executed. The visible role selector changes demo presentation and is not authentication.
- **Planned:** production authentication, isolated execution, broader task/submission navigation, deterministic evidence signals, AI-assisted explanation/feedback/viva generation, and pilot hardening.
- **Out of scope for the MVP:** screen/webcam recording, gamification, mobile coding, cross-institution plagiarism detection, automatic guilt verdicts, and automatic copy/paste blocking.

See [docs/02-MVP.md](docs/02-MVP.md) for the complete boundary.

## Stack

- Next.js 16.3 App Router, React 19.2, strict TypeScript, Tailwind CSS 4
- PostgreSQL through Prisma 6
- Monaco through `@monaco-editor/react`
- React Hook Form and Zod
- Vitest unit/integration tests and Playwright browser tests

## Local development

Provide a PostgreSQL `DATABASE_URL` in an ignored local environment file. Never commit it.

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://127.0.0.1:3000/classes`. The seeded actor resolver and role preview are explicitly non-production.

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

