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
  if (normalizedOutput(response.compiler_error || response.compiler_message)) return "compilation_error";
  if (normalizedOutput(response.program_error || response.program_message) || response.signal) return "runtime_error";
  return response.status === "0" ? "completed" : "internal_error";
}

export class WandboxExecutionProvider implements ServerExecutionProvider {
  readonly executionMode: ExecutionMode;
  private readonly endpoint: string;
  private readonly compiler: string;
  private readonly fetchImplementation: FetchImplementation;
  private readonly requestTimeoutMs: number;

  constructor(options: WandboxProviderOptions, language: "JAVA" | "CPP") {
    this.executionMode = language === "JAVA" ? "java-docker-remote" : "cpp-docker-remote";
    this.endpoint = options.endpoint ?? "https://wandbox.org/api/compile.json";
    this.compiler = language === "JAVA"
      ? (options.javaCompiler ?? "openjdk-jdk-21+35")
      : (options.cppCompiler ?? "gcc-13.2.0");
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 45_000;
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
        const response = await this.fetchImplementation(this.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            code: request.sourceCode,
            compiler: this.compiler,
            stdin: test.input,
            save: false,
          }),
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Wandbox returned ${response.status}.`);
        responses.push(await response.json() as WandboxResponse);
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
    } catch {
      return internalError(
        request.tests.length,
        "The zero-cost compiler is temporarily busy. Please retry in a moment.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
