import type { ExecutionMode } from "@/domain/execution/execution-mode";
import type {
  ServerExecutionProvider,
  ServerExecutionRequest,
  ServerExecutionResult,
  ServerExecutionState,
} from "./provider";

type FetchImplementation = typeof fetch;

interface WandboxProviderOptions {
  endpoint?: string;
  javaCompiler?: string;
  cppCompiler?: string;
  fetchImplementation?: FetchImplementation;
  requestTimeoutMs?: number;
  retryDelayMs?: number;
}

interface WandboxResponse {
  status?: string;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
}

const MAX_SOURCE_BYTES = 262_144;
const MAX_TEST_VALUE_BYTES = 65_536;
const MAX_TESTS = 100;
const MAX_OUTPUT_BYTES = 16_384;
const RETRYABLE_HTTP_STATUSES = new Set([502, 503, 504]);

class WandboxHttpError extends Error {
  constructor(readonly status: number) {
    super(`Wandbox returned ${status}.`);
  }
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function normalizedOutput(value: string | undefined) {
  return (value ?? "").replace(/\r\n?/g, "\n").trimEnd();
}

function bounded(value: string | undefined) {
  const normalized = normalizedOutput(value);
  return byteLength(normalized) <= MAX_OUTPUT_BYTES
    ? normalized
    : `${normalized.slice(0, MAX_OUTPUT_BYTES)}\n[output truncated]`;
}

function internalError(totalTests: number, errorText: string): ServerExecutionResult {
  return { state: "internal_error", passedTests: 0, totalTests, errorText, testResults: [] };
}

function requestFitsLimits(request: ServerExecutionRequest) {
  return byteLength(request.sourceCode) <= MAX_SOURCE_BYTES &&
    request.tests.length <= MAX_TESTS &&
    request.tests.every((test) =>
      byteLength(test.input) <= MAX_TEST_VALUE_BYTES &&
      byteLength(test.expectedOutput) <= MAX_TEST_VALUE_BYTES
    );
}

function responseState(response: WandboxResponse): ServerExecutionState {
  if (response.status === "0") return "completed";
  if (normalizedOutput(response.compiler_error)) return "compilation_error";
  if (normalizedOutput(response.program_error) || response.signal) return "runtime_error";
  return "internal_error";
}

function sourceForWandbox(request: ServerExecutionRequest) {
  // Wandbox saves the primary Java source as prog.java. A package-private
  // main class compiles there and runs identically to the public class.
  return request.language === "JAVA"
    ? request.sourceCode.replace(/\bpublic(\s+(?:(?:final|abstract)\s+)*class\s+[A-Za-z_$][\w$]*)/, "$1")
    : request.sourceCode;
}

export class WandboxExecutionProvider implements ServerExecutionProvider {
  readonly executionMode: ExecutionMode;
  private readonly endpoint: string;
  private readonly compiler: string;
  private readonly fetchImplementation: FetchImplementation;
  private readonly requestTimeoutMs: number;
  private readonly retryDelayMs: number;

  constructor(options: WandboxProviderOptions, language: "JAVA" | "CPP") {
    this.executionMode = language === "JAVA" ? "java-docker-remote" : "cpp-docker-remote";
    this.endpoint = options.endpoint ?? "https://wandbox.org/api/compile.json";
    this.compiler = language === "JAVA"
      ? (options.javaCompiler ?? "openjdk-jdk-21+35")
      : (options.cppCompiler ?? "gcc-13.2.0");
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 45_000;
    this.retryDelayMs = options.retryDelayMs ?? 750;
  }

  private async runTest(body: string, signal: AbortSignal): Promise<WandboxResponse> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.fetchImplementation(this.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          cache: "no-store",
          signal,
        });
        if (!response.ok) throw new WandboxHttpError(response.status);
        return await response.json() as WandboxResponse;
      } catch (error) {
        const retryable = !(error instanceof WandboxHttpError) || RETRYABLE_HTTP_STATUSES.has(error.status);
        if (attempt > 0 || signal.aborted || !retryable) throw error;
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
      }
    }
    throw new Error("Wandbox request failed after retry.");
  }

  async execute(request: ServerExecutionRequest): Promise<ServerExecutionResult> {
    if (!requestFitsLimits(request)) {
      return internalError(request.tests.length, "The free compiler request exceeded TRACE safety limits.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const responses: WandboxResponse[] = [];
      for (const test of request.tests) {
        responses.push(await this.runTest(JSON.stringify({
          code: sourceForWandbox(request),
          compiler: this.compiler,
          stdin: test.input,
          save: false,
        }), controller.signal));
      }

      const firstFailure = responses.find((response) => responseState(response) !== "completed");
      const state = firstFailure ? responseState(firstFailure) : "completed";
      const testResults = responses.map((response, index) => {
        const actualOutput = bounded(response.program_output);
        return {
          testId: request.tests[index].id,
          visibility: request.tests[index].visibility,
          actualOutput,
          passed: responseState(response) === "completed" &&
            actualOutput === normalizedOutput(request.tests[index].expectedOutput),
        };
      });
      const errorText = firstFailure
        ? bounded(
            firstFailure.compiler_error || firstFailure.compiler_message ||
            firstFailure.program_error || firstFailure.program_message ||
            "The free compiler could not complete this run.",
          )
        : undefined;
      return {
        state,
        passedTests: testResults.filter((test) => test.passed).length,
        totalTests: request.tests.length,
        ...(errorText ? { errorText } : {}),
        testResults,
      };
    } catch (error) {
      return internalError(
        request.tests.length,
        error instanceof WandboxHttpError && error.status === 429
          ? "The free compiler rate limit was reached. Please retry later."
          : "The zero-cost compiler is temporarily busy. Please retry in a moment.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
