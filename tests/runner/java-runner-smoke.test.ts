import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createJavaRunnerServer } from "../../runner/java/server";
import {
  JAVA_RUNNER_OUTPUT_BYTES,
  JAVA_RUNNER_WALL_TIME_MS,
  javaRunnerResponseSchema,
  type JavaRunnerRequest,
  type JavaRunnerResponse,
} from "../../src/server/execution/java-runner-protocol";

const server = createJavaRunnerServer();
let endpoint = "";

function payload(
  sourceCode: string,
  tests: JavaRunnerRequest["tests"] = [
    {
      id: "visible-one",
      input: "2 3\n",
      expectedOutput: "5",
      visibility: "VISIBLE",
    },
  ],
) {
  return {
    language: "JAVA" as const,
    sourceCode,
    tests,
    limits: {
      wallTimeMs: JAVA_RUNNER_WALL_TIME_MS,
      outputBytes: JAVA_RUNNER_OUTPUT_BYTES,
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
  return javaRunnerResponseSchema.parse(await response.json());
}

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      const address = server.address() as AddressInfo;
      endpoint = `http://127.0.0.1:${address.port}/v1/execute/java`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("local Docker Java runner HTTP boundary", () => {
  it("compiles once and completes ordered visible and hidden tests", async () => {
    const result = await execute(
      `import java.util.Scanner;
public class Main {
  public static void main(String[] args) {
    Scanner input = new Scanner(System.in);
    System.out.println(input.nextInt() + input.nextInt());
  }
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
    } satisfies JavaRunnerResponse);
  });

  it("maps compiler diagnostics to compilation_error", async () => {
    const result = await execute(`public class Main {
  public static void main(String[] args) {
    System.out.println("missing semicolon")
  }
}`);

    expect(result).toMatchObject({
      state: "compilation_error",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
    expect(result.errorText).toContain("error:");
  });

  it("maps a non-zero Java exit to runtime_error", async () => {
    const result = await execute(`public class Main {
  public static void main(String[] args) {
    throw new IllegalStateException("runner smoke failure");
  }
}`);

    expect(result).toMatchObject({
      state: "runtime_error",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
    expect(result.errorText).toContain("runner smoke failure");
  });

  it("kills an infinite loop and maps it to time_limit_exceeded", async () => {
    const result = await execute(`public class Main {
  public static void main(String[] args) {
    while (true) { }
  }
}`);

    expect(result).toMatchObject({
      state: "time_limit_exceeded",
      passedTests: 0,
      totalTests: 1,
      testResults: [],
    });
  });

  it("rejects altered safety limits before contacting Docker", async () => {
    const request = payload("public class Main {}");
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

  it("rejects a concurrent execution instead of queueing it", async () => {
    let releaseExecution = () => {};
    let markStarted = () => {};
    const executionStarted = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const executionGate = new Promise<void>((resolve) => {
      releaseExecution = resolve;
    });
    const concurrentServer = createJavaRunnerServer(async (request) => {
      markStarted();
      await executionGate;
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
    });

    await new Promise<void>((resolve, reject) => {
      concurrentServer.once("error", reject);
      concurrentServer.listen(0, "127.0.0.1", () => resolve());
    });
    const address = concurrentServer.address() as AddressInfo;
    const concurrentEndpoint =
      `http://127.0.0.1:${address.port}/v1/execute/java`;
    const firstRequest = fetch(concurrentEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload("public class Main {}")),
    });
    await executionStarted;

    const secondResponse = await fetch(concurrentEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload("public class Main {}")),
    });
    expect(secondResponse.status).toBe(503);

    releaseExecution();
    expect((await firstRequest).status).toBe(200);
    await new Promise<void>((resolve, reject) => {
      concurrentServer.close((error) =>
        error ? reject(error) : resolve(),
      );
    });
  });
});
