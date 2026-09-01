# TRACE Operations Baseline & Production Runbook

## 1. Automated Backups & Disaster Recovery

### Automated Backup Schedule
- **Frequency**: Daily at 02:00 UTC via cron or Kubernetes CronJob.
- **Tool**: `tsx scripts/db-backup.ts --output /var/backups/trace`
- **Integrity**: Every backup generates a companion `.meta.json` containing SHA256 checksum, record count, and timestamp.
- **Retention**: Keep daily backups for 30 days, weekly backups for 90 days, monthly backups for 1 year in cold S3/GCS bucket with encryption at rest.

### Tested Restore Procedure
1. Verify target database connection:
   ```bash
   npx tsx scripts/db-restore.ts --file /var/backups/trace/trace-backup-YYYY-MM-DD.sql --target-db-url "postgresql://..."
   ```
2. Verify table row counts and schema migrations with `npm run test:integration`.

---

## 2. Monitoring, Health Checks & Observability

### Endpoints
`/api/health` is public and returns only liveness, release, and timestamp.
Bearer-protected `/api/health/details` returns HTTP 200 JSON with status of:
- PostgreSQL connection & query latency
- Active execution runners (Java, C++)
- In-flight execution queue depth
- Memory RSS and heap usage

### Alerting Thresholds
| Metric | Warning Threshold | Critical Alert | Action |
| :--- | :--- | :--- | :--- |
| **Runner Queue Depth** | > 15 waiting requests | > 50 waiting requests | Scale runner containers (`docker compose up -d --scale trace-runner-java=3`) |
| **PostgreSQL Latency** | > 100ms | > 500ms | Check active locks and connection pool exhaustion |
| **Error Rate (5xx)** | > 1% in 5m window | > 5% in 5m window | Inspect error logs / roll back latest release |
| **Join Code Rate Limit Hits** | > 20/hr | > 100/hr | Possible credential/code brute force attempt |

---

## 3. Secret Rotation Procedures

### Rotating Clerk Keys
1. Generate new API secret and publishable key in Clerk Dashboard.
2. Update `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in environment.
3. Deploy new release; invalidate stale session cookies.

### Rotating Webhook Secret
1. Create a new webhook signing secret in Clerk Dashboard.
2. Update `CLERK_WEBHOOK_SECRET` in production `.env`.
3. Restart TRACE container.

### Rotating Runner Bearer Tokens
1. Update `RUNNER_BEARER_TOKEN` in `docker-compose.yml` across both runner containers and web application.
2. Re-run `docker compose up -d`.

---

## 4. Institutional Data Retention & FERPA/GDPR Compliance

1. **Student Account Deletion**:
   - Deleting a student via Clerk webhook or admin action cascades to delete identity records, drafts, and coding sessions.
   - Submitted grading artifacts retain an anonymized checksum for university accreditation if required by institutional policy.
2. **Data Export**:
   - Students and teachers can export code snapshots and review marks in JSON / CSV format.
3. **Classroom Archival**:
   - Archiving a classroom (`status = ARCHIVED`) locks all submissions, closes enrollment windows, and disables further code runs while preserving grades for audit.
