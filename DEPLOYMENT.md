# TRACE Production Deployment Guide

This guide outlines the production deployment procedure for TRACE across Docker, Vercel, Railway, AWS, or university self-hosted infrastructure.

---

## 1. Production Environment Variables

Configure the following environment variables in your deployment environment (e.g. `.env.production`, platform secret manager, or Docker `.env`):

```env
# Database Configuration (PostgreSQL 15+)
DATABASE_URL="postgresql://trace_user:STRONG_PASSWORD@your-db-host:5432/trace_db?schema=public&sslmode=prefer"

# Next.js Production Settings
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"

# Authentication (Clerk Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
CLERK_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Code Execution Runner Pool & Capacity
RUNNER_MAX_CONCURRENCY="4"
RUNNER_MAX_QUEUE_SIZE="64"
RUNNER_QUEUE_TIMEOUT_MS="60000"
LABRIX_EXECUTION_PROVIDER="remote-docker"
LABRIX_JAVA_RUNNER_URL="https://java-runner.example.edu/v1/execute/java"
LABRIX_CPP_RUNNER_URL="https://cpp-runner.example.edu/v1/execute/cpp"
LABRIX_RUNNER_BEARER_TOKEN="at-least-32-random-characters"

# Shared production rate limiting
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="store-in-your-secret-manager"

# Optional: Standalone Docker output
NEXT_OUTPUT_STANDALONE="true"
```

---

## 2. Clerk Production Webhook Configuration

To synchronize user creation, updates, and account status with TRACE:
1. In the [Clerk Dashboard](https://dashboard.clerk.com), navigate to **Webhooks** -> **Add Endpoint**.
2. Set Endpoint URL to: `https://your-trace-domain.com/api/webhooks/clerk`.
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the Signing Secret and set it as `CLERK_WEBHOOK_SECRET`.

---

## 3. Teacher Account Promotion & Admin Control

In production, new sign-ups default to `STUDENT`. Teacher access is granted only when an administrator sets Clerk `public_metadata.role` to `TEACHER`; the signed webhook activates that role directly.

To promote verified instructors to `TEACHER`:
```bash
npm run user:set-role -- --email=teacher@university.edu --role=TEACHER --confirm
```

---

## 4. Docker Web Deployment

This Compose file launches PostgreSQL, applies migrations, and starts the TRACE web app. Java and C++ execution workers are separate capacity-managed services behind HTTPS. Configure the same 32+ character bearer token on the web app and both runners before classroom use; Compose refuses to start when those endpoints are absent.

```bash
# 1. Start PostgreSQL, run migrations, and launch TRACE via Docker Compose
docker-compose up -d --build

# 2. Verify containers are healthy
docker-compose ps
```

Access the application at `http://localhost:3000`.

---

## 5. Vercel / Railway Deployment

1. **Connect Git Repository** to Vercel or Railway.
2. **Set Environment Variables**: Add `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`.
3. **Build Command**:
   ```bash
   npx prisma generate --schema=backend/prisma/schema.prisma && next build frontend
   ```
4. **Deploy Database Migrations**:
   Run during your release pipeline:
   ```bash
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   ```

---

## 6. Production Health & Capacity Monitoring

TRACE provides automated JSON health check endpoints:

- **Web Health**: `GET /api/health`
- **Java Runner Health**: `GET /healthz` (returns active workers & queue depth)
- **C++ Runner Health**: `GET /healthz` (returns active workers & queue depth)

---

## 7. Security & Academic Compliance

- **Security Headers**: HSTS, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security` are applied automatically in `next.config.ts`.
- **Privacy Assurance**: Permissions policy explicitly blocks camera and microphone access (`camera=(), microphone=()`) ensuring zero invasive webcam surveillance.
- **Academic Integrity**: Process anomaly, AST comparison, and viva evaluation operate deterministically with full audit trails in Postgres.
