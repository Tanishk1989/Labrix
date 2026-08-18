import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import type {
  CppRunnerRequest,
  CppRunnerResponse,
} from "../../server/execution/cpp-runner-protocol";
import {
  CPP_RUNNER_COMPILE_TIME_MS,
  CPP_RUNNER_OUTPUT_BYTES,
  CPP_RUNNER_TOTAL_OUTPUT_BYTES,
} from "../../server/execution/cpp-runner-protocol";

export const CPP_RUNNER_IMAGE =
  "gcc@sha256:b99b86a28812b1e6453a231a947dc43d76fe192788a12f344a9b568bf9f5d24c";

const DOCKER_OPERATION_TIME_MS = 8_000;
const CONTAINER_LIFETIME_SECONDS = 30;
const activeContainers = new Set<string>();

interface DockerCommandOptions {
  input?: string;
  maxStdoutBytes?: number;
  maxStderrBytes?: number;
  signal?: AbortSignal;
  timeoutMs: number;
}

interface DockerCommandResult {
  aborted: boolean;
  exitCode: number | null;
  outputLimitExceeded: boolean;
  stderr: string;
  stdout: string;
  timedOut: boolean;
}

function appendBounded(
  chunks: Buffer[],
  currentBytes: number,
  chunk: Buffer,
  limit: number,
) {
  const remaining = Math.max(0, limit - currentBytes);
  if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
  return {
    bytes: currentBytes + Math.min(chunk.byteLength, remaining),
    exceeded: chunk.byteLength > remaining,
  };
}

function runDocker(
  args: string[],
  {
    input,
    maxStdoutBytes = CPP_RUNNER_OUTPUT_BYTES,
    maxStderrBytes = CPP_RUNNER_OUTPUT_BYTES,
    signal,
    timeoutMs,
  }: DockerCommandOptions,
): Promise<DockerCommandResult> {
  return new Promise((resolve) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    let aborted = signal?.aborted ?? false;
    let outputLimitExceeded = false;
    let spawnError: Error | undefined;

    const child = spawn("docker", args, {
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    const stopChild = () => {
      if (!child.killed) child.kill("SIGKILL");
    };
    const onAbort = () => {
      aborted = true;
      stopChild();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    if (aborted) stopChild();

    const timeout = setTimeout(() => {
      timedOut = true;
      stopChild();
    }, Math.max(1, timeoutMs));

    child.stdout.on("data", (value: Buffer) => {
      const appended = appendBounded(
        stdoutChunks,
        stdoutBytes,
        value,
        maxStdoutBytes,
      );
      stdoutBytes = appended.bytes;
      if (appended.exceeded) {
        outputLimitExceeded = true;
        stopChild();
      }
    });
    child.stderr.on("data", (value: Buffer) => {
      const appended = appendBounded(
        stderrChunks,
        stderrBytes,
        value,
        maxStderrBytes,
      );
      stderrBytes = appended.bytes;
      if (appended.exceeded) {
        outputLimitExceeded = true;
        stopChild();
      }
    });
    child.on("error", (error) => {
      spawnError = error;
    });
    child.stdin.on("error", () => {
      // A timed-out or failed Docker process can close stdin before the payload.
    });
    child.stdin.end(input);

    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
      const capturedStderr = Buffer.concat(stderrChunks).toString("utf8");
      resolve({
        aborted,
        exitCode,
        outputLimitExceeded,
        stderr: spawnError
          ? `${capturedStderr}${capturedStderr ? "\n" : ""}${spawnError.message}`
          : capturedStderr,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        timedOut,
      });
    });
  });
}

function internalError(
  request: CppRunnerRequest,
  errorText: string,
): CppRunnerResponse {
  return {
    state: "internal_error",
    passedTests: 0,
    totalTests: request.tests.length,
    errorText,
    testResults: [],
  };
}

function normalizeOutput(value: string) {
  return value.replace(/\r\n?/g, "\n").trimEnd();
}

function commandError(result: DockerCommandResult, fallback: string) {
  return normalizeOutput(result.stderr || result.stdout) || fallback;
}

function containerName() {
  return `labrix-cpp-${randomUUID()}`;
}

async function removeContainer(name: string) {
  const result = await runDocker(["rm", "--force", "--volumes", name], {
    maxStdoutBytes: 4_096,
    maxStderrBytes: 4_096,
    timeoutMs: DOCKER_OPERATION_TIME_MS,
  });
  if (result.exitCode === 0 || result.stderr.includes("No such container")) {
    activeContainers.delete(name);
  }
}

export async function cleanupActiveCppContainers() {
  await Promise.allSettled([...activeContainers].map(removeContainer));
}

export async function executeCppInDocker(
  request: CppRunnerRequest,
  signal?: AbortSignal,
): Promise<CppRunnerResponse> {
  const name = containerName();
  activeContainers.add(name);

  try {
    const created = await runDocker(
      [
        "create",
        "--rm",
        "--name",
        name,
        "--network",
        "none",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--read-only",
        "--user",
        "65532:65532",
        "--cpus",
        "0.5",
        "--memory",
        "256m",
        "--memory-swap",
        "256m",
        "--pids-limit",
        "32",
        "--ulimit",
        "nofile=64:64",
        "--ulimit",
        "nproc=32:32",
        "--ulimit",
        "fsize=4194304:4194304",
        "--ulimit",
        "core=0:0",
        "--tmpfs",
        "/workspace:rw,nosuid,nodev,noexec,size=16777216,uid=65532,gid=65532,mode=0700",
        "--tmpfs",
        "/sandbox-bin:rw,nosuid,nodev,exec,size=8388608,uid=65532,gid=65532,mode=0700",
        "--tmpfs",
        "/tmp:rw,nosuid,nodev,noexec,size=16777216,uid=65532,gid=65532,mode=0700",
        "--workdir",
        "/workspace",
        "--entrypoint",
        "/bin/sh",
        CPP_RUNNER_IMAGE,
        "-c",
        `sleep ${CONTAINER_LIFETIME_SECONDS}`,
      ],
      { signal, timeoutMs: DOCKER_OPERATION_TIME_MS },
    );
    if (created.exitCode !== 0 || created.timedOut || created.aborted) {
      return internalError(
        request,
        commandError(created, "Docker could not create the C++ sandbox."),
      );
    }

    const started = await runDocker(["start", name], {
      signal,
      timeoutMs: DOCKER_OPERATION_TIME_MS,
    });
    if (started.exitCode !== 0 || started.timedOut || started.aborted) {
      return internalError(
        request,
        commandError(started, "Docker could not start the C++ sandbox."),
      );
    }

    const sourceWritten = await runDocker(
      [
        "exec",
        "-i",
        name,
        "/bin/sh",
        "-c",
        "umask 077; cat > /workspace/Main.cpp",
      ],
      {
        input: request.sourceCode,
        signal,
        timeoutMs: DOCKER_OPERATION_TIME_MS,
      },
    );
    if (
      sourceWritten.exitCode !== 0 ||
      sourceWritten.timedOut ||
      sourceWritten.aborted ||
      sourceWritten.outputLimitExceeded
    ) {
      return internalError(
        request,
        commandError(sourceWritten, "The C++ source could not be staged safely."),
      );
    }

    const compilation = await runDocker(
      [
        "exec",
        name,
        "g++",
        "-std=c++20",
        "-O2",
        "-pipe",
        "-fno-diagnostics-color",
        "-o",
        "/sandbox-bin/main",
        "/workspace/Main.cpp",
      ],
      { signal, timeoutMs: CPP_RUNNER_COMPILE_TIME_MS },
    );
    if (compilation.aborted) {
      return internalError(request, "The C++ execution request was aborted.");
    }
    if (compilation.timedOut) {
      return {
        state: "compilation_error",
        passedTests: 0,
        totalTests: request.tests.length,
        errorText: "C++ compilation exceeded the local compiler deadline.",
        testResults: [],
      };
    }
    if (compilation.exitCode !== 0 || compilation.outputLimitExceeded) {
      return {
        state: "compilation_error",
        passedTests: 0,
        totalTests: request.tests.length,
        errorText: commandError(
          compilation,
          "C++ compilation failed without compiler output.",
        ),
        testResults: [],
      };
    }

    const testResults: CppRunnerResponse["testResults"] = [];
    const executionDeadline = Date.now() + request.limits.wallTimeMs;
    let returnedOutputBytes = 0;

    for (const test of request.tests) {
      const remainingTimeMs = executionDeadline - Date.now();
      if (remainingTimeMs <= 0) {
        return {
          state: "time_limit_exceeded",
          passedTests: testResults.filter((result) => result.passed).length,
          totalTests: request.tests.length,
          errorText: "C++ execution exceeded the 2000 ms wall-clock limit.",
          testResults,
        };
      }

      const remainingOutputBytes = Math.max(
        1,
        CPP_RUNNER_TOTAL_OUTPUT_BYTES - returnedOutputBytes,
      );
      const execution = await runDocker(
        ["exec", "-i", name, "/sandbox-bin/main"],
        {
          input: test.input,
          maxStdoutBytes: Math.min(
            request.limits.outputBytes,
            remainingOutputBytes,
          ),
          maxStderrBytes: request.limits.outputBytes,
          signal,
          timeoutMs: remainingTimeMs,
        },
      );

      if (execution.aborted) {
        return internalError(request, "The C++ execution request was aborted.");
      }
      if (execution.timedOut) {
        return {
          state: "time_limit_exceeded",
          passedTests: testResults.filter((result) => result.passed).length,
          totalTests: request.tests.length,
          errorText: "C++ execution exceeded the 2000 ms wall-clock limit.",
          testResults,
        };
      }
      if (execution.outputLimitExceeded) {
        return {
          state: "runtime_error",
          passedTests: testResults.filter((result) => result.passed).length,
          totalTests: request.tests.length,
          errorText: "C++ output exceeded the configured capture limit.",
          testResults,
        };
      }
      if (execution.exitCode !== 0) {
        return {
          state: "runtime_error",
          passedTests: testResults.filter((result) => result.passed).length,
          totalTests: request.tests.length,
          errorText: commandError(
            execution,
            "C++ exited with a non-zero status without error output.",
          ),
          testResults,
        };
      }

      const actualOutput = normalizeOutput(execution.stdout);
      returnedOutputBytes += Buffer.byteLength(actualOutput, "utf8");
      testResults.push({
        testId: test.id,
        passed: actualOutput === normalizeOutput(test.expectedOutput),
        actualOutput,
        visibility: test.visibility,
      });
    }

    return {
      state: "completed",
      passedTests: testResults.filter((result) => result.passed).length,
      totalTests: request.tests.length,
      testResults,
    };
  } catch (error) {
    return internalError(
      request,
      error instanceof Error
        ? error.message
        : "The C++ sandbox failed unexpectedly.",
    );
  } finally {
    await removeContainer(name);
  }
}
