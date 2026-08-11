# Local Java runner spike

## Status and boundary

Phase 15B provides a runnable **local-only Java execution proof**. Labrix still selects the deterministic mock provider by default. Java execution starts only when the Next.js process explicitly sets `LABRIX_EXECUTION_PROVIDER=java-http` and points at the separate loopback worker.

`JavaHttpExecutionProvider` sends source and tests over HTTP. It never starts Java, Docker, a shell, or a child process inside Next.js. The worker is a different Node.js process bound to `127.0.0.1:4010`; only that worker invokes the Docker CLI. Existing `RunAttempt`, immutable `ResultSnapshot`, submission, grading, hidden-test disclosure, review, analytics, membership, authentication, and schema behavior are unchanged.

This worker is a developer spike, not a production execution service. It is intentionally Java-only and single-flight. D-012 remains unresolved for provider selection, production image lifecycle, queues, concurrency, retry/outage behavior, observability, retention, and broader abuse testing.

## Local setup

Requirements:

- Docker Desktop using Linux containers;
- enough local Docker capacity for the 128 MiB sandbox plus the worker;
- the repository's existing Node.js dependencies.

Pull the exact pinned Eclipse Temurin Java 21 image:

```bash
npm run runner:java:pull
```

Start the worker in its own terminal:

```bash
npm run runner:java
```

The service listens only on `http://127.0.0.1:4010`. Its execution endpoint is `/v1/execute/java`, and `GET /healthz` provides a non-executing local health check.

Keep ordinary Labrix behavior with the default:

```dotenv
LABRIX_EXECUTION_PROVIDER=mock
```

To opt in locally, configure the separate Next.js process and restart it:

```dotenv
LABRIX_EXECUTION_PROVIDER=java-http
LABRIX_JAVA_RUNNER_URL=http://127.0.0.1:4010/v1/execute/java
```

The adapter rejects missing, non-HTTP, or non-loopback runner URLs and supports Java only. Explicit `java-http` selection never falls back to mock. Do not use this spike as a classroom or internet-facing execution service.

## HTTP contract and result mapping

The adapter posts a Java source string, ordered tests (`id`, `input`, `expectedOutput`, and `visibility`), and mandatory limits. The worker validates the complete body with Zod before contacting Docker and accepts only:

- language: `JAVA`;
- wall time: 2,000 ms shared by all test processes after compilation;
- captured output: 16 KiB per stdout/stderr field and 64 KiB aggregate returned test output;
- network mode: `none`;
- source: at most 256 KiB;
- tests: at most 100, with unique IDs;
- each input and expected output: at most 64 KiB;
- HTTP request body: at most 14 MiB;
- HTTP response body: at most 128 KiB.

The worker compiles `/workspace/Main.java` once, then starts a fresh `java Main` process for each ordered input. Test comparison normalizes CRLF/CR to LF and ignores trailing whitespace; returned `actualOutput` uses the same normalization. Expected outputs never enter the container.

Responses use the existing states:

- `completed`: compilation and every test process completed; individual tests can still pass or fail;
- `compilation_error`: `javac` failed, exceeded its 8-second compiler deadline, or overflowed bounded compiler output;
- `runtime_error`: a Java process exited non-zero or exceeded its output capture limit;
- `time_limit_exceeded`: the shared 2-second post-compilation execution deadline expired;
- `internal_error`: Docker, request abort, cleanup envelope, or worker infrastructure failed safely.

The Next.js adapter allows a 20-second outer HTTP envelope for Docker Desktop cold starts and cleanup. This does not increase the 2-second student-code execution budget.

## Container isolation and cleanup

Every valid execution request receives a newly named disposable container from:

`eclipse-temurin@sha256:55fb9bf738f5d9b4a6c01b39337e3070d3e27370dd3c478fd1d5d3cd2233c6d8`

The worker applies:

- `--network none`;
- `--cap-drop ALL` and `--security-opt no-new-privileges`;
- non-root UID/GID `65532:65532`;
- read-only root filesystem;
- 0.5 CPU;
- 128 MiB memory with swap capped at the same 128 MiB;
- 64 PIDs, 64 open files, and a 1 MiB per-file size ulimit;
- a 32 MiB `/workspace` tmpfs and 16 MiB `/tmp` tmpfs, both `nosuid,nodev,noexec`;
- JVM heap caps of 64 MiB and one active processor;
- an 8-second bound on individual Docker control operations;
- a 15-second container idle command as a crash cleanup fallback.

Source and individual inputs are streamed through `docker exec` standard input. The container receives no bind mounts, Docker socket, repository files, database credentials, or application environment. The worker force-removes the container in `finally` after success, compiler failure, runtime failure, timeout, output overflow, abort, or infrastructure error. It also cleans tracked containers on `SIGINT`/`SIGTERM`; Docker `--rm` and the short container lifetime cover abrupt worker loss.

The worker does not use host `java` or `javac` as a fallback. A Docker failure returns `internal_error`.

## Targeted verification

Run the Docker-backed suite directly:

```bash
npm run test:runner:java
```

This suite starts the worker on an ephemeral loopback port and verifies through HTTP:

1. successful compilation once followed by visible and hidden test inputs;
2. compiler diagnostics mapped to `compilation_error`;
3. a non-zero Java exit mapped to `runtime_error`;
4. an infinite loop killed and mapped to `time_limit_exceeded`;
5. altered safety limits rejected before Docker is contacted;
6. a concurrent execution rejected instead of queued or run in parallel.

The suite does not load Prisma, connect to PostgreSQL, or mutate Labrix data. Adapter unit tests remain separate and do not substitute for this container-backed proof.
