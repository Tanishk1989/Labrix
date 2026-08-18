# Labrix Production Deployment Guide

This guide outlines the production deployment procedure for Labrix across Docker, Vercel, Railway, or university self-hosted infrastructure.

---

## 1. Production Environment Variables

Configure the following environment variables in your deployment environment (e.g. `.env.production` or platform secrets):

```env
# Database Configuration (PostgreSQL 15+)
DATABASE_URL="postgresql://labrix_user:STRONG_PASSWORD@your-db-host:5432/labrix_db?schema=public&sslmode=prefer"

# Next.js Production Settings
NODE_ENV="production"
PORT=3000

# Authentication (Clerk Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Optional: Standalone Docker output
NEXT_OUTPUT_STANDALONE="true"
```

---

## 2. One-Click Docker Deployment

To launch the complete production stack (PostgreSQL + Labrix Web App with security headers):

```bash
# 1. Clone repository
git clone <repo-url> && cd Labrix

# 2. Start PostgreSQL and Labrix via Docker Compose
docker-compose up -d --build

# 3. Apply database migrations
docker-compose exec app npx prisma migrate deploy
```

Access the application at `http://localhost:3000`.

---

## 3. Vercel / Railway Deployment

1. **Connect Git Repository** to Vercel or Railway.
2. **Set Environment Variables**: Add `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`.
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

## 4. Production Health Check

Labrix provides an automated JSON health check endpoint for uptime monitors and load balancers:

- **Endpoint**: `GET /api/health`
- **Sample Output**:
  ```json
  {
    "status": "healthy",
    "version": "0.1.0",
    "uptime": 12450.2,
    "timestamp": "2026-08-18T00:30:00.000Z",
    "latencyMs": 4,
    "database": {
      "status": "connected",
      "latencyMs": 3
    },
    "environment": "production"
  }
  ```

---

## 5. Security & Academic Compliance

- **Security Headers**: HSTS, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security` are applied automatically to all responses in `next.config.ts`.
- **Privacy Assurance**: Permissions policy explicitly blocks camera and microphone access (`camera=(), microphone=()`) ensuring zero invasive webcam surveillance.
- **Academic Integrity**: Process anomaly and viva evaluation engine operates deterministically with zero risk of AI hallucination in marking logs.
