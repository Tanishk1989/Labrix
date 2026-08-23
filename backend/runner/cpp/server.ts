import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CPP_RUNNER_REQUEST_BYTES,
  CPP_RUNNER_RESPONSE_BYTES,
  cppRunnerRequestSchema,
  type CppRunnerRequest,
  type CppRunnerResponse,
} from "../../server/execution/cpp-runner-protocol";
import {
  cleanupActiveCppContainers,
  executeCppInDocker,
} from "./docker-executor";
import { boundedPositiveInteger } from "../config";
import { configuredRunnerBearerToken, runnerRequestIsAuthorized } from "../auth";

const RUNNER_HOST = "127.0.0.1";
const RUNNER_PORT = 4_020;
const EXECUTION_PATH = "/v1/execute/cpp";

type CppExecutor = (
  request: CppRunnerRequest,
  signal?: AbortSignal,
) => Promise<CppRunnerResponse>;

class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  value: unknown,
) {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    connection: "close",
    "content-length": Buffer.byteLength(body),
    "content-type": "application/json; charset=utf-8",
  });
  response.end(body);
}

async function readRequestBody(request: IncomingMessage) {
  const declaredLength = Number(request.headers["content-length"]);
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > CPP_RUNNER_REQUEST_BYTES
  ) {
    throw new RequestBodyError("Request body exceeded the limit.", 413);
  }

  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  for await (const value of request) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    receivedBytes += chunk.byteLength;
    if (receivedBytes > CPP_RUNNER_REQUEST_BYTES) {
      throw new RequestBodyError("Request body exceeded the limit.", 413);
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function boundedResponse(
  request: CppRunnerRequest,
  response: CppRunnerResponse,
): CppRunnerResponse {
  if (Buffer.byteLength(JSON.stringify(response)) <= CPP_RUNNER_RESPONSE_BYTES) {
    return response;
  }
  return {
    state: "internal_error",
    passedTests: 0,
    totalTests: request.tests.length,
    errorText: "The C++ runner response exceeded its safety limit.",
    testResults: [],
  };
}

export type RunnerServerOptions = {
  maxConcurrency?: number;
  maxQueueSize?: number;
  queueTimeoutMs?: number;
  bearerToken?: string;
};

export function createCppRunnerServer(
  execute: CppExecutor = executeCppInDocker,
  options?: RunnerServerOptions,
) {
  const maxConcurrency = options?.maxConcurrency ?? boundedPositiveInteger(
    process.env.RUNNER_MAX_CONCURRENCY,
    4,
    { max: 32 },
  );
  const maxQueueSize = options?.maxQueueSize ?? boundedPositiveInteger(
    process.env.RUNNER_MAX_QUEUE_SIZE,
    64,
    { max: 1_000 },
  );
  const queueTimeoutMs = options?.queueTimeoutMs ?? boundedPositiveInteger(
    process.env.RUNNER_QUEUE_TIMEOUT_MS,
    60_000,
    { min: 1_000, max: 600_000 },
  );
  const bearerToken = options?.bearerToken ?? configuredRunnerBearerToken();

  let activeWorkers = 0;
  const queue: Array<() => Promise<void>> = [];

  function processNext() {
    if (activeWorkers >= maxConcurrency || queue.length === 0) return;
    const nextTask = queue.shift();
    if (nextTask) {
      activeWorkers++;
      nextTask().finally(() => {
        activeWorkers--;
        processNext();
      });
    }
  }

  function enqueue(task: () => Promise<void>): Promise<void> {
    if (queue.length >= maxQueueSize) {
      return Promise.reject(new Error("QUEUE_FULL"));
    }
    return new Promise<void>((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null;
      let finished = false;

      const wrappedTask = async () => {
        if (finished) return;
        if (timer) clearTimeout(timer);
        try {
          await task();
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          finished = true;
        }
      };

      timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          const index = queue.indexOf(wrappedTask);
          if (index !== -1) queue.splice(index, 1);
          reject(new Error("QUEUE_TIMEOUT"));
        }
      }, queueTimeoutMs);

      queue.push(wrappedTask);
      processNext();
    });
  }

  return createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/healthz") {
      writeJson(response, 200, { status: "ok", activeWorkers, queueLength: queue.length });
      return;
    }

    if (request.method !== "POST" || request.url !== EXECUTION_PATH) {
      writeJson(response, 404, { error: "Not found." });
      return;
    }

    if (!runnerRequestIsAuthorized(request, bearerToken)) {
      writeJson(response, 401, { error: "Unauthorized." });
      return;
    }

    if (!request.headers["content-type"]?.startsWith("application/json")) {
      writeJson(response, 415, { error: "Content-Type must be application/json." });
      return;
    }

    let parsedRequest: CppRunnerRequest;
    try {
      const body = await readRequestBody(request);
      const parsed = cppRunnerRequestSchema.safeParse(JSON.parse(body));
      if (!parsed.success) {
        writeJson(response, 400, { error: "Invalid C++ runner request." });
        return;
      }
      parsedRequest = parsed.data;
    } catch (error) {
      const statusCode = error instanceof RequestBodyError ? error.statusCode : 400;
      writeJson(response, statusCode, { error: "Invalid C++ runner request." });
      return;
    }

    const controller = new AbortController();
    let executionFinished = false;
    const abortExecution = () => {
      if (!executionFinished) controller.abort();
    };
    request.once("aborted", abortExecution);
    response.once("close", abortExecution);

    try {
      await enqueue(async () => {
        if (controller.signal.aborted || response.destroyed) return;
        try {
          const result = await execute(parsedRequest, controller.signal);
          executionFinished = true;
          if (!response.destroyed) {
            writeJson(response, 200, boundedResponse(parsedRequest, result));
          }
        } catch {
          executionFinished = true;
          if (!response.destroyed) {
            writeJson(response, 500, {
              state: "internal_error",
              passedTests: 0,
              totalTests: parsedRequest.tests.length,
              errorText: "The local C++ runner failed unexpectedly.",
              testResults: [],
            });
          }
        }
      });
    } catch (err: unknown) {
      executionFinished = true;
      if (!response.destroyed) {
        const error = err as { message?: string };
        if (error?.message === "QUEUE_FULL") {
          writeJson(response, 503, { error: "The local C++ runner queue is full. Try again shortly." });
        } else if (error?.message === "QUEUE_TIMEOUT") {
          writeJson(response, 504, { error: "Request timed out waiting for an available C++ runner." });
        } else {
          writeJson(response, 500, { error: "The local C++ runner failed unexpectedly." });
        }
      }
    } finally {
      request.removeListener("aborted", abortExecution);
      response.removeListener("close", abortExecution);
    }
  });
}

function isEntrypoint() {
  return Boolean(
    process.argv[1] &&
      path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)),
  );
}

if (isEntrypoint()) {
  const server = createCppRunnerServer();
  server.listen(RUNNER_PORT, RUNNER_HOST, () => {
    console.log(
      `TRACE local C++ runner listening on http://${RUNNER_HOST}:${RUNNER_PORT}${EXECUTION_PATH}`,
    );
  });

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close();
    await cleanupActiveCppContainers();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
