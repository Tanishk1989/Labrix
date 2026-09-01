# TRACE Release & Rollback Runbook

This document defines the release verification procedure, deployment sequence, and rollback protocol for TRACE production deployments.

---

## 1. Release Verification Checklist

Run the complete test suite before tagging or deploying a release:

```bash
# 1. Typecheck and zero lint warnings
npm run typecheck
npm run lint

# 2. Comprehensive unit & accessibility test suite (260+ tests)
npm run test:unit

# 3. Isolated database integration tests
npm run test:integration

# 4. Containerized runner smoke tests
npm run test:runner:java
npm run test:runner:cpp

# 5. Production Next.js build
npm run build
```

---

## 2. Production Deployment Steps

1. **Database Migration**:
   ```bash
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   ```

2. **Database Backup**:
   Take an immutable snapshot of the production database before rolling out changes:
   ```bash
   npx tsx scripts/db-backup.ts
   ```

3. **Deploy Web Application**:
   Deploy the Next.js production build to your container runtime or Vercel environment.
   Ensure the following environment variables are set:
   - `DATABASE_URL` (Production PostgreSQL connection string with SSL)
   - `LABRIX_IDENTITY_MODE=clerk`
   - `CLERK_SECRET_KEY` & `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Production keys)
   - `CLERK_WEBHOOK_SECRET`
   - `AI_GATEWAY_POLICY_MODE=EXPLICIT_TEACHER_OPT_IN`
   - `RATE_LIMIT_REDIS_URL` or `REDIS_URL` (Optional for distributed multi-instance deployments)

4. **Post-Deployment Verification**:
   Execute the automated production smoke test against the live instance:
   ```bash
   npm run verify:production -- https://trace.your-domain.edu
   ```

5. **Club Capacity and Pre-Class Gates**:
   Run `npm run verify:club-capacity` after deploying or resizing runners. Run
   `npm run verify:preclass` immediately before enrollment opens. A blocked or
   failed result is a release no-go.

---

## 3. Rollback Procedure

If a critical fault is detected post-deployment:

1. **Traffic Reversion**:
   Point your reverse proxy / DNS / load balancer back to the previous stable release container image or Vercel deployment ID.

2. **Database Rollback**:
   If database schema or data corruption occurred, restore from the pre-deployment backup using the checksum-verified restore utility:
   ```bash
   npx tsx scripts/db-restore.ts --file ./backups/trace-backup-<timestamp>.sql
   ```

3. **Post-Rollback Health Check**:
   ```bash
   curl -i https://trace.your-domain.edu/api/health
   ```
   Verify response is `{"status":"ok","database":"connected"}` with HTTP 200.
