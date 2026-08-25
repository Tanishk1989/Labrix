# Low-cost production deployment with Google Cloud runners

This is the operator checklist for a 100-user staging rehearsal. Free tiers and student credits can keep personal cost near zero, but they provide no uptime guarantee. Do not use a class assessment as the first load test.

## 1. Create the managed services

1. Create a Neon PostgreSQL project in a region near the Vercel region. Keep both its pooled runtime URL and direct migration URL.
2. Create an Upstash Redis database and keep its REST URL and token.
3. Create a Clerk production instance. Configure the production domain and the `/api/webhooks/clerk` webhook for `user.created`, `user.updated`, and `user.deleted`.
4. Import the Git repository into Vercel. The free `vercel.app` hostname is sufficient initially.

Never paste credentials into source files, commits, screenshots, tickets, or chat.

## 2. Prepare Google Cloud

Use student or trial credits if available. Google Cloud's always-free micro VM is not large enough for a 100-student runner burst.

1. Create an Ubuntu 24.04 Compute Engine VM near the database region.
2. Start staging with 8 vCPU, 16 GB RAM, and a 30 GB SSD. Capacity is provisional until the load tests pass.
3. Reserve a static external IPv4 address.
4. Permit inbound TCP 80 and 443. Restrict SSH to your own IP or use Identity-Aware Proxy.
5. Install Docker Engine and the Docker Compose plugin from Docker's official Ubuntu repository.
6. Point two DNS A records at the static address, for example `java-runner.example.com` and `cpp-runner.example.com`.
7. Clone this repository on the VM and change into `deployment/runner`.

## 3. Configure and start the runner stack

```sh
cp .env.example .env
openssl rand -hex 32
```

Put these values in the ignored `deployment/runner/.env`:

```dotenv
DATABASE_URL=<Neon pooled runtime URL>
JAVA_RUNNER_DOMAIN=java-runner.example.com
CPP_RUNNER_DOMAIN=cpp-runner.example.com
LABRIX_RUNNER_BEARER_TOKEN=<generated value>
LABRIX_JAVA_RUNNER_URL=https://java-runner.example.com/v1/execute/java
LABRIX_CPP_RUNNER_URL=https://cpp-runner.example.com/v1/execute/cpp
RUNNER_MAX_CONCURRENCY=8
RUNNER_MAX_QUEUE_SIZE=128
RUNNER_QUEUE_TIMEOUT_MS=120000
EXECUTION_WORKER_CONCURRENCY=8
EXECUTION_WORKER_POLL_MS=500
EXECUTION_JOB_LEASE_MS=120000
EXECUTION_JOB_MAX_ATTEMPTS=3
```

Start it:

```sh
docker pull eclipse-temurin@sha256:55fb9bf738f5d9b4a6c01b39337e3070d3e27370dd3c478fd1d5d3cd2233c6d8
docker pull gcc@sha256:b99b86a28812b1e6453a231a947dc43d76fe192788a12f344a9b568bf9f5d24c
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 execution-worker
```

Both runner services mount Docker's control socket and must remain on this dedicated VM. The execution worker receives the database URL, but Java/C++ runner services and untrusted sandbox containers do not.

## 4. Apply the production migration

Run migrations from a trusted local terminal or CI using Neon's direct URL:

```sh
DATABASE_URL='<Neon direct URL>' npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```

Do not run `prisma migrate dev` against production.

## 5. Configure Vercel

Set the following production variables and redeploy:

```dotenv
DATABASE_URL=<Neon pooled runtime URL>
LABRIX_IDENTITY_MODE=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<Clerk live publishable key>
CLERK_SECRET_KEY=<Clerk live secret>
CLERK_WEBHOOK_SECRET=<Clerk production webhook secret>
UPSTASH_REDIS_REST_URL=<Upstash REST URL>
UPSTASH_REDIS_REST_TOKEN=<Upstash REST token>
LABRIX_EXECUTION_PROVIDER=remote-docker
LABRIX_EXECUTION_DISPATCH=queued
LABRIX_JAVA_RUNNER_URL=https://java-runner.example.com/v1/execute/java
LABRIX_CPP_RUNNER_URL=https://cpp-runner.example.com/v1/execute/cpp
LABRIX_RUNNER_BEARER_TOKEN=<same generated runner token>
LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION=false
LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD=false
```

An older Vercel Redis integration may expose the equivalent variables as
`KV_REST_API_URL` and `KV_REST_API_TOKEN`; the application accepts either pair.

Use the remaining optional production variables from `.env.production.example` only when their features are enabled.

## 6. Verify before inviting students

```sh
curl --fail https://java-runner.example.com/healthz
curl --fail https://cpp-runner.example.com/healthz
LABRIX_PRODUCTION_URL=https://your-app.vercel.app npm run verify:production
npm run verify:runners:remote
LABRIX_LOAD_TEST_BASE_URL=https://your-app.vercel.app npm run load:test:web
npm run load:test:runners
```

The application health response must show a connected database, two connected runners, at least one execution worker online, and nonzero execution capacity.

Pass gates:

- web failure rate at or below 1%;
- web p95 at or below 2 seconds;
- no failed jobs in a 100-request runner burst;
- runner burst p95 at or below 60 seconds;
- a real Clerk student can join, autosave, run, submit, reload, and retain the result;
- a real Clerk teacher can review and publish feedback;
- one worker restart does not lose a queued job.

If the runner test fails, increase the VM size or reduce `EXECUTION_WORKER_CONCURRENCY`; do not increase concurrency beyond available CPU and memory. Repeat at 10, 30, 60, then 100 users.

## 7. Routine operation

- Before class: check `/api/health`, VM disk/CPU, runner health, queue depth, and the latest backup.
- During class: alert on growing queue age, worker count zero, runner errors, or database latency above 500 ms.
- After class: inspect failed jobs without logging source, then stop the VM if no queued/running jobs remain to conserve credits.
- Daily: use managed PostgreSQL backup/restore features and perform a restore drill before the first assessed class.
