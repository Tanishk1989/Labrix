# Pulse

Pulse is a teacher-first, process-aware coding classroom. Teachers create classrooms and practicals; students write, run, and submit code; teachers review immutable attempts with lightweight process evidence and implementation-specific viva prompts.

The intended workflow is:

**Classroom → Practical → Coding Session → Run/Feedback → Submission → Evidence → Teacher Review**

Pulse presents evidence for teacher judgment. It does not declare cheating, and it does not automatically block copy/paste.

## Current repository state

This repository is a hybrid prototype, not a complete MVP.

- **Implemented:** Next.js App Router shell; PostgreSQL/Prisma persistence for users, classrooms, memberships, practicals, and visible test cases; teacher-side classroom creation and practical draft/publish actions; Monaco editor integration; unit and Playwright configuration.
- **Partial:** teacher/student routes and classroom views mix database records with demo data; authorization is limited to hard-coded demo actors; practical authoring supports create/update during one form session but has no general management UI.
- **Mock:** code execution, student submissions, progress, and submission review use deterministic client-side demo state. Student source is not compiled or run.
- **Planned:** real authentication and authorization, persistent coding sessions and drafts, immutable submission attempts, isolated execution, evidence capture and deterministic signals, teacher evidence review, AI-assisted summaries/feedback/viva questions.
- **Out of scope for the MVP:** screen or webcam recording, gamification, mobile coding, cross-institution plagiarism detection, and automated guilt verdicts.

See [docs/02-MVP.md](docs/02-MVP.md) for the detailed status boundary.

## Stack

- Next.js 16.3 App Router, React 19.2, and strict TypeScript
- Tailwind CSS 4 and Lucide React
- PostgreSQL through Prisma 6
- Monaco through `@monaco-editor/react`
- React Hook Form and Zod
- Vitest unit tests and Playwright browser tests

## Local development

Requirements: Node.js/npm and a PostgreSQL database available through `DATABASE_URL`.

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://127.0.0.1:3000/classes`. The role selector is a prototype preview, not authentication.

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm run test:integration` is defined, but no `tests/integration` suite currently exists.

## Safety boundary

Never execute untrusted student code in the Next.js process. The current `MockExecutionProvider` only produces deterministic fake results. Production execution must use a separately isolated provider or sandbox with resource limits and operational controls.

## Documentation

- [Product](docs/01-PRODUCT.md)
- [MVP and implementation status](docs/02-MVP.md)
- [User flows](docs/03-USER-FLOWS.md)
- [Architecture](docs/04-ARCHITECTURE.md)
- [AI and evidence system](docs/05-AI-EVIDENCE-SYSTEM.md)
- [Roadmap](docs/06-ROADMAP.md)
- [Decisions](docs/07-DECISIONS.md)
- [Contributing](CONTRIBUTING.md)

