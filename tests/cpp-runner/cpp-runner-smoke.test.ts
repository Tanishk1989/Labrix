import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCppRunnerServer } from "../../backend/runner/cpp/server";
import {
  CPP_RUNNER_OUTPUT_BYTES,
  CPP_RUNNER_WALL_TIME_MS,
  cppRunnerResponseSchema,
  type CppRunnerRequest,
  type CppRunnerResponse,
} from "../../backend/server/execution/cpp-runner-protocol";

const server = createCppRunnerServer();
let endpoint = "";

function payload(
  sourceCode: string,
  tests: CppRunnerRequest["tests"] = [
    {
      id: "visible-one",
      input: "2 3\n",
      expectedOutput: "5",
      visibility: "VISIBLE",
    },
  ],
) {
  return {
    language: "CPP" as const,
    sourceCode,
    tests,
    limits: {
      wallTimeMs: CPP_RUNNER_WALL_TIME_MS,
      outputBytes: CPP_RUNNER_OUTPUT_BYTES,
      network: "none" as const,
    },
  };
}

async function execute(sourceCode: string, tests?: Parameters<typeof payload>[1]) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload(sourceCode, tests)),
  });
  expect(response.status).toBe(200);
  return cppRunnerResponseSchema.parse(await response.json());
}

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      const address = server.address() as AddressInfo;
      endpoint = `http://127.0.0.1:${address.port}/v1/execute/cpp`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("local Docker C++ runner HTTP boundary", () => {
  it("compiles once and completes ordered visible and hidden tests", async () => {
    const result = await execute(
      `#include <iostream>
int main() {
  long long left = 0;
  long long right = 0;
  std::cin >> left >> right;
  std::cout << left + right << "\\n";
}`,
      [
        {
          id: "visible-one",
          input: "2 3\n",
          expectedOutput: "5",
          visibility: "VISIBLE",
        },
        {
          id: "hidden-one",
          input: "-4 9\n",
          expectedOutput: "5",
          visibility: "HIDDEN",
        },
      ],
    );

    expect(result).toEqual({
      state: "completed",
      passedTests: 2,
      totalTests: 2,
      testResults: [
        {
          testId: "visible-one",
          passed: true,
          actualOutput: "5",
          visibility: "VISIBLE",
        },
        {
          testId: "hidden-one",
          passed: true,
          actualOutput: "5",
          visibility: "HIDDEN",
        },
      ],
    } satisfies CppRunnerResponse);
  });

  it("maps compiler diagnostics to compilation_error", async () => {
    const result = await execute(`int main() {
  return missing_symbol;
}`);

    expect(result).toMatchObject({
      state: "compilation_error",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
    expect(result.errorText).toContain("error:");
  });

  it("maps a non-zero native exit to runtime_error", async () => {
    const result = await execute(`int main() {
  return 7;
}`);

    expect(result).toMatchObject({
      state: "runtime_error",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
  });

  it("kills an infinite loop and maps it to time_limit_exceeded", async () => {
    const result = await execute(`int main() {
  volatile unsigned long long counter = 0;
  while (true) { ++counter; }
}`);

    expect(result).toMatchObject({
      state: "time_limit_exceeded",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
  });

  it("rejects altered safety limits before contacting Docker", async () => {
    const request = payload("int main() { return 0; }");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...request,
        limits: { ...request.limits, network: "bridge" },
      }),
    });

    expect(response.status).toBe(400);
  });

  it("queues concurrent execution requests and executes them in sequence", async () => {
    let releaseExecution = () => {};
    let markStarted = () => {};
    let activeExecutions = 0;
    let maxObservedConcurrency = 0;
    const executionStarted = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const executionGate = new Promise<void>((resolve) => {
      releaseExecution = resolve;
    });
    const concurrentServer = createCppRunnerServer(
      async (request) => {
        activeExecutions++;
        maxObservedConcurrency = Math.max(maxObservedConcurrency, activeExecutions);
        markStarted();
        await executionGate;
        activeExecutions--;
        return {
          state: "completed",
          passedTests: 0,
          totalTests: request.tests.length,
          testResults: request.tests.map((test) => ({
            testId: test.id,
            passed: false,
            actualOutput: "",
            visibility: test.visibility,
          })),
        };
      },
      { maxConcurrency: 1, maxQueueSize: 10 },
    );

    await new Promise<void>((resolve, reject) => {
      concurrentServer.once("error", reject);
      concurrentServer.listen(0, "127.0.0.1", () => resolve());
    });
    const address = concurrentServer.address() as AddressInfo;
    const concurrentEndpoint =
      `http://127.0.0.1:${address.port}/v1/execute/cpp`;
    const firstRequest = fetch(concurrentEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload("int main() { return 0; }")),
    });
    await executionStarted;

    const secondRequest = fetch(concurrentEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload("int main() { return 0; }")),
    });

    releaseExecution();
    const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest]);
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(maxObservedConcurrency).toBe(1);

    await new Promise<void>((resolve, reject) => {
      concurrentServer.close((error) =>
        error ? reject(error) : resolve(),
      );
    });
  });
});
