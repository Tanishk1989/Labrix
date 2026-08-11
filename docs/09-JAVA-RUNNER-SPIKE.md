# Local Java runner spike

## Status and boundary

Phase 15A currently provides **scaffolding only**. Labrix still selects the deterministic mock provider by default, and this repository does not yet include or claim a working Java runner. During implementation the Docker CLI was installed, but its daemon was unavailable, so the unsafe option of running student code with the host Java installation was deliberately rejected.

`JavaHttpExecutionProvider` is an opt-in server adapter. It sends source and tests to a separate loopback HTTP service; it never starts Java, Docker, a shell, or a child process inside Next.js. Existing `RunAttempt` and immutable `ResultSnapshot` persistence remains unchanged.

## Opt-in configuration

Keep current behavior with the default:

```dotenv
LABRIX_EXECUTION_PROVIDER=mock
```

After a compatible isolated local worker exists, opt in explicitly:

```dotenv
LABRIX_EXECUTION_PROVIDER=java-http
LABRIX_JAVA_RUNNER_URL=http://127.0.0.1:4010/v1/execute/java
```

The spike rejects missing, non-HTTP, or non-loopback runner URLs and supports Java only. It does not fall back to mock after explicit opt-in. Do not enable `java-http` for a classroom until the Docker smoke cases below pass.

## HTTP contract

The adapter posts a Java source string, ordered tests (`id`, `input`, `expectedOutput`, and `visibility`), and mandatory limits:

- wall time: 2,000 ms;
- captured output per field: 16 KiB;
- network mode: none.

The worker must return one of `completed`, `compilation_error`, `runtime_error`, `time_limit_exceeded`, or `internal_error`, with passed/total counts and bounded per-test results. The adapter caps the entire response at 128 KiB, checks test IDs and visibility against the request, rejects duplicate or inconsistent results, and converts transport, deadline, HTTP, JSON, and schema failures to bounded `internal_error` feedback.

## Required worker isolation

The next slice should implement a separate service bound to `127.0.0.1:4010`. Each request must use a fresh disposable Java container with:

- no network, dropped Linux capabilities, `no-new-privileges`, and a non-root user;
- read-only root filesystem plus a small temporary writable workspace;
- fixed CPU, memory, process, file-size, source/input, and output limits;
- an outer worker deadline longer than the in-container 2-second deadline;
- forced container cleanup on success, compiler failure, runtime failure, timeout, disconnect, or worker restart;
- no Docker socket, host source tree, database credentials, or application environment mounted into the container.

Do not use host `java`/`javac` as a fallback. Docker availability alone is not production readiness; image pinning, concurrency, queueing, observability, abuse testing, and an outage policy remain unresolved under D-012.

## Required Docker smoke proof

Once the daemon is available, the worker slice must demonstrate all four cases through its HTTP boundary: a successful Java program, a compiler error, a non-zero runtime failure, and an infinite loop mapped to `time_limit_exceeded`. Adapter unit tests do not substitute for that container-backed proof.
