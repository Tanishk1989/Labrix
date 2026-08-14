# Labrix

Labrix is a teacher-first, process-aware coding lab platform that captures the student’s coding journey and converts it into actionable evidence, feedback, and viva guidance for teachers.

The core workflow is:

**Classroom → Practical → Coding Session → Run/Feedback → Submission → Evidence → Teacher Review**

Labrix presents evidence for teacher judgment. It does not declare cheating or automatically block copy/paste. Pulse, CodePulse, and CodeClass are legacy product names.

## Current repository state

- **Implemented:** Next.js classroom/practical persistence; visible/hidden test authoring for the single-problem model; Monaco workspace for the seeded practical; change-aware server-autosaved and resumable drafts; numbered coding sessions; server-owned deterministic execution boundary with honest runtime mode disclosure; immutable submission attempts and result snapshots with visibility counters and a suggested equal-weight test score; five foundation timeline events; deterministic evidence facts and neutral integrity-review priority; a transient teacher-only review brief/viva draft with a fake default and explicitly configured prototype Groq adapter; database-backed teacher and student dashboards, classroom/practical lists, progress, submission history/review, and workspace views; teacher-authored draft/published marks and feedback per immutable attempt; server-side membership and teacher-ownership checks; Clerk SDK/configuration and sign-in/sign-up shell; join-code student onboarding; provider-neutral authenticated actor resolution for linked users; local account-status enforcement; controlled identity linking; and guarded administrator teacher provisioning.
- **Partial:** production authentication still needs a security acceptance pass and operational secret-management procedure. `demo` remains an explicit non-production resolver mode; `clerk` resolves linked Labrix users and onboards unlinked students through a valid join code. Practical authoring remains intentionally limited to the current single-problem data model. Separate loopback-only local Java and C++ workers can compile and execute code in disposable locked-down Docker containers, but both are opt-in development proofs rather than a production execution system.
- **Mock:** execution results still use the default deterministic provider and simulated source markers. The UI identifies it as **Simulated execution**. Real Java and C++ execution require explicit local `java-http` or `cpp-http` selection and a separately started worker. The visible role selector changes demo presentation and is not authentication.
- **Planned:** authentication security hardening, production-isolated execution, practical-authoring completion, institutional AI provider governance/evaluation beyond the prototype Groq adapter, broader evidence summaries, and pilot hardening.
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

For non-production recovery, explicitly enable the generic linker and identify the local user by ID. It never matches email or changes roles and is disabled in production:

```bash
LABRIX_ALLOW_IDENTITY_LINKING=true npm run auth:link-clerk -- --user-id demo-student-1 --clerk-subject <verified-clerk-user-id> --confirm LINK_EXTERNAL_IDENTITY
```

Provision a pilot teacher through the guarded administrator command. Creation never links an existing account by email; linking an existing teacher requires its explicit Labrix user ID:

```bash
LABRIX_ALLOW_TEACHER_PROVISIONING=true npm run auth:provision-teacher -- --name "Pilot Teacher" --email teacher@example.com --clerk-subject <verified-clerk-user-id> --confirm PROVISION_TEACHER
LABRIX_ALLOW_TEACHER_PROVISIONING=true npm run auth:provision-teacher -- --user-id <existing-active-teacher-id> --clerk-subject <verified-clerk-user-id> --confirm PROVISION_TEACHER
```

Use a different Clerk account for each mapping. Duplicate subjects, student targets, disabled users, email collisions, and conflicting mappings are rejected.

Checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For production configuration, migration order, health checks, forbidden demo commands, and backup/rollback guidance, follow [docs/12-DEPLOYMENT.md](docs/12-DEPLOYMENT.md).

`npm test` is unit-only and does not use PostgreSQL. Database integration and full Playwright tests are mutating and require an explicitly confirmed disposable database. `npm run test:acceptance:read-only` uses separate Clerk teacher/student storage states to verify signed-out and core authenticated navigation without seeding, migrating, clicking Run/Submit, or changing existing fixtures. See [docs/08-VERIFICATION.md](docs/08-VERIFICATION.md) for its prerequisites and before running `npm run test:integration` or `npm run test:e2e`.

For the opt-in local Java runner, pull the pinned JDK image and start the worker in a separate terminal:

```bash
npm run runner:java:pull
npm run runner:java
```

Then set `LABRIX_EXECUTION_PROVIDER=java-http` and the loopback URL shown in `.env.example` for the Next.js process. The mock provider remains the default. See [docs/09-JAVA-RUNNER-SPIKE.md](docs/09-JAVA-RUNNER-SPIKE.md) for limits, smoke verification, and local-only caveats.

For the opt-in local C++ runner, pull the pinned GCC image and start its separate worker:

```bash
npm run runner:cpp:pull
npm run runner:cpp
```

Then set `LABRIX_EXECUTION_PROVIDER=cpp-http` and the C++ loopback URL shown in `.env.example`. See [docs/10-CPP-RUNNER-SPIKE.md](docs/10-CPP-RUNNER-SPIKE.md) for the native-code limits and remaining local-only caveats.

C++ workspace acceptance is database-mutating and requires the same disposable-database guard as integration tests. After preparing `LABRIX_TEST_DATABASE_URL`, run `npm run test:acceptance:cpp-workspace`; it starts the C++ worker itself and does not use Next.js or Playwright.

Workspace-level Java acceptance is database-mutating and therefore requires the disposable-database guard. After configuring and preparing `LABRIX_TEST_DATABASE_URL`, use `npm run test:acceptance:java-workspace` for the targeted service/persistence proof or `npm run acceptance:java-workspace:dev` for a guarded manual workspace session. Neither command permits the configured development/demo database.

## Safety boundary

Untrusted student code must never execute inside Next.js. `ServerMockExecutionProvider` only simulates outcomes. Production execution requires a separate isolated provider or sandbox with explicit resource and network controls.

The optional `java-http` and `cpp-http` adapters talk only to their separate loopback Docker workers; Next.js never starts a compiler, runtime, Docker, a shell, or a child process. These local single-flight workers are not production execution. See [docs/09-JAVA-RUNNER-SPIKE.md](docs/09-JAVA-RUNNER-SPIKE.md) and [docs/10-CPP-RUNNER-SPIKE.md](docs/10-CPP-RUNNER-SPIKE.md); leaving `LABRIX_EXECUTION_PROVIDER` unset or set to `mock` preserves current behavior.

Production rejects both local adapters unless `LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION=true` is set exactly. That exceptional acknowledgment does not make them production-ready and never relaxes the HTTP loopback restriction. See [docs/11-EXECUTION-PROVIDER-SAFETY.md](docs/11-EXECUTION-PROVIDER-SAFETY.md).

Submission attempts and result snapshots are protected from updates by database triggers. Repeated submission requests are deduplicated by a student-scoped idempotency key; a later resubmission creates a new numbered attempt.

AI review briefs are generated only when a classroom-owning teacher opens one submission and clicks **Generate brief**. Fake remains the default. The opt-in Groq integration is a one-at-a-time prototype for low-volume demos: there is no post-submission generation, class-wide bulk action, background queue, student action, or automatic retry. A process-local per-teacher guard rejects overlapping requests, while Groq rate limits return a safe retry-later message and leave the review page usable.

AI may explain the deterministic evidence facts and integrity review signals already supplied by Labrix, use them with the submitted code for viva questions, draft constructive feedback, and suggest manual inspection points. AI never calculates, replaces, reclassifies, or adds evidence facts or integrity signals and never produces a cheating verdict or guilt score.

## Documentation

- [Product](docs/01-PRODUCT.md)
- [MVP and implementation status](docs/02-MVP.md)
- [User flows](docs/03-USER-FLOWS.md)
- [Architecture](docs/04-ARCHITECTURE.md)
- [AI and evidence system](docs/05-AI-EVIDENCE-SYSTEM.md)
- [Roadmap](docs/06-ROADMAP.md)
- [Decisions](docs/07-DECISIONS.md)
- [Verification workflow](docs/08-VERIFICATION.md)
- [Local Java runner spike](docs/09-JAVA-RUNNER-SPIKE.md)
- [Contributing](CONTRIBUTING.md)
