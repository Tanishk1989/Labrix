# Production execution runner

This bundle runs the Java and C++ HTTP workers behind automatic HTTPS. It is
intended for a dedicated Linux host; never deploy it inside the Vercel app.

## Host requirements

- Ubuntu 24.04 or another supported Linux distribution
- Docker Engine with the Compose plugin
- Start with 8 vCPU and 16 GB RAM for a 100-user staging rehearsal; tune from measured load
- Inbound TCP 80/443 (and UDP 443 for HTTP/3)
- Two DNS hostnames pointing to the server, one for Java and one for C++

The worker containers mount the Docker socket because they create short-lived,
resource-limited sandbox containers. Treat the host as dedicated infrastructure:
do not run databases, the web application, or unrelated workloads on it.

## Deploy

1. Clone the repository on the host and enter `deployment/runner`.
2. Copy `.env.example` to `.env`.
3. Set the pooled production `DATABASE_URL`, both domains, and generate a unique bearer token with
   `openssl rand -hex 32`. Keep that token secret.
4. Pull the pinned sandbox images:

   ```sh
   docker pull eclipse-temurin@sha256:55fb9bf738f5d9b4a6c01b39337e3070d3e27370dd3c478fd1d5d3cd2233c6d8
   docker pull gcc@sha256:b99b86a28812b1e6453a231a947dc43d76fe192788a12f344a9b568bf9f5d24c
   ```

5. Start and verify the services:

   ```sh
   docker compose up -d --build
   docker compose ps
   curl --fail "https://${JAVA_RUNNER_DOMAIN}/healthz"
   curl --fail "https://${CPP_RUNNER_DOMAIN}/healthz"
   ```

6. Confirm `execution-worker` is running in `docker compose ps`. It is the only service on this host that receives the database URL; sandbox runner containers do not.
7. Configure Vercel with `LABRIX_EXECUTION_PROVIDER=remote-docker`, `LABRIX_EXECUTION_DISPATCH=queued`, the two
   HTTPS execution URLs ending in `/v1/execute/java` and `/v1/execute/cpp`, and
   the same bearer token. Redeploy after changing the variables.

The execution endpoints reject missing/incorrect bearer tokens. Health endpoints
do not execute code. The sandbox containers run without networking, capabilities,
or writable root filesystems and enforce CPU, memory, PID, file, output, and time
limits.
