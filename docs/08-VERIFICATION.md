# Verification workflow

Labrix separates fast checks from database-mutating verification. Unit tests and static checks are safe on any checkout; integration and full browser tests require a disposable PostgreSQL database that is not the configured development/demo database.

## Verification matrix

| Layer | Command | Database behavior | When to run |
| --- | --- | --- | --- |
| Lint | `npm run lint` | None | Every change |
| Typecheck | `npm run typecheck` | None | Every change |
| Unit | `npm test` or `npm run test:unit` | None | Every change |
| C++ runner smoke | `npm run test:runner:cpp` | None; starts disposable Docker containers | Local C++ worker implementation or safety changes |
| C++ workspace acceptance | `npm run test:acceptance:cpp-workspace` | Creates and removes isolated C++ workspace/run/result/submission fixtures | Local C++ runner through the existing service/persistence boundary |
| Integration | `npm run test:integration` | Creates and removes isolated fixture rows; files run serially | Persistence, authorization, transaction, or service changes |
| Java workspace acceptance | `npm run test:acceptance:java-workspace` | Creates and removes isolated workspace/run/result/submission fixtures | Local Docker Java runner through the existing service/persistence boundary |
| Build | `npm run build` | No intended writes | Route, server, dependency, or deployment-sensitive changes |
| Read-only acceptance | `npm run test:acceptance:read-only` | Reads the configured demo database; never opens a workspace or clicks Run/Submit | Safe route smoke check when seeded demo data is available |
| Full Playwright | `npm run test:e2e` | Edits drafts and creates run/submission records | Only against a disposable database |
| Manual acceptance | Follow the relevant route checklist | Depends on actions taken | UX, authentication, and professor-demo confirmation |

`npm run test:all` runs unit tests followed by guarded integration tests. It therefore requires the disposable database configuration below.

## Disposable database setup

1. Create a temporary local PostgreSQL database or a disposable Neon branch. Do not reuse the normal Labrix demo/development database.
2. Put only these local values in ignored `.env.test.local`, or export them in the current shell:

   ```dotenv
   LABRIX_TEST_DATABASE_URL=postgresql://...
   LABRIX_ALLOW_TEST_DATABASE_MUTATION=true
   ```

3. Apply the repository's existing migrations and disposable demo fixtures:

   ```bash
   npm run test:db:prepare
   ```

   This guarded command runs `prisma migrate deploy`, then seeds only the disposable database. The fixtures are required because the current integration/browser suites reference the seeded demo actors and classroom.

4. Run integration or full browser verification:

   ```bash
   npm run test:integration
   npm run test:e2e
   ```

5. Delete the disposable database/branch when verification is complete.

The guard refuses missing confirmation, missing/non-PostgreSQL test URLs, a test URL equal to the configured development/demo URL, or a child process that is not actually using the test URL. It never prints connection-string values.

## Targeted commands

Pass a specific integration file after `--`; the same disposable-database guard and serial configuration still apply:

```bash
npm run test:integration -- tests/integration/submission-review.test.ts
```

The read-only acceptance command checks dashboard, classes, classroom progress, and review-queue routes. It intentionally excludes the coding workspace because opening or interacting with that page can create or change persisted attempt state.

Full Playwright refuses to reuse an already-running server. This prevents an isolated test command from silently connecting to a server that was started with the shared demo database.

## Local C++ runner smoke

Pull the digest-pinned compiler image and run the targeted Docker-backed suite:

```bash
npm run runner:cpp:pull
npm run test:runner:cpp
```

The suite starts the C++ worker on an ephemeral loopback port and verifies compile-once success across ordered visible/hidden inputs, compiler failure, non-zero native exit, timeout, fixed-limit validation, and single-flight rejection. It does not load Prisma, connect to PostgreSQL, mutate Labrix data, start Next.js, or run Playwright. Workspace/persistence acceptance is not part of Phase 16B.

## Local C++ workspace acceptance

This acceptance is database-mutating and uses the same guard as integration tests. Configure `LABRIX_TEST_DATABASE_URL` for a disposable PostgreSQL database distinct from development/demo data and set `LABRIX_ALLOW_TEST_DATABASE_MUTATION=true`. Then run:

```bash
npm run test:db:prepare
npm run runner:cpp:pull
npm run test:acceptance:cpp-workspace
```

The targeted non-Playwright test starts the Phase 16B worker on an ephemeral loopback port, selects `cpp-http` through normal environment-based provider resolution, and calls `runStudentDraft` and `submitStudentDraft`. It verifies C++ success, compilation error, runtime error, timeout, persisted `RunAttempt`/`ResultSnapshot` mapping, visible-only Run, visible-plus-hidden Submit, hidden-detail redaction from the student result, and mock selection when the provider variable is unset. The fixture task and all related rows are uniquely named and removed after the suite.

Do not point the acceptance command at a shared development/demo database, bypass its guard, or run full Playwright for this proof.

## Local Java workspace acceptance

This acceptance is intentionally non-Playwright but database-mutating. It uses the same `LABRIX_TEST_DATABASE_URL` and `LABRIX_ALLOW_TEST_DATABASE_MUTATION=true` guard as integration tests, and it refuses a test database matching the configured development/demo database.

Prepare the disposable database and pinned runner image:

```bash
npm run test:db:prepare
npm run runner:java:pull
```

Run only the Java workspace service/persistence acceptance:

```bash
npm run test:acceptance:java-workspace
```

The test starts the Phase 15B HTTP runner on an ephemeral loopback port, selects `java-http` through environment-based default provider resolution, and calls the existing `runStudentDraft` and `submitStudentDraft` services. It proves all four Java states, persisted `RunAttempt`/`ResultSnapshot` mapping, visible-only Run, visible-plus-hidden Submit with student redaction, and mock selection when the provider variable is absent. It neither starts Next.js nor uses Playwright.

For manual workspace acceptance against the same prepared disposable database:

```bash
npm run acceptance:java-workspace:dev
```

The supervised launcher verifies Docker and the pinned image, starts the Java runner with a restricted non-application environment, waits for `/healthz`, then starts Next.js with `LABRIX_EXECUTION_PROVIDER=java-http`, the loopback runner URL, demo identity, and `DATABASE_URL` forced to the confirmed disposable test URL. Open `http://127.0.0.1:3000/tasks/two-sum`; Run and Submit will mutate only that disposable database. Press Ctrl+C to stop both processes.

Do not run the full Playwright suite for this proof, and do not bypass the guard by pointing `LABRIX_TEST_DATABASE_URL` at shared demo/development data.
