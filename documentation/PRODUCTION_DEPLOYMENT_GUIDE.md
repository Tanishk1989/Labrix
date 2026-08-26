# TRACE production deployment guide

This guide provides step-by-step instructions to deploy TRACE to production on modern cloud infrastructure (Vercel / Railway + Neon PostgreSQL + Clerk + Groq).

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
3. Copy the connection string required by your hosting provider and set it as `DATABASE_URL`. Run migrations from a controlled release job that can reach the database.
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
   - Install Command: `npm ci`
5. In **Environment Variables**, add the following keys from `.env.production.example`:

| Environment Variable | Value / Description |
| :--- | :--- |
| `DATABASE_URL` | Pooled Postgres connection URL |
| `DIRECT_URL` | Direct non-pooled Postgres connection URL |
| `LABRIX_IDENTITY_MODE` | `clerk` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| `CLERK_SECRET_KEY` | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` |
| `GROQ_API_KEY` | `gsk_...` |
| `GROQ_AI_REVIEW_MODEL` | `openai/gpt-oss-20b` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST credential |
| `LABRIX_EXECUTION_PROVIDER` | `remote-docker` |
| `LABRIX_JAVA_RUNNER_URL` | Public or private HTTPS execution endpoint |
| `LABRIX_CPP_RUNNER_URL` | Public or private HTTPS execution endpoint |
| `LABRIX_RUNNER_BEARER_TOKEN` | Shared random credential, at least 32 characters |
| `NODE_ENV` | `production` |

6. Click **Deploy**. Vercel will automatically build and publish your high-performance edge deployment.

---

## 🛡️ Step 5: Untrusted Code Runner Worker (For Real Execution)

For executing untrusted student C++ and Java code in isolated containers:

1. Provision a dedicated Linux Docker host. Do not colocate the runners with business data or the database.
2. Follow the versioned deployment bundle in `deployment/runner/README.md`. It starts both workers behind automatic HTTPS and applies container resource limits.
3. Set Vercel's `LABRIX_EXECUTION_PROVIDER` to `remote-docker`, point both runner URL variables at their HTTPS origins, and use the same random 32+ character bearer token on Vercel and the runner host.
4. Verify the public boundary before enabling a class:
   ```bash
   npm run verify:runners:remote
   ```

Never expose the Docker daemon or either runner execution endpoint without bearer authentication.

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
      "runnerConfigured": true
    }
  }
}
```

Complete the release gate and the pre-class checklist in `documentation/12-OPERATIONS-RUNBOOK.md` before opening enrollment. A successful deployment alone is not evidence that authentication, email delivery, runner capacity, backups, and role-specific classroom flows work in the target environment.

Run the repository release gate before every production push:

```bash
npm run release:gate
```

Do not add `LABRIX_TEST_DATABASE_URL` to Vercel. That variable is only for isolated local/CI verification and must never point production runtime at a test database.
