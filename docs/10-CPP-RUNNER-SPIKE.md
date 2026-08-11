# C++ runner planning spike

## Status and scope

Phase 16A adds a **protocol and provider scaffold only**. It does not add a C++ Docker worker, compiler image, runner start script, or claim real C++ execution. The deterministic mock remains the default, and the existing Java adapter and worker are unchanged.

The application execution request already carries Prisma's `CPP` language value and language-neutral tests/results, so C++ needs no schema, Run/Submit, grading, or hidden-test change. Run continues to select visible tests only; Submit continues to select visible and hidden tests before invoking the provider. Student result filtering remains downstream of execution.

The scaffold can only be selected explicitly:

```dotenv
LABRIX_EXECUTION_PROVIDER=cpp-http
LABRIX_CPP_RUNNER_URL=http://127.0.0.1:4020/v1/execute/cpp
```

No service currently listens there. Selecting `cpp-http` without a separately implemented compatible loopback service fails closed as an `internal_error`; it never falls back to mock or Java. Ordinary workspaces remain on mock when `LABRIX_EXECUTION_PROVIDER` is unset or `mock`.

## Planned HTTP contract

The separate C++ contract deliberately does not broaden the Java-literal protocol. A future worker must validate the complete request before starting Docker and accept only:

- language: `CPP`;
- wall time: 2,000 ms shared by all test processes after compilation;
- captured output: 16 KiB per returned field;
- network mode: `none`;
- source: at most 256 KiB;
- tests: at most 100 with unique IDs;
- each input and expected output: at most 64 KiB;
- response body: at most 128 KiB.

The scaffold validates response state, counts, test IDs, visibility, per-field output, and total response size. It accepts the existing language-neutral result states: `completed`, `compilation_error`, `runtime_error`, `time_limit_exceeded`, and `internal_error`.

The 22-second HTTP deadline is only an outer fail-closed envelope for a future compiler/container lifecycle. It is not a student-code runtime allowance. Compile time, request-body size, aggregate output, and Docker control deadlines must be fixed in the worker implementation before that worker is accepted.

## Why the Java worker is not generalized yet

The Java worker contains reusable mechanics—bounded child-process streams, unique disposable container names, forced cleanup, request-size handling, and single-flight rejection. Extracting those mechanics now would change the already verified Java execution path without providing a C++ sandbox to validate the abstraction against.

A shared worker layer should be considered only alongside the first C++ Docker proof. It should own language-neutral lifecycle mechanics while separate Java and C++ policies own image, staging, compilation, invocation, memory budgets, and error mapping. Java behavior and its pinned image must remain regression-tested during that extraction.

## C++-specific threat model

Native code changes the isolation assumptions:

- compiled code can issue syscalls directly and exploit memory-unsafe undefined behavior;
- process/thread creation, signals, and core dumps need tighter limits than JVM flags provide;
- templates, constexpr evaluation, the preprocessor, debug output, and large object files can exhaust compiler CPU, memory, disk, or output budgets;
- include paths and compiler diagnostics can expose image filesystem details unless the toolchain image is minimal and reviewed;
- the Java `/workspace` tmpfs is `noexec`, while a native binary needs a tightly scoped executable location;
- dynamic loading and runtime libraries expand the readable filesystem and syscall surface;
- sanitizer tooling is useful in testing but increases runtime, memory, output, and image surface and should not be silently enabled in the execution contract.

A future local worker therefore needs:

1. a digest-pinned minimal Linux C++ toolchain image with a non-root runtime user;
2. separate compile and execution phases with distinct CPU, memory, wall-time, output, file-size, PID/thread, open-file, and core-dump limits;
3. no network, no capabilities, `no-new-privileges`, a read-only root filesystem, no host mounts or secrets, and forced container cleanup;
4. a reviewed seccomp profile suitable for the compiler phase and a stricter profile for the produced binary;
5. a small executable tmpfs or equivalent design that does not make the source/compiler workspace broadly executable;
6. compilation once followed by a fresh bounded process per ordered test input, with expected outputs retained outside the container;
7. Docker-backed tests for compiler bombs, fork/thread attempts, excessive output/files, signals, memory exhaustion, infinite loops, cleanup, and concurrent requests.

## Verification in this phase

The focused unit tests do not start Docker, a compiler, Next.js, or PostgreSQL. They verify:

- mock remains the default;
- `cpp-http` requires an explicit HTTP loopback URL;
- the request schema accepts only C++ with fixed limits and unique test IDs;
- Java and oversized requests are rejected before HTTP contact;
- inconsistent runner responses fail closed;
- the mode is disclosed honestly as **C++ runner scaffold**.

Real C++ success, compiler failure, runtime failure, timeout, container isolation, and workspace persistence remain unproven until a later implementation phase.
