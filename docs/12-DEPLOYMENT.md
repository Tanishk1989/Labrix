# Production deployment checklist

Labrix production deployment is a distinct configuration from the seeded demo and local Docker runner proofs. Secrets belong in the deployment platform’s encrypted environment store and must never be committed, printed, or copied into build logs.

## Required production configuration

| Variable | Production requirement |
| --- | --- |
| `DATABASE_URL` | Dedicated PostgreSQL production database. Do not use a demo, development, or disposable verification database. |
| `LABRIX_IDENTITY_MODE` | Must be `clerk`. `demo` is rejected in production. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key from the Clerk production instance. It must be present during the frontend build and runtime. |
| `CLERK_SECRET_KEY` | Secret key from the same Clerk production instance. Runtime secret only. |
| `LABRIX_EXECUTION_PROVIDER` | Leave unset or use `mock` until a production execution provider is approved. Mock results remain clearly labelled simulated. |

`LABRIX_ALLOW_TEST_DATABASE_MUTATION` must not be `true` in production. Local Java and C++ Docker workers are not production runners. The existing exceptional `LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION=true` acknowledgment does not make them production-ready and should remain unset for a normal deployment.

Use a separate Clerk production instance from development. Configure its allowed origins, sign-in/sign-up URLs, and redirect URLs for the exact production origin. Provision teachers through the guarded administrator command using verified Clerk subjects; do not leave command allow flags enabled as persistent application environment variables.

## Build and migration flow

1. Create or select the dedicated production database and enable provider backups or point-in-time recovery.
2. Take a backup or provider snapshot before applying a new migration set.
3. Install the locked dependencies with `npm ci`.
4. Generate the Prisma client with `npm run db:generate`.
5. Review migration status with `npm run db:migrate:status`.
6. Apply committed migrations non-interactively with `npm run db:migrate:deploy`.
7. Build with the production environment configured: `npm run build`.
8. Start the immutable build artifact with `npm start`.
9. Confirm `GET /api/health` returns HTTP 200 with `{"status":"ok"}`.
10. Verify Clerk sign-in using a provisioned active teacher and a separately onboarded student.

Never run `prisma migrate dev`, `prisma migrate reset`, `npm run db:seed`, `npm run demo`, or `npm run demo:reset` against production. Do not run integration, acceptance, or Playwright commands against production data.

## Health and diagnostics

`GET /api/health` is public for infrastructure probes, non-cacheable, and returns only `ok` or `unavailable`. It validates safe configuration shape without returning environment values. It is a process/configuration health signal, not a database query or a substitute for database-provider monitoring.

Startup validation fails a production server before it becomes ready when identity mode, Clerk keys, database URL shape, test mutation settings, or execution-provider configuration are unsafe.

## Backup and rollback

- Retain a pre-deploy database snapshot and record the deployed application commit and migration set.
- Prefer a forward corrective migration. Never edit or delete migration history that may have run.
- Rolling back only the application artifact is safe only when the previous code is compatible with the migrated schema.
- If a migration causes unrecoverable data impact, stop writes, preserve logs without secrets, and follow the database provider’s reviewed restore or point-in-time recovery procedure.
- After recovery, run migration status and the health check before reopening traffic.

Production logs may include configuration variable names and safe status codes, but must never include connection strings, Clerk secret keys, runner credentials, student source, or hidden-test data.
