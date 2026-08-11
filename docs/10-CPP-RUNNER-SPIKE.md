# Local C++ runner

## Status and scope

Phase 16B provides a runnable **local-only C++ execution proof** using the protocol and provider scaffold from Phase 16A. The deterministic mock remains the default, and the existing Java adapter and worker are unchanged. C++ execution starts only when Next.js explicitly selects `cpp-http` and a separate loopback worker is running.

The application execution request already carries Prisma's `CPP` language value and language-neutral tests/results, so C++ needs no schema, Run/Submit, grading, or hidden-test change. Run continues to select visible tests only; Submit continues to select visible and hidden tests before invoking the provider. Student result filtering remains downstream of execution.

Pull the digest-pinned GCC 14.2 image and start the separate worker:

```bash
npm run runner:cpp:pull
npm run runner:cpp
```

The worker binds only to `http://127.0.0.1:4020`, exposes `POST /v1/execute/cpp`, and provides the non-executing health check `GET /healthz`. Configure the separate Next.js process explicitly:

```dotenv
LABRIX_EXECUTION_PROVIDER=cpp-http
LABRIX_CPP_RUNNER_URL=http://127.0.0.1:4020/v1/execute/cpp
```

Selecting `cpp-http` without the worker fails closed as an `internal_error`; it never falls back to mock or Java. Ordinary workspaces remain on mock when `LABRIX_EXECUTION_PROVIDER` is unset or `mock`. This single-flight worker is a developer proof, not a classroom-facing or production execution service.

## HTTP contract and result mapping

The separate C++ contract deliberately does not broaden the Java-literal protocol. The worker validates the complete request before starting Docker and accepts only:

- language: `CPP`;
- wall time: 2,000 ms shared by all test processes after compilation;
- compilation time: 10,000 ms;
- captured output: 16 KiB per stdout/stderr field and 64 KiB aggregate returned test output;
- network mode: `none`;
- source: at most 256 KiB;
- tests: at most 100 with unique IDs;
- each input and expected output: at most 64 KiB;
- HTTP request body: at most 14 MiB;
- HTTP response body: at most 128 KiB.

The adapter validates response state, counts, test IDs, visibility, per-field output, and total response size. Results map as follows:

- `completed`: compilation and every test process completed; individual tests may still fail comparison;
- `compilation_error`: `g++` failed, exceeded its compiler deadline, or overflowed bounded diagnostics;
- `runtime_error`: the executable exited non-zero or exceeded its output capture limit;
- `time_limit_exceeded`: the shared post-compilation execution deadline expired;
- `internal_error`: Docker, request abort, cleanup envelope, or worker infrastructure failed safely.

The 22-second HTTP deadline is only an outer fail-closed envelope for Docker Desktop startup and cleanup. It does not increase the 2-second student-code execution budget.

## Why the Java worker is not generalized yet

The Java worker contains reusable mechanics—bounded child-process streams, unique disposable container names, forced cleanup, request-size handling, and single-flight rejection. Phase 16B duplicates that small host-side envelope so it does not alter the already verified Java execution path while the C++-specific sandbox policy is still being proven.

A shared worker layer can now be considered in a later refactor with both implementations as evidence. It should own only language-neutral lifecycle mechanics while separate Java and C++ policies retain image, staging, compilation, invocation, memory budgets, and error mapping. Phase 16B keeps the files separate so Java behavior does not change.

## C++-specific threat model

Native code changes the isolation assumptions:

- compiled code can issue syscalls directly and exploit memory-unsafe undefined behavior;
- process/thread creation, signals, and core dumps need tighter limits than JVM flags provide;
- templates, constexpr evaluation, the preprocessor, debug output, and large object files can exhaust compiler CPU, memory, disk, or output budgets;
- include paths and compiler diagnostics can expose image filesystem details unless the toolchain image is minimal and reviewed;
- the Java `/workspace` tmpfs is `noexec`, while a native binary needs a tightly scoped executable location;
- dynamic loading and runtime libraries expand the readable filesystem and syscall surface;
- sanitizer tooling is useful in testing but increases runtime, memory, output, and image surface and should not be silently enabled in the execution contract.

The local proof applies:

1. digest-pinned `gcc@sha256:b99b86a28812b1e6453a231a947dc43d76fe192788a12f344a9b568bf9f5d24c` with non-root UID/GID `65532:65532`;
2. 0.5 CPU, 256 MiB memory with swap capped at 256 MiB, 32 PIDs, 64 open files, 4 MiB file size, and disabled core dumps;
3. no network, no capabilities, `no-new-privileges`, Docker's built-in seccomp profile, a read-only root filesystem, no host mounts or secrets, and forced cleanup;
4. a 16 MiB non-executable source tmpfs, an 8 MiB executable binary tmpfs, and a 16 MiB non-executable `/tmp` tmpfs;
5. compilation once with C++20 followed by a new bounded executable process for each ordered input; expected outputs remain in the worker;
6. 8-second Docker control-operation deadlines and a 30-second container lifetime fallback.

The executable shares the compiler container and Docker's built-in seccomp profile in this local proof. A production design still needs separate compile/runtime images or phases, a reviewed stricter runtime seccomp profile, toolchain minimization, concurrency/queue policy, observability, and broader native-code abuse testing.

## Targeted verification

Run:

```bash
npm run test:runner:cpp
```

The targeted suite starts the C++ HTTP worker on an ephemeral loopback port and uses Docker to verify:

- successful compile-once execution across ordered visible and hidden inputs;
- compiler diagnostics mapped to `compilation_error`;
- a non-zero native exit mapped to `runtime_error`;
- an infinite loop mapped to `time_limit_exceeded`;
- altered safety limits rejected before Docker is contacted;
- concurrent execution rejected rather than queued.

The suite does not load Prisma, connect to PostgreSQL, mutate Labrix data, start Next.js, or replace the separate unit tests for provider selection and response validation. Workspace persistence acceptance remains a later phase.
