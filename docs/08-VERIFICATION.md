# Verification workflow

Labrix separates fast checks from database-mutating verification. Unit tests and static checks are safe on any checkout; integration and full browser tests require a disposable PostgreSQL database that is not the configured development/demo database.

## Verification matrix

| Layer | Command | Database behavior | When to run |
| --- | --- | --- | --- |
| Lint | `npm run lint` | None | Every change |
| Typecheck | `npm run typecheck` | None | Every change |
| Unit | `npm test` or `npm run test:unit` | None | Every change |
| Integration | `npm run test:integration` | Creates and removes isolated fixture rows; files run serially | Persistence, authorization, transaction, or service changes |
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
