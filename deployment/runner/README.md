# Production execution runner

This bundle runs the Java and C++ HTTP workers behind automatic HTTPS. It is
intended for a dedicated Linux host; never deploy it inside the Vercel app.

## Host requirements

- Ubuntu 24.04 or another supported Linux distribution
- Docker Engine with the Compose plugin
- At least 2 vCPU and 4 GB RAM for a small demonstration cohort
- Inbound TCP 80/443 (and UDP 443 for HTTP/3)
- Two DNS hostnames pointing to the server, one for Java and one for C++

The worker containers mount the Docker socket because they create short-lived,
resource-limited sandbox containers. Treat the host as dedicated infrastructure:
do not run databases, the web application, or unrelated workloads on it.

## Deploy

1. Clone the repository on the host and enter `deployment/runner`.
2. Copy `.env.example` to `.env`.
3. Set both domains and generate a unique bearer token with
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

6. Configure Vercel with `LABRIX_EXECUTION_PROVIDER=remote-docker`, the two
   HTTPS execution URLs ending in `/v1/execute/java` and `/v1/execute/cpp`, and
   the same bearer token. Redeploy after changing the variables.

The execution endpoints reject missing/incorrect bearer tokens. Health endpoints
do not execute code. The sandbox containers run without networking, capabilities,
or writable root filesystems and enforce CPU, memory, PID, file, output, and time
limits.
