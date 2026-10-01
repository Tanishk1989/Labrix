import type { ExecutionMode } from "@/domain/execution/execution-mode";
import type {
  ServerExecutionProvider,
  ServerExecutionRequest,
  ServerExecutionResult,
  ServerExecutionState,
} from "./provider";

type FetchImplementation = typeof fetch;

interface Judge0ProviderOptions {
  baseUrl: string;
  apiKey?: string;
  authToken?: string;
  apiHost?: string;
  javaLanguageId?: number;
  cppLanguageId?: number;
  fetchImplementation?: FetchImplementation;
  requestTimeoutMs?: number;
  pollIntervalMs?: number;
}

type Judge0Submission = {
  token?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: { id?: number; description?: string };
};

const DEFAULT_JAVA_LANGUAGE_ID = 62;
const DEFAULT_CPP_LANGUAGE_ID = 54;
const MAX_SOURCE_BYTES = 262_144;
const MAX_TEST_VALUE_BYTES = 65_536;
const MAX_TESTS = 100;
const MAX_OUTPUT_BYTES = 16_384;

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function normalizedOutput(value: string | null | undefined) {
  return (value ?? "").replace(/\r\n?/g, "\n").trimEnd();
}

function bounded(value: string | null | undefined) {
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

function stateForStatus(statusId: number | undefined): ServerExecutionState {
  if (statusId === 6) return "compilation_error";
  if (statusId === 5) return "time_limit_exceeded";
  if (statusId !== undefined && statusId >= 7 && statusId <= 12) return "runtime_error";
  if (statusId === 3 || statusId === 4) return "completed";
  return "internal_error";
}

export class Judge0ExecutionProvider implements ServerExecutionProvider {
  readonly executionMode: ExecutionMode;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly authToken?: string;
  private readonly apiHost: string;
  private readonly javaLanguageId: number;
  private readonly cppLanguageId: number;
  private readonly fetchImplementation: FetchImplementation;
  private readonly requestTimeoutMs: number;
  private readonly pollIntervalMs: number;

  constructor(options: Judge0ProviderOptions, language: "JAVA" | "CPP") {
    this.executionMode = language === "JAVA" ? "java-docker-remote" : "cpp-docker-remote";
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.authToken = options.authToken;
    this.apiHost = options.apiHost ?? new URL(options.baseUrl).host;
    this.javaLanguageId = options.javaLanguageId ?? DEFAULT_JAVA_LANGUAGE_ID;
    this.cppLanguageId = options.cppLanguageId ?? DEFAULT_CPP_LANGUAGE_ID;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 45_000;
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
  }

  private headers() {
    return {
      "content-type": "application/json",
      ...(this.apiKey ? { "x-rapidapi-key": this.apiKey, "x-rapidapi-host": this.apiHost } : {}),
      ...(this.authToken ? { "x-auth-token": this.authToken } : {}),
    };
  }

  private async submit(request: ServerExecutionRequest, testIndex: number, signal: AbortSignal) {
    const test = request.tests[testIndex];
    const languageId = request.language === "JAVA" ? this.javaLanguageId : this.cppLanguageId;
    const response = await this.fetchImplementation(
      `${this.baseUrl}/submissions?base64_encoded=false&wait=false`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          source_code: request.sourceCode,
          language_id: languageId,
          stdin: test.input,
          expected_output: test.expectedOutput,
          cpu_time_limit: 2,
          wall_time_limit: 5,
          memory_limit: 128_000,
          max_processes_and_or_threads: 32,
          enable_network: false,
        }),
        cache: "no-store",
        signal,
      },
    );
    if (!response.ok) throw new Error(`Judge0 rejected a submission (${response.status}).`);
    const body = await response.json() as Judge0Submission;
    if (!body.token) throw new Error("Judge0 did not return a submission token.");
    return body.token;
  }

  private async poll(token: string, signal: AbortSignal): Promise<Judge0Submission> {
    while (!signal.aborted) {
      const response = await this.fetchImplementation(
        `${this.baseUrl}/submissions/${encodeURIComponent(token)}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status`,
        { headers: this.headers(), cache: "no-store", signal },
      );
      if (!response.ok) throw new Error(`Judge0 result lookup failed (${response.status}).`);
      const body = await response.json() as Judge0Submission;
      const statusId = body.status?.id;
      if (statusId !== 1 && statusId !== 2) return body;
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
    throw new Error("Judge0 execution timed out.");
  }

  async execute(request: ServerExecutionRequest): Promise<ServerExecutionResult> {
    if (!requestFitsLimits(request)) {
      return internalError(request.tests.length, "The Judge0 request exceeded TRACE safety limits.");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const results = [];
      for (let index = 0; index < request.tests.length; index += 1) {
        const token = await this.submit(request, index, controller.signal);
        results.push(await this.poll(token, controller.signal));
      }

      const firstFailure = results.find((result) => stateForStatus(result.status?.id) !== "completed");
      const state = firstFailure ? stateForStatus(firstFailure.status?.id) : "completed";
      const testResults = results.map((result, index) => {
        const actualOutput = bounded(result.stdout);
        return {
          testId: request.tests[index].id,
          visibility: request.tests[index].visibility,
          actualOutput,
          passed: result.status?.id === 3 && actualOutput === normalizedOutput(request.tests[index].expectedOutput),
        };
      });
      const errorText = firstFailure
        ? bounded(firstFailure.compile_output ?? firstFailure.stderr ?? firstFailure.message ?? firstFailure.status?.description)
        : undefined;
      return {
        state,
        passedTests: testResults.filter((test) => test.passed).length,
        totalTests: request.tests.length,
        ...(errorText ? { errorText } : {}),
        testResults,
      };
    } catch {
      return internalError(request.tests.length, "Judge0 Free was unavailable or its request limit was reached.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
