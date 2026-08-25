# TRACE

> *“Trace the work, not the screen.”*

TRACE is a modern, developer-focused programming lab and code-assessment platform for university classrooms. Teachers create programming practicals, students write, run, and submit code in an autosaved workspace, and teachers review submissions using execution results, timeline activity signals, progress, and rubric feedback.

The core student journey is:

**EDIT → RUN → SUBMIT → REVIEW → FEEDBACK**

TRACE presents clear evidence and activity signals for teacher judgment. It does not perform invasive screen recording, declare cheating, or automatically block copy/paste. *Labrix*, *Pulse*, *CodePulse*, and *CodeClass* are legacy names.

## Current repository state

- **Implemented:** Next.js classroom/practical persistence; optional visible/hidden test authoring for the single-problem model; Monaco workspace for the seeded practical; change-aware server-autosaved and resumable drafts; numbered coding sessions; server-owned deterministic execution boundary with honest runtime mode disclosure; immutable submission attempts and result snapshots with visibility counters and a suggested equal-weight test score when tests exist; five foundation timeline events; database-backed teacher and student dashboards, classroom/practical lists, progress, submission history/review, and workspace views; configurable practical marks, optional 2–5 criterion rubrics, and append-only teacher-review revisions per immutable attempt; server-side membership and teacher-ownership checks; Clerk SDK/configuration and sign-in/sign-up shell; join-code student onboarding; provider-neutral authenticated actor resolution for linked users; local account-status enforcement; and controlled identity linking.
- **Production boundary:** deployed builds use Clerk without identity fallback. Teacher access is granted only through administrator-controlled Clerk public metadata, while students join through a valid classroom code. Production execution uses authenticated HTTPS runner services with bounded queues; loopback Java and C++ workers remain development-only. Practical authoring intentionally uses the current single-problem data model.
- **Durable execution:** production Run and Submit actions are PostgreSQL-backed jobs processed by a separate Google Cloud execution worker. Students see queue/running status, and browser or web deployments do not own execution-job lifetime.
- **Mock by default:** ordinary development still uses the deterministic simulated provider. For an honest local demonstration, `npm run demo:real` starts both isolated Docker workers and routes Java/C++ by the submitted language without falling back to simulation. **Preview as teacher/student** is available only on routes that render both demo views; it changes presentation and is not authentication. Role-specific routes remain tied to their fixed demo actor.
- **Operational requirement:** configure Clerk, Upstash rate limiting, PostgreSQL backups, and both runner services, then complete the release and pre-class checks in [documentation/12-OPERATIONS-RUNBOOK.md](documentation/12-OPERATIONS-RUNBOOK.md).
- **Out of scope for the MVP:** screen/webcam recording, gamification, mobile coding, cross-institution plagiarism detection, automatic guilt verdicts, and automatic copy/paste blocking.

See [documentation/02-MVP.md](documentation/02-MVP.md) for the complete boundary. Follow [documentation/13-GOOGLE-CLOUD-PRODUCTION.md](documentation/13-GOOGLE-CLOUD-PRODUCTION.md) for the low-cost production deployment.

The public landing page is `/`. Canonical protected product routes are `/dashboard`, `/classes`, `/practicals`, `/progress`, `/submissions`, `/classes/[classroomId]`, `/classes/[classroomId]/students`, `/tasks/[taskId]`, and `/submissions/[submissionId]`; unmatched paths return a 404.

## Stack

- Next.js 16.3 App Router, React 19.2, strict TypeScript, Tailwind CSS 4
- PostgreSQL through Prisma 6
- Clerk Next.js SDK for external identity and secure sessions
- Monaco through `@monaco-editor/react`
- React Hook Form and Zod
- Vitest unit/integration tests and Playwright browser tests

## Local development

Copy the variable names from `.env.example` into an ignored `.env.local`; provide `DATABASE_URL`, Clerk development-instance keys, and an explicit `LABRIX_IDENTITY_MODE`. Never commit values.

Configure Clerk to deliver `user.created`, `user.updated`, and `user.deleted` events to `/api/webhooks/clerk`. Grant instructor access by setting `public_metadata.role` to `TEACHER` in the Clerk dashboard; user-editable unsafe metadata never grants the teacher role.

For low-latency local development, use the one-command pinned PostgreSQL workflow:

```bash
npm run dev:local
```

`dev:local` starts the container, waits for PostgreSQL, applies migrations, regenerates Prisma Client, seeds only a fresh local database, verifies the demo fixtures, and then opens Next.js. The container listens only on `127.0.0.1:54329`, persists data in the `labrix_postgres_data` Docker volume, and uses a local-only credential. If existing fixtures are incomplete, startup stops instead of silently resetting work; `npm run db:local:prepare` is the explicit recovery command and resets only the seeded demo scenario. Use `npm run db:local:down` to stop the container without deleting its volume. Keep shared/staging database URLs out of local development processes.

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The generic `npm run dev` path checks the configured database and migration status before starting Next.js. It fails in the terminal with a recovery action instead of opening a product shell that cannot load data.

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
npm run build
```

`npm test` is unit-only and does not use PostgreSQL. Database integration and full Playwright tests are mutating and require an explicitly confirmed disposable database; `npm run test:acceptance:read-only` provides a non-mutating seeded-route smoke check. See [documentation/08-VERIFICATION.md](documentation/08-VERIFICATION.md) before running `npm run test:integration` or `npm run test:e2e`.

For the opt-in local Java runner, pull the pinned JDK image and start the worker in a separate terminal:

```bash
npm run runner:java:pull
npm run runner:java
```

Then set `LABRIX_EXECUTION_PROVIDER=java-http` and the loopback URL shown in `.env.example` for the Next.js process. The mock provider remains the default. See [documentation/09-JAVA-RUNNER-SPIKE.md](documentation/09-JAVA-RUNNER-SPIKE.md) for limits, smoke verification, and local-only caveats.

For the opt-in local C++ runner, pull the pinned GCC image and start its separate worker:

```bash
npm run runner:cpp:pull
npm run runner:cpp
```

Then set `LABRIX_EXECUTION_PROVIDER=cpp-http` and the C++ loopback URL shown in `.env.example`. See [documentation/10-CPP-RUNNER-SPIKE.md](documentation/10-CPP-RUNNER-SPIKE.md) for the native-code limits and remaining local-only caveats.

C++ workspace acceptance is database-mutating and requires the same disposable-database guard as integration tests. After preparing `LABRIX_TEST_DATABASE_URL`, run `npm run test:acceptance:cpp-workspace`; it starts the C++ worker itself and does not use Next.js or Playwright.

For a supervised local demonstration with real execution in both languages, first pull both pinned images, then start the complete stack:

```bash
npm run runner:java:pull
npm run runner:cpp:pull
npm run demo:real
```

`demo:real` verifies the seeded database, Docker, and both images; creates an optimized Next.js build; starts the Java and C++ workers with restricted non-application environments; waits for both health checks; and serves the app with `next start` on loopback using `local-docker`. Java submissions go only to the Java worker and C++ submissions go only to the C++ worker. If either worker stops, the launcher shuts down the demo rather than silently reverting to simulated results. The UI labels this supervised local mode, and the launcher uses exact, local-demo-only acknowledgements for the demo identity and local runners. This remains a local single-flight demonstration, not a production execution service.

Workspace-level Java acceptance is database-mutating and therefore requires the disposable-database guard. After configuring and preparing `LABRIX_TEST_DATABASE_URL`, use `npm run test:acceptance:java-workspace` for the targeted service/persistence proof or `npm run acceptance:java-workspace:dev` for a guarded manual workspace session. Neither command permits the configured development/demo database.

## Safety boundary

Untrusted student code must never execute inside Next.js. `ServerMockExecutionProvider` only simulates outcomes. Production execution requires a separate isolated provider or sandbox with explicit resource and network controls.

The optional `java-http` and `cpp-http` adapters talk only to separate loopback Docker workers for development. Production uses `remote-docker`, authenticated HTTPS runner endpoints, and bounded worker queues; Next.js never starts a compiler, runtime, Docker, shell, or child process. See [documentation/11-EXECUTION-PROVIDER-SAFETY.md](documentation/11-EXECUTION-PROVIDER-SAFETY.md) and [documentation/12-OPERATIONS-RUNBOOK.md](documentation/12-OPERATIONS-RUNBOOK.md). Leaving the provider unset preserves mock behavior only outside production.

Production rejects both local adapters unless `LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION=true` is set exactly. That exceptional acknowledgment does not make them production-ready and never relaxes the HTTP loopback restriction. See [documentation/11-EXECUTION-PROVIDER-SAFETY.md](documentation/11-EXECUTION-PROVIDER-SAFETY.md).

Submission attempts and result snapshots are protected from updates by database triggers. Repeated submission requests are deduplicated by a student-scoped idempotency key; a later resubmission creates a new numbered attempt.

## Documentation

- [Product](documentation/01-PRODUCT.md)
- [MVP and implementation status](documentation/02-MVP.md)
- [User flows](documentation/03-USER-FLOWS.md)
- [Architecture](documentation/04-ARCHITECTURE.md)
- [AI and evidence system](documentation/05-AI-EVIDENCE-SYSTEM.md)
- [Roadmap](documentation/06-ROADMAP.md)
- [Decisions](documentation/07-DECISIONS.md)
- [Verification workflow](documentation/08-VERIFICATION.md)
- [Local Java runner spike](documentation/09-JAVA-RUNNER-SPIKE.md)
- [Contributing](CONTRIBUTING.md)
