import type {
  ServerExecutionProvider,
  ServerExecutionRequest,
  ServerExecutionResult,
} from "./provider";
import type { ExecutionMode } from "@/domain/execution/execution-mode";
import {
  CPP_RUNNER_HTTP_TIMEOUT_MS,
  CPP_RUNNER_MAX_TESTS,
  CPP_RUNNER_OUTPUT_BYTES,
  CPP_RUNNER_RESPONSE_BYTES,
  CPP_RUNNER_SOURCE_BYTES,
  CPP_RUNNER_TEST_VALUE_BYTES,
  CPP_RUNNER_WALL_TIME_MS,
  cppRunnerResponseSchema,
} from "./cpp-runner-protocol";

type FetchImplementation = typeof fetch;

interface CppHttpExecutionProviderOptions {
  endpoint: string;
  bearerToken?: string;
  executionMode?: Extract<ExecutionMode, "cpp-docker-local" | "cpp-docker-remote">;
  fetchImplementation?: FetchImplementation;
  requestTimeoutMs?: number;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function requestFitsRunnerLimits(request: ServerExecutionRequest) {
  return (
    byteLength(request.sourceCode) <= CPP_RUNNER_SOURCE_BYTES &&
    request.tests.length <= CPP_RUNNER_MAX_TESTS &&
    request.tests.every(
      (test) =>
        byteLength(test.input) <= CPP_RUNNER_TEST_VALUE_BYTES &&
        byteLength(test.expectedOutput) <= CPP_RUNNER_TEST_VALUE_BYTES,
    )
  );
}

function responseMatchesRequest(
  result: ServerExecutionResult,
  request: ServerExecutionRequest,
) {
  if (result.totalTests !== request.tests.length) return false;
  const requestedTests = new Map(
    request.tests.map((test) => [test.id, test.visibility]),
  );
  const returnedIds = new Set<string>();
  for (const test of result.testResults) {
    if (
      returnedIds.has(test.testId) ||
      requestedTests.get(test.testId) !== test.visibility
    ) {
      return false;
    }
    returnedIds.add(test.testId);
  }
  const calculatedPassed = result.testResults.filter(
    (test) => test.passed,
  ).length;
  if (result.state === "completed") {
    return (
      result.testResults.length === request.tests.length &&
      result.passedTests === calculatedPassed
    );
  }
  return result.passedTests <= calculatedPassed;
}

function internalError(
  totalTests: number,
  message: string,
): ServerExecutionResult {
  return {
    state: "internal_error",
    passedTests: 0,
    totalTests,
    errorText: message,
    testResults: [],
  };
}

async function readBoundedResponse(response: Response) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > CPP_RUNNER_RESPONSE_BYTES
  ) {
    throw new Error("Runner response exceeded the configured limit.");
  }

  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > CPP_RUNNER_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("Runner response exceeded the configured limit.");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

/**
 * Opt-in adapter for a separate local C++ runner service.
 * It never invokes C++, Docker, or a child process inside Next.js.
 */
export class CppHttpExecutionProvider implements ServerExecutionProvider {
  readonly executionMode: Extract<ExecutionMode, "cpp-docker-local" | "cpp-docker-remote">;

  private readonly endpoint: string;
  private readonly bearerToken?: string;
  private readonly fetchImplementation: FetchImplementation;
  private readonly requestTimeoutMs: number;

  constructor(options: CppHttpExecutionProviderOptions) {
    this.executionMode = options.executionMode ?? "cpp-docker-local";
    this.endpoint = options.endpoint;
    this.bearerToken = options.bearerToken;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.requestTimeoutMs =
      options.requestTimeoutMs ?? CPP_RUNNER_HTTP_TIMEOUT_MS;
  }

  async execute(
    request: ServerExecutionRequest,
  ): Promise<ServerExecutionResult> {
    if (request.language !== "CPP") {
      return internalError(
        request.tests.length,
        "The local C++ runner supports C++ requests only.",
      );
    }
    if (!requestFitsRunnerLimits(request)) {
      return internalError(
        request.tests.length,
        "The C++ execution request exceeded the planned runner safety limits.",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await this.fetchImplementation(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.bearerToken
            ? { authorization: `Bearer ${this.bearerToken}` }
            : {}),
        },
        body: JSON.stringify({
          language: "CPP",
          sourceCode: request.sourceCode,
          tests: request.tests,
          limits: {
            wallTimeMs: CPP_RUNNER_WALL_TIME_MS,
            outputBytes: CPP_RUNNER_OUTPUT_BYTES,
            network: "none",
          },
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        return internalError(
          request.tests.length,
          "The local C++ runner was unavailable.",
        );
      }

      const body = await readBoundedResponse(response);
      const parsed = cppRunnerResponseSchema.safeParse(JSON.parse(body));
      if (!parsed.success) {
        return internalError(
          request.tests.length,
          "The local C++ runner returned an invalid response.",
        );
      }
      if (!responseMatchesRequest(parsed.data, request)) {
        return internalError(
          request.tests.length,
          "The local C++ runner returned inconsistent test results.",
        );
      }
      return parsed.data;
    } catch {
      return internalError(
        request.tests.length,
        "The local C++ runner did not return a safe response in time.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
