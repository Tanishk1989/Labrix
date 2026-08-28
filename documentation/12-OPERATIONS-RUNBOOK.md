# TRACE production operations runbook

This runbook is the minimum operating procedure for a real class. Do not open enrollment until every release check and restore drill below has passed in the target environment.

## Service readiness

- `GET /api/health` must return HTTP 200 and `status: healthy`.
- A 503 means the database, required configuration, or either production runner is unavailable. Stop new submissions and investigate; do not route around this check.
- Java and C++ workers expose `GET /healthz`. Keep worker ports private and expose execution endpoints only through an HTTPS reverse proxy.
- Production health must report at least one recent execution-worker heartbeat and nonzero queue capacity. Zero workers is a 503 even when both compiler endpoints answer.
- Alert when the oldest queued job exceeds 45 seconds, any job remains running beyond its lease, or failed-job count increases.
- Alert after two consecutive health failures or when database latency remains above 500 ms for five minutes.

## Backup schedule

Run `npm run db:backup -- --output <protected-directory>` at least daily and immediately before every migration. The command creates a SQL dump and SHA-256 metadata sidecar.

- Store both files together in encrypted, access-controlled storage outside the application host.
- Retain daily backups for 30 days and monthly backups for one academic year, subject to the institution's policy.
- A local backup is not a disaster-recovery copy.
- Alert if no successful backup has been uploaded in 26 hours.

## Restore drill

Restore only into an empty, isolated verification database first:

```powershell
$env:RESTORE_DATABASE_URL = "postgresql://.../trace_restore_test"
npm run db:restore -- --file <backup.sql> --confirm-database trace_restore_test
npx prisma migrate status --schema=backend/prisma/schema.prisma
```

The restore refuses to run without the matching checksum metadata and the exact database-name confirmation. Perform and record a restore drill before launch and once per term. Never use a production URL for a drill.

## Deployment and rollback

1. Take and upload a verified backup.
2. Run the CI release gate and `prisma migrate deploy` with the direct database URL.
3. Deploy one web instance, wait for `/api/health`, then expand traffic.
4. Run a teacher sign-in, class creation, student join, visible test run, and submission smoke test.
5. If health or smoke checks fail, stop traffic to the new web image and restore the prior image. Database migrations are add-only; do not run an improvised down migration.

## Incident response

1. Disable enrollment or submission access at the edge if integrity or privacy is at risk.
2. Preserve JSON application logs, Clerk delivery IDs, runner health, database metrics, and relevant immutable audit rows.
3. Rotate affected Clerk, runner, or Upstash credentials. If the optional external AI integration has been explicitly enabled, rotate that provider credential too. Never paste secrets into tickets or chat.
4. Identify affected users and timestamps from server-owned audit records, not browser claims.
5. Restore service only after health and the role-specific smoke tests pass.
6. Record impact, cause, remediation, and follow-up owner. Follow institutional breach-notification rules.

## Privacy and retention

- Application logs must contain event names and opaque identifiers, never source code, prompts, credentials, join codes, email bodies, or request payloads.
- Grant production database and log access only to named operators.
- At course close, archive or delete student data according to the institution's retention policy. TRACE does not automatically decide that policy for the operator.
- Demo fixtures must never be loaded into the production database.

## Pre-class checklist

- Health is green from outside the hosting network.
- Latest backup is off-host and its restore has been tested.
- Clerk webhook delivery succeeds and an administrator-assigned teacher role reaches the teacher dashboard.
- Both languages pass one real visible-test execution.
- Queue capacity matches expected class size; overload returns a controlled retry response.
- A second operator knows how to disable traffic, rotate secrets, and restore the prior image.
