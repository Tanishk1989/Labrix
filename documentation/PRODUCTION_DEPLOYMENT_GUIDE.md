# 🚀 TRACE / Labrix — Complete Production Deployment Guide

This guide provides step-by-step instructions to deploy TRACE / Labrix to production on modern cloud infrastructure (Vercel / Railway + Neon PostgreSQL + Clerk + Groq).

---

## 🏗️ Production Architecture Overview

```mermaid
flowchart TD
    User([Students & Teachers]) --> Vercel[Vercel / Next.js Web App]
    Vercel --> Clerk[Clerk Auth & Webhooks]
    Vercel --> Neon[(Neon Serverless PostgreSQL)]
    Vercel --> Groq[Groq AI Llama 3.3 70B]
    Vercel --> Upstash[(Upstash Redis Rate Limiting)]
    Vercel --> RunnerWorker[Dedicated Docker Runner EC2/Hetzner]
```

---

## 📋 Step 1: Managed Database Setup (Neon or Supabase)

1. Create a free project at [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Create a PostgreSQL database named `labrix`.
3. In Neon, copy **two connection strings**:
   - **Pooled connection string** (with PgBouncer enabled) $\rightarrow$ Use for `DATABASE_URL`.
   - **Direct connection string** (non-pooled port 5432) $\rightarrow$ Use for `DIRECT_URL` (migrations).
4. Run database migrations:
   ```bash
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   ```

---

## 🔐 Step 2: Clerk Authentication & Realtime Webhook Sync

1. Create a production application on [Clerk.com](https://clerk.com).
2. Enable Email & Google social sign-in.
3. In Clerk Dashboard $\rightarrow$ **Webhooks**:
   - Add Endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
   - Copy the **Signing Secret** (`whsec_...`) $\rightarrow$ Set as `CLERK_WEBHOOK_SECRET`.

---

## ⚡ Step 3: AI Inference Setup (Groq API)

1. Sign up on [Groq Console](https://console.groq.com).
2. Generate an API Key $\rightarrow$ Set as `GROQ_API_KEY`.
3. Set model: `GROQ_AI_REVIEW_MODEL="openai/gpt-oss-20b"` or `"llama-3.3-70b-versatile"`.
4. *(Optional)* Add `GEMINI_API_KEY` for secondary failover redundancy.

---

## 🚢 Step 4: Deploying to Vercel (Recommended)

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Set Framework Preset to **Next.js**.
3. Set Root Directory to `./` (repository root).
4. In **Build & Development Settings**:
   - Build Command: `npm run build`
   - Install Command: `npm install`
5. In **Environment Variables**, add the following keys from `.env.production.example`:

| Environment Variable | Value / Description |
| :--- | :--- |
| `DATABASE_URL` | Pooled Postgres connection URL |
| `DIRECT_URL` | Direct non-pooled Postgres connection URL |
| `LABRIX_IDENTITY_MODE` | `clerk` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| `CLERK_SECRET_KEY` | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` |
| `LABRIX_APP_URL` | Public HTTPS origin used in approval links |
| `RESEND_API_KEY` | Resend API key for administrator notifications |
| `TEACHER_APPROVAL_EMAIL` | `tanishk1976@gmail.com` |
| `TEACHER_APPROVAL_FROM_EMAIL` | Sender on a domain verified in Resend |
| `TEACHER_APPROVAL_SECRET` | Random secret containing at least 32 characters |
| `GROQ_API_KEY` | `gsk_...` |
| `GROQ_AI_REVIEW_MODEL` | `openai/gpt-oss-20b` |
| `LABRIX_EXECUTION_PROVIDER` | `mock` (or `sandbox` with remote runner) |
| `NODE_ENV` | `production` |

6. Click **Deploy**. Vercel will automatically build and publish your high-performance edge deployment.

---

## 🛡️ Step 5: Untrusted Code Runner Worker (For Real Execution)

For executing untrusted student C++ and Java code in isolated containers:
1. Provision a small compute instance (e.g. AWS EC2 `t4g.small` or Hetzner VPS `CX22` ~$4/mo).
2. Install Docker & gVisor (`runsc`).
3. Run the container worker service:
   ```bash
   npm run runner:java
   npm run runner:cpp
   ```
4. Set `LABRIX_JAVA_RUNNER_URL` and `LABRIX_CPP_RUNNER_URL` to your worker's internal VPC IP address.

---

## 🩺 Step 6: Production Health & Observability Check

Verify your live deployment by hitting the health check endpoint:
```bash
curl https://your-domain.com/api/health
```

Expected output:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "uptime": 12450.2,
  "database": {
    "status": "connected",
    "latencyMs": 8
  },
  "environment": "production",
  "systemConfig": {
    "isValid": true,
    "mode": "clerk",
    "features": {
      "groqAiEnabled": true,
      "geminiAiEnabled": false,
      "upstashRateLimiting": true,
      "runnerConfigured": false
    }
  }
}
```

---

🎉 **Your TRACE / Labrix platform is now 100% production ready, secure, and ready for high-concurrency university deployment!**
