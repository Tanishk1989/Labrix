import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  JAVA_RUNNER_REQUEST_BYTES,
  JAVA_RUNNER_RESPONSE_BYTES,
  javaRunnerRequestSchema,
  type JavaRunnerRequest,
  type JavaRunnerResponse,
} from "../../server/execution/java-runner-protocol";
import {
  cleanupActiveJavaContainers,
  executeJavaInDocker,
} from "./docker-executor";

const RUNNER_HOST = "127.0.0.1";
const RUNNER_PORT = 4_010;
const EXECUTION_PATH = "/v1/execute/java";

type JavaExecutor = (
  request: JavaRunnerRequest,
  signal?: AbortSignal,
) => Promise<JavaRunnerResponse>;

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
    declaredLength > JAVA_RUNNER_REQUEST_BYTES
  ) {
    throw new RequestBodyError("Request body exceeded the limit.", 413);
  }

  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  for await (const value of request) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    receivedBytes += chunk.byteLength;
    if (receivedBytes > JAVA_RUNNER_REQUEST_BYTES) {
      throw new RequestBodyError("Request body exceeded the limit.", 413);
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function boundedResponse(
  request: JavaRunnerRequest,
  response: JavaRunnerResponse,
): JavaRunnerResponse {
  if (Buffer.byteLength(JSON.stringify(response)) <= JAVA_RUNNER_RESPONSE_BYTES) {
    return response;
  }
  return {
    state: "internal_error",
    passedTests: 0,
    totalTests: request.tests.length,
    errorText: "The Java runner response exceeded its safety limit.",
    testResults: [],
  };
}

export function createJavaRunnerServer(
  execute: JavaExecutor = executeJavaInDocker,
) {
  let executionInProgress = false;

  return createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/healthz") {
      writeJson(response, 200, { status: "ok" });
      return;
    }

    if (request.method !== "POST" || request.url !== EXECUTION_PATH) {
      writeJson(response, 404, { error: "Not found." });
      return;
    }

    if (!request.headers["content-type"]?.startsWith("application/json")) {
      writeJson(response, 415, { error: "Content-Type must be application/json." });
      return;
    }

    if (executionInProgress) {
      writeJson(response, 503, { error: "The local Java runner is busy." });
      return;
    }

    let parsedRequest: JavaRunnerRequest;
    try {
      const body = await readRequestBody(request);
      const parsed = javaRunnerRequestSchema.safeParse(JSON.parse(body));
      if (!parsed.success) {
        writeJson(response, 400, { error: "Invalid Java runner request." });
        return;
      }
      parsedRequest = parsed.data;
    } catch (error) {
      const statusCode = error instanceof RequestBodyError ? error.statusCode : 400;
      writeJson(response, statusCode, { error: "Invalid Java runner request." });
      return;
    }

    if (executionInProgress) {
      writeJson(response, 503, { error: "The local Java runner is busy." });
      return;
    }
    executionInProgress = true;
    const controller = new AbortController();
    let executionFinished = false;
    const abortExecution = () => {
      if (!executionFinished) controller.abort();
    };
    request.once("aborted", abortExecution);
    response.once("close", abortExecution);

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
          errorText: "The local Java runner failed unexpectedly.",
          testResults: [],
        });
      }
    } finally {
      request.removeListener("aborted", abortExecution);
      response.removeListener("close", abortExecution);
      executionInProgress = false;
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
  const server = createJavaRunnerServer();
  server.listen(RUNNER_PORT, RUNNER_HOST, () => {
    console.log(
      `TRACE local Java runner listening on http://${RUNNER_HOST}:${RUNNER_PORT}${EXECUTION_PATH}`,
    );
  });

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close();
    await cleanupActiveJavaContainers();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
